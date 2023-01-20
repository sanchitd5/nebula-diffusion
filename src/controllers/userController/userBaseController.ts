import GenericController from "../GenericController";
import TokenManager from "../../lib/tokenManager";
import * as CodeGenerator from "../../lib/codeGenerator";
import { GenericObject, GenericServiceCallback } from "../../definations";

class UserBaseController extends GenericController {
  private declare ERROR;
  constructor() {
    super();
    this.ERROR = this.config.APP_CONSTANTS.STATUS_MSG.ERROR;
  }


  createUser = (
    payloadData: GenericObject,
    callback: GenericServiceCallback
  ) => {
    let accessToken: string | null;
    let uniqueCode: number;
    const dataToSave = payloadData;
    if (dataToSave.password)
      dataToSave.password = this.utils.CryptData(dataToSave.password);
    let customerData: GenericObject;
    let appVersion: GenericObject;
    if (this.services.UserService)
      this.async.series(
        [
          (cb) => {
            const query = {
              $or: [{ emailId: payloadData.emailId }],
            };
            this.services.UserService?.getRecord(
              query,
              {},
              { lean: true },
              (error, data) => {
                if (error) cb(error as Error);
                else if (this.convert.toObjectArray(data)) {
                  if (!data.length) return cb();
                  if (data[0].emailVerified == true)
                    return cb(this.ERROR.USER_ALREADY_REGISTERED as any);
                  this.services.UserService?.deleteRecord(
                    { _id: data[0]._id },
                    (err) => {
                      if (err) return cb(err as Error);
                      cb(null);
                    }
                  );
                } else cb();
              }
            );
          },
          (cb) => {
            //Validate for facebookId and password
            if (!dataToSave.password) cb(this.ERROR.PASSWORD_REQUIRED as any);
            else cb();
          },
          (cb) => {
            //Validate countryCode
            if (dataToSave.countryCode.lastIndexOf("+") == 0) {
              if (!isFinite(dataToSave.countryCode.substr(1))) {
                cb(this.ERROR.INVALID_COUNTRY_CODE as any);
              } else cb();
            } else cb(this.ERROR.INVALID_COUNTRY_CODE as any);
          },
          (cb) => {
            //Validate phone No
            if (
              dataToSave.phoneNumber &&
              dataToSave.phoneNumber.split("")[0] == 0
            )
              cb(this.ERROR.INVALID_PHONE_NO_FORMAT as any);
            else cb();
          },
          (cb) => {
            CodeGenerator.generateUniqueCode(
              6,
              this.config.APP_CONSTANTS.DATABASE.USER_ROLES.USER,
              (err, numberObj: GenericObject) => {
                if (err) cb(err);
                else {
                  if (!numberObj || numberObj.number == null)
                    cb(this.ERROR.UNIQUE_CODE_LIMIT_REACHED as any);
                  else {
                    uniqueCode = numberObj.number;
                    cb();
                  }
                }
              }
            );
          },
          (cb) => {
            //Insert Into DB
            dataToSave.OTPCode = uniqueCode;
            dataToSave.phoneNumber = payloadData.phoneNumber;
            dataToSave.registrationDate = new Date().toISOString();
            dataToSave.firstLogin = true;
            this.services.UserService?.createRecord(
              dataToSave,
              (err: any, customerDataFromDB: any) => {
                if (err) {
                  if (
                    err.code == 11000 &&
                    err.message.indexOf("emailId_1") > -1
                  ) {
                    cb(this.ERROR.EMAIL_NO_EXIST as any);
                  } else {
                    cb(err);
                  }
                }
                customerData = customerDataFromDB;
                cb();
              }
            );
          },
          (cb) => {
            //Set Access Token
            if (!customerData) return cb(this.ERROR.IMP_ERROR as any);
            const tokenData = {
              id: customerData._id,
              type: this.config.APP_CONSTANTS.DATABASE.USER_ROLES.USER,
            };
            const deviceData: {
              deviceName: string;
              deviceType: string;
              deviceUUID: string;
            } = {
              deviceName: payloadData.deviceData.deviceName,
              deviceType: payloadData.deviceData.deviceType,
              deviceUUID: payloadData.deviceData.deviceUUID,
            };
            TokenManager.setToken(tokenData, deviceData, (err, result) => {
              if (err) return cb(err as Error);
              accessToken = result?.accessToken || null;
              cb();
            });
          },
          (cb) => {
            appVersion = {
              latestIOSVersion: 100,
              latestAndroidVersion: 100,
              criticalAndroidVersion: 100,
              criticalIOSVersion: 100,
            };
            cb(null);
          },
        ],
        (err) => {
          if (err) callback(err);
          else {
            callback(null, {
              accessToken: accessToken,
              otpCode: customerData.OTPCode,
              userDetails: this.utils.deleteUnnecessaryUserData(customerData),
              appVersion: appVersion,
            });
          }
        }
      );
  };

  /**
   *
   * @param {Object} payload Payload
   * @param {Object} payload.userData UserData
   * @param {any} payload.data Payload Data
   * @param {Function} callback Callback Function
   */
  verifyOTP = (
    payload: { userData: GenericObject; data: GenericObject },
    callback: GenericServiceCallback
  ) => {
    const userData: GenericObject = payload.userData;
    const payloadData: GenericObject = payload.data;
    let customerData: GenericObject;
    this.async.series(
      [
        (cb) => {
          const query = {
            _id: userData.userId,
          };
          const options = { lean: true };
          this.services.UserService?.getRecord(
            query,
            {},
            options,
            (err, data) => {
              if (err) return cb(err as Error); 
              if (this.convert.toObjectArray(data)) customerData = data[0];
              cb();
            }
          );
        },
        (cb) => {
          //Check verification code :
          if (payloadData.OTPCode == customerData.OTPCode) cb();
          else cb(this.ERROR.INVALID_CODE as any);
        },
        (cb) => {
          //trying to update customer
          const criteria = {
            _id: userData.userId,
            OTPCode: payloadData.OTPCode,
          };
          const setQuery = {
            $set: { emailVerified: true },
            $unset: { OTPCode: 1 },
          };
          const options = { new: true };
          this.services.UserService?.updateRecord(
            criteria,
            setQuery,
            options,
            (err, updatedData) => {
              if (err) cb(err as Error);
              else {
                if (!updatedData) cb(this.ERROR.INVALID_CODE as any);
                else cb();
              }
            }
          );
        },
      ],
      (err) => {
        if (err) return callback(err);
        callback(null);
      }
    );
  };

  loginUser = (payloadData: any, callback: GenericServiceCallback) => {
    let userFound: GenericObject | null = null;
    let accessToken: string;
    let successLogin = false;
    let appVersion: GenericObject;
    let updatedUserDetails: GenericObject;
    this.async.series(
      [
        (cb) => {
          const criteria = { emailId: payloadData.emailId };
          const option = { lean: true };
          this.services.UserService?.getRecord(
            criteria,
            {},
            option,
            (err, result) => {
              if (err) cb(err as Error);
              else {
                if (this.convert.toObjectArray(result))
                  userFound = result[0] || null;
                cb();
              }
            }
          );
        },
        (cb) => {
          //validations
          if (!userFound) cb(this.ERROR.USER_NOT_FOUND as any);
          else {
            if (userFound.isBlocked) cb(this.ERROR.ACCOUNT_BLOCKED as any);
            else {
              if (
                userFound &&
                userFound.password != this.utils.CryptData(payloadData.password)
              ) {
                cb(this.ERROR.INCORRECT_PASSWORD as any);
              } else if (userFound.emailVerified == false) {
                cb(this.ERROR.NOT_REGISTERED as any);
              } else {
                successLogin = true;
                cb();
              }
            }
          }
        },
        (cb) => {
          if (this.convert.toObject(userFound)) {
            const criteria = {
              _id: userFound._id,
            };
            const setQuery = {
              deviceToken: payloadData.deviceToken,
              deviceType: payloadData.deviceType,
            };
            this.services.UserService?.updateRecord(
              criteria,
              setQuery,
              { new: true },
              (err, data) => {
                if (this.convert.toObject(data)) updatedUserDetails = data;
                cb(err as Error, data);
              }
            );
          } else cb(this.ERROR.USER_NOT_FOUND as any);
        },
        (cb) => {
          const criteria = { emailId: payloadData.emailId };
          const projection = {
            password: 0,
            accessToken: 0,
            initialPassword: 0,
            OTPCode: 0,
            code: 0,
            codeUpdatedAt: 0,
          };
          const option = { lean: true };
          this.services.UserService?.getRecord(
            criteria,
            projection,
            option,
            (err, result) => {
              if (err) cb(err as Error);
              else if (this.convert.toObjectArray(result)) {
                userFound = (result && result[0]) || null;
                cb();
              } else cb();
            }
          );
        },
        (cb) => {
          if (successLogin && this.convert.toObject(userFound)) {
            const tokenData = {
              id: userFound._id,
              type: this.config.APP_CONSTANTS.DATABASE.USER_ROLES.USER,
            };
            return TokenManager.setToken(
              tokenData,
              payloadData.deviceData,
              (err, output) => {
                if (err) return cb(err as Error);
                if (output && output.accessToken) {
                  accessToken = output && output.accessToken;
                  cb();
                } else {
                  cb(this.ERROR.IMP_ERROR as any);
                }
              }
            );
          }
		  cb(this.ERROR.IMP_ERROR as any);
        },
        (cb) => {
          appVersion = {
            latestIOSVersion: 100,
            latestAndroidVersion: 100,
            criticalAndroidVersion: 100,
            criticalIOSVersion: 100,
          };
          cb(null);
        },
      ],
      (err) => {
        if (err) callback(err);
        else {
          callback(null, {
            accessToken: accessToken,
            userDetails:
              this.utils.deleteUnnecessaryUserData(updatedUserDetails),
            appVersion: appVersion,
          });
        }
      }
    );
  };

  resendOTP = (userData: any, callback: GenericServiceCallback) => {
    /*
			 Create a Unique 6 digit code
			 Insert It Into Customer DB
			 Send Back Response
			 */
    let uniqueCode: number;
    let customerData;
    this.async.series(
      [
        (cb) => {
          const query = {
            _id: userData.userId,
          };
          const options = { lean: true };
          this.services.UserService?.getRecord(
            query,
            {},
            options,
            (err, data) => {
              if (err) return cb(err as Error);
              if (this.convert.toObject(data)) {
                customerData = data[0] || null;
                if (customerData.emailVerified == true)
                  return cb(this.ERROR.EMAIL_VERIFICATION_COMPLETE as any);
              }
              cb();
            }
          );
        },
        (cb) => {
          CodeGenerator.generateUniqueCode(
            6,
            this.config.APP_CONSTANTS.DATABASE.USER_ROLES.USER,
            (err, numberObj: GenericObject) => {
              if (err) return cb(err);
              if (!numberObj || numberObj.number == null)
                return cb(this.ERROR.UNIQUE_CODE_LIMIT_REACHED as any);
              uniqueCode = numberObj.number;
              cb();
            }
          );
        },
        (cb) => {
          const criteria = {
            _id: userData.userId,
          };
          const setQuery = {
            $set: {
              OTPCode: uniqueCode,
              codeUpdatedAt: new Date().toISOString(),
            },
          };
          this.services.UserService?.updateRecord(criteria, setQuery, {}, cb);
        },
      ],
      (err) => {
        callback(err, { OTPCode: uniqueCode });
      }
    );
  };

  getOTP = (payloadData: any, callback: GenericServiceCallback) => {
    const query = {
      emailId: payloadData.emailId,
    };
    const projection = {
      _id: 0,
      OTPCode: 1,
    };
    this.services.UserService?.getRecord(query, projection, {}, (err, data) => {
      if (err) return callback(err);
      const customerData = (data && (data as any)[0]) || null;
      if (customerData == null || customerData.OTPCode == undefined)
        return callback(this.ERROR.OTP_CODE_NOT_FOUND);
      callback(null, customerData);
    });
  };

  accessTokenLogin = (payload: any, callback: GenericServiceCallback) => {
    let appVersion: any;
    const userData = payload;
    let userFound: any;
    this.async.series(
      [
        (cb) => {
          const criteria = {
            _id: userData.userId,
          };
          this.services.UserService?.getRecord(
            criteria,
            { password: 0 },
            {},
            (err, data) => {
              if (err) return cb(err);
              userFound = data && data[0];
              if (userFound.isBlocked)
                return cb(this.ERROR.ACCOUNT_BLOCKED as any);
              appVersion = {
                latestIOSVersion: 100,
                latestAndroidVersion: 100,
                criticalAndroidVersion: 100,
                criticalIOSVersion: 100,
              };
              cb();
            }
          );
        },
      ],
      (err) => {
        if (err) return callback(err);
        callback(null, {
          accessToken: userData.accessToken,
          userDetails: this.utils.deleteUnnecessaryUserData(userFound),
          appVersion: appVersion,
        });
      }
    );
  };

  logoutCustomer = (tokenData: any, callback: GenericServiceCallback) => {
    this.services.TokenService.deleteRecord({ _id: tokenData._id }, callback);
  };

  getProfile = (userData: any, callback: GenericServiceCallback) => {
    const query = {
      _id: userData.userId,
    };
    const projection = {
      __v: 0,
      password: 0,
      accessToken: 0,
      codeUpdatedAt: 0,
    };
    this.services.UserService?.getRecord(query, projection, {}, (err, data) => {
      if (err) return callback(err);
      const customerData = (data && data[0]) || null;
      if (customerData.isBlocked)
        return callback(this.ERROR.ACCOUNT_BLOCKED as any);
      callback(null, customerData);
    });
  };

  changePassword = (
    userData: any,
    payloadData: any,
    callbackRoute: GenericServiceCallback
  ) => {
    const oldPassword = this.utils.CryptData(payloadData.oldPassword);
    const newPassword = this.utils.CryptData(payloadData.newPassword);
    let customerData: any;
    this.async.series(
      [
        (cb) => {
          const query = {
            _id: userData.userId,
          };
          this.services.UserService?.getRecord(query, {}, {}, (err, data) => {
            if (err) return cb(err as Error);
            if (this.convert.toObjectArray(data)) {
              customerData = data[0] || null;
              if (customerData.isBlocked)
                return cb(this.ERROR.ACCOUNT_BLOCKED as any);
              return cb();
            }
            cb();
          });
        },
        (callback) => {
          const query = {
            _id: userData.userId,
          };
          const projection = {
            password: 1,
            firstLogin: 1,
          };
          this.services.UserService?.getRecord(
            query,
            projection,
            {},
            (err, data) => {
              if (err) return callback(err);
              customerData = (data && data[0]) || null;
              if (customerData == null)
                return callback(this.ERROR.NOT_FOUND as any);
              if (payloadData.skip == false) {
                if (
                  data[0].password == oldPassword &&
                  data[0].password != newPassword
                ) {
                  callback(null);
                } else if (data[0].password != oldPassword) {
                  callback(this.ERROR.WRONG_PASSWORD as any);
                } else if (data[0].password == newPassword) {
                  callback(this.ERROR.NOT_UPDATE as any);
                }
              } else callback(null);
            }
          );
        },
        (callback) => {
          let dataToUpdate;
          if (payloadData.skip == true && customerData.firstLogin == false) {
            dataToUpdate = {
              $set: { firstLogin: true },
              $unset: { initialPassword: 1 },
            };
          } else if (
            payloadData.skip == false &&
            customerData.firstLogin == false
          ) {
            dataToUpdate = {
              $set: { password: newPassword, firstLogin: true },
              $unset: { initialPassword: 1 },
            };
          } else if (
            payloadData.skip == true &&
            customerData.firstLogin == true
          ) {
            dataToUpdate = {};
          } else {
            dataToUpdate = { $set: { password: newPassword } };
          }
          const condition = { _id: userData.userId };
          this.services.UserService?.updateRecord(
            condition,
            dataToUpdate,
            {},
            (err, user) => {
              if (err) return callback(err as Error);
              if (
                !user ||
                (this.convert.toObjectArray(user) && user.length == 0)
              )
                return callback(this.ERROR.NOT_FOUND as any);
              callback();
            }
          );
        },
      ],
      (error) => {
        if (error) return callbackRoute(error);
        callbackRoute(null);
      }
    );
  };

  forgetPassword = (payloadData: any, callback: GenericServiceCallback) => {
    let dataFound: any;
    let code: any;
    let forgotDataEntry: any;
    this.async.series(
      [
        (cb) => {
          const query = {
            emailId: payloadData.emailId,
          };
          this.services.UserService?.getRecord(
            query,
            {
              _id: 1,
              emailId: 1,
              emailVerified: 1,
            },
            {},
            (err, data) => {
              if (err)
                return cb(this.ERROR.PASSWORD_CHANGE_REQUEST_INVALID as any);
              dataFound = (data && data[0]) || null;
              if (dataFound == null)
                return cb(this.ERROR.USER_NOT_REGISTERED as any);
              if (dataFound.emailVerified == false)
                return cb(this.ERROR.NOT_VERFIFIED as any);
              if (dataFound.isBlocked)
                return cb(this.ERROR.ACCOUNT_BLOCKED as any);
              cb();
            }
          );
        },
        (cb) => {
          CodeGenerator.generateUniqueCode(
            6,
            this.config.APP_CONSTANTS.DATABASE.USER_ROLES.USER,
            (err, numberObj: GenericObject) => {
              if (err) return cb(err);
              if (!numberObj || numberObj.number == null)
                return cb(this.ERROR.UNIQUE_CODE_LIMIT_REACHED as any);
              code = numberObj.number;
              cb();
            }
          );
        },
        (cb) => {
          const dataToUpdate = {
            code: code,
          };
          const query = {
            _id: dataFound._id,
          };
          this.services.UserService?.updateRecord(
            query,
            dataToUpdate,
            {},
            (err) => {
              if (err) return cb(err as Error);
              cb();
            }
          );
        },
        (cb) => {
          this.services.ForgetPasswordService.getRecord(
            { customerID: dataFound._id },
            {
              _id: 1,
              isChanged: 1,
            },
            { lean: 1 },
            (err, data) => {
              if (err) return cb(err as Error);
              forgotDataEntry =
                (this.convert.toObjectArray(data) && data[0]) || null;
              cb();
            }
          );
        },
        (cb) => {
          const data = {
            customerID: dataFound._id,
            requestedAt: Date.now(),
            userType: this.config.APP_CONSTANTS.DATABASE.USER_ROLES.USER,
            isChanged: true,
          };
          if (forgotDataEntry == null) {
            this.services.ForgetPasswordService.createRecord(data, cb);
          } else {
            if (forgotDataEntry.isChanged == true) {
              data.isChanged = false;
            }
            this.services.ForgetPasswordService.updateRecord(
              { _id: forgotDataEntry._id },
              data,
              {},
              cb
            );
          }
        },
      ],
      (error) => {
        if (error) {
          callback(error);
        } else {
          callback(null, { emailId: payloadData.emailId, OTPCode: code });
        }
      }
    );
  };

  resetPassword = (payloadData: any, callbackRoute: GenericServiceCallback) => {
    let foundData: any;
    let customerId: any;
    let data: GenericObject | null;
    this.async.series(
      [
        (callback) => {
          const query = {
            emailId: payloadData.emailId,
          };
          this.services.UserService?.getRecord(
            query,
            {
              _id: 1,
              code: 1,
              emailVerified: 1,
            },
            { lean: true },
            (err, result) => {
              if (err) {
                callback(err as Error);
              } else {
                if (this.convert.toObjectArray(result))
                  data = (result && result[0]) || null;
                if (data == null) {
                  callback(this.ERROR.INCORRECT_ID as any);
                } else {
                  if (payloadData.OTPCode != data.code) {
                    callback(this.ERROR.INVALID_CODE as any);
                  } else {
                    if (data.phoneVerified == false) {
                      callback(this.ERROR.NOT_VERFIFIED as any);
                    } else {
                      customerId = data._id;
                      callback();
                    }
                  }
                }
              }
            }
          );
        },
        (callback) => {
          const query = { customerID: customerId, isChanged: false };
          this.services.ForgetPasswordService.getRecord(
            query,
            { __v: 0 },
            {
              limit: 1,
              lean: true,
            },
            (err, data) => {
              if (err) {
                callback(err as Error);
              } else {
                if (this.convert.toObjectArray(data))
                  foundData = (data && data[0]) || null;
                callback();
              }
            }
          );
        },
        (callback) => {
          if (!this.utils.isEmpty(foundData)) {
            const minutes = this.utils.getRange(
              foundData.requestedAt,
              new Date(),
              this.config.APP_CONSTANTS.TIME_UNITS.MINUTES
            );
            if (minutes < 0 || minutes > 30) {
              return callback(this.ERROR.PASSWORD_CHANGE_REQUEST_EXPIRE as any);
            } else {
              callback();
            }
          } else {
            return callback(this.ERROR.PASSWORD_CHANGE_REQUEST_INVALID as any);
          }
        },
        (callback) => {
          const dataToUpdate = {
            password: this.utils.CryptData(payloadData.password),
          };
          this.services.UserService?.updateRecord(
            { _id: customerId },
            dataToUpdate,
            {},
            (error, result) => {
              if (error) {
                callback(error as Error);
              } else {
                if ((result as GenericObject).n === 0) {
                  callback(this.ERROR.USER_NOT_FOUND as any);
                } else {
                  callback();
                }
              }
            }
          );
        },
        (callback) => {
          const dataToUpdate = {
            isChanged: true,
            changedAt: this.utils.getTimestamp(),
          };
          this.services.ForgetPasswordService.updateRecord(
            { customerID: customerId },
            dataToUpdate,
            {
              lean: true,
            },
            callback
          );
        },
      ],
      (error) => {
        if (error) {
          callbackRoute(error);
        } else {
          callbackRoute(null);
        }
      }
    );
  };
}

export default new UserBaseController();
