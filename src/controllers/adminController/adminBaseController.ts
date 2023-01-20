import TokenManager from '../../lib/tokenManager';
import GenericController from '../GenericController';
import { GenericObject, GenericServiceCallback } from '../../definations';

class AdminBaseController extends GenericController {
  declare private ERROR;
  declare private CONFIG;

  constructor() {
    super();
    this.ERROR = this.config.APP_CONSTANTS.STATUS_MSG.ERROR;
  }

  adminLogin = (payload, callback) => {
    const emailId = payload.emailId;
    const password = payload.password;
    let userFound: GenericObject;
    let accessToken: string;
    let successLogin = false;
    this.async.series(
      [
        (cb) => {
          this.services.AdminService?.getRecord({ emailId: emailId }, {}, {}, (err, result) => {
            if (err) cb(err);
            else {
              userFound = (result && result[0]) || null;
              cb(null, result);
            }
          });
        },
        (cb) => {
          //validations
          if (!userFound)
            cb(this.ERROR.USER_NOT_FOUND as any);
          else {
            if (userFound && userFound.password != this.utils.CryptData(password)) {
              cb(this.ERROR.INCORRECT_PASSWORD as any);
            } else if (userFound.isBlocked == true) {
              cb(this.ERROR.ACCOUNT_BLOCKED as any);
            } else {
              successLogin = true;
              cb();
            }
          }
        },
        (cb) => {
          this.services.AdminService?.getRecord({ emailId: emailId }, { password: 0 }, {}, (err, result) => {
            if (err) return cb(err);
            userFound = (result && result[0]) || null;
            cb();
          });
        },
        (cb) => {
          if (successLogin) {
            const tokenData = {
              id: userFound._id,
              type: this.config.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN
            };
            TokenManager.setToken(tokenData, payload.deviceData, (err, result) => {
              if (err) {
                cb(err as any);
              } else {
                if (result && result.accessToken) {
                  accessToken = result && result.accessToken;
                  cb();
                } else {
                  cb(this.ERROR.IMP_ERROR as any);
                }
              }
            });
          } else {
            cb(this.ERROR.IMP_ERROR as any);
          }
        }
      ],
      (err) => {
        if (err) return callback(err);
        callback(null, {
          accessToken: accessToken,
          adminDetails: userFound
        });
      }
    );
  }

  accessTokenLogin(payload, callback) {
    let userFound = null;
    const userData = payload;
    this.async.series(
      [
        (cb) => {
          this.services.AdminService?.getRecord({ _id: userData.adminId }, { password: 0 }, {}, (err, data) => {
            if (err) return cb(err);
            if (data.length == 0) return cb(this.ERROR.INCORRECT_ACCESSTOKEN);
            userFound = (data && data[0]) || null;
            cb();
          });
        },
      ],
      (err) => {
        if (!err)
          return callback(null, {
            accessToken: userData.accessToken,
            adminDetails: this.utils.deleteUnnecessaryUserData(userFound),
            appVersion: {
              latestIOSVersion: 100,
              latestAndroidVersion: 100,
              criticalAndroidVersion: 100,
              criticalIOSVersion: 100
            }
          });
        callback(err);
      }
    );
  }

  createAdmin(userData, payloadData, callback) {
    let newAdmin;
    let userFound;
    this.async.series(
      [
        (cb) => {
          const criteria = {
            _id: userData.adminId
          };
          this.services.AdminService?.getRecord(criteria, { password: 0 }, {}, (err, data) => {
            if (err) cb(err);
            else {
              if (data.length == 0) cb(this.ERROR.INCORRECT_ACCESSTOKEN);
              else {
                userFound = this.convert.toObjectArray(data) && data[0] || null;
                if (userFound.userType != this.config.APP_CONSTANTS.DATABASE.USER_ROLES.SUPERADMIN) cb(this.ERROR.PRIVILEGE_MISMATCH);
                else cb();
              }
            }
          });
        },
        (cb) => {
          const criteria = {
            emailId: payloadData.emailId
          }
          this.services.AdminService?.getRecord(criteria, {}, {}, (err, data) => {
            if (err) cb(err)
            else {
              if (data.length > 0) cb(this.ERROR.USERNAME_EXIST)
              else cb()
            }
          })
        },
        (cb) => {
          payloadData.initialPassword = this.utils.generateRandomString();
          payloadData.password = this.utils.CryptData(payloadData.initialPassword);
          payloadData.userType = this.config.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN;
          this.services.AdminService?.createRecord(payloadData, (err, data) => {
            if (err) cb(err)
            else {
              newAdmin = data;
              cb()
            }
          })
        }
      ],
      (err) => {
        if (err) return callback(err);
        callback(null, { adminDetails: this.utils.deleteUnnecessaryUserData(newAdmin) });
      }
    );
  }

  getAdmin(userData, callback) {
    let adminList = [];
    let userFound;
    this.async.series([
      (cb) => {
        const criteria = {
          _id: userData.adminId
        };
        this.services.AdminService?.getRecord(criteria, { password: 0 }, {}, (err, data) => {
          if (err) cb(err);
          else {
            if (data.length == 0) cb(this.ERROR.INCORRECT_ACCESSTOKEN);
            else {
              userFound = (data && data[0]) || null;
              if (userFound.userType != this.config.APP_CONSTANTS.DATABASE.USER_ROLES.SUPERADMIN) cb(this.ERROR.PRIVILEGE_MISMATCH);
              else cb();
            }
          }
        });
      },
      (cb) => {
        this.services.AdminService?.getRecord({
          userType: this.config.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN
        }, { password: 0, __v: 0, createdAt: 0 }, {}, (err, data) => {
          if (err) cb(err)
          else {
            adminList = data;
            cb()
          }
        })
      }
    ], (err) => {
      if (err) callback(err)
      else callback(null, { data: adminList })
    })
  }

  blockUnblockAdmin = (userData, payloadData, callback) => {
    let userFound;
    this.async.series([
      (cb) => {
        const criteria = {
          _id: userData.adminId
        };
        this.services.AdminService?.getRecord(criteria, { password: 0 }, {}, (err, data) => {
          if (err) cb(err);
          else {
            if (data.length == 0) cb(this.ERROR.INCORRECT_ACCESSTOKEN);
            else {
              userFound = (data && data[0]) || null;
              if (userFound.userType != this.config.APP_CONSTANTS.DATABASE.USER_ROLES.SUPERADMIN) cb(this.ERROR.PRIVILEGE_MISMATCH);
              else cb();
            }
          }
        });
      },
      (cb) => {
        this.services.AdminService?.getRecord({ _id: payloadData.adminId }, {}, {}, (err, data) => {
          if (err) cb(err)
          else {
            if (data.length == 0) cb(this.ERROR.USER_NOT_FOUND)
            else cb()
          }
        })
      },
      (cb) => {
        this.services.AdminService?.updateRecord({ _id: payloadData.adminId }, {
          $set: {
            isBlocked: payloadData.block
          }
        }, {}, (err, data) => {
          if (err) return cb(err)
          userFound = data;
          cb()
        })
      }
    ], (err) => {
      if (err) return callback(err)
      callback(null, userFound)
    })
  }


  createUser(userData, payloadData, callback) {
    let newUserData;
    this.async.series([
      (cb) => {
        const criteria = {
          _id: userData.adminId
        };
        this.services.AdminService?.getRecord(criteria, { password: 0 }, {}, (err, data) => {
          if (err) return cb(err);
          if (data.length == 0) return cb(this.ERROR.INCORRECT_ACCESSTOKEN);
          cb();
        });
      },
      (cb) => {
        this.services.UserService?.getRecord({ emailId: payloadData.emailId }, {}, {}, (err, data) => {
          if (err) return cb(err);
          if (data.length != 0) return cb(this.ERROR.USER_ALREADY_REGISTERED);
          cb();
        })
      },
      (cb) => {
        payloadData.initialPassword = this.utils.generateRandomString();
        payloadData.password = this.utils.CryptData(payloadData.initialPassword);
        payloadData.emailVerified = true;
        this.services.UserService?.createRecord(payloadData, (err, data) => {
          if (err) cb(err)
          else {
            newUserData = data;
            cb()
          }
        })
      }
    ], (err) => {
      if (err) callback(err)
      else callback(null, { userData: this.utils.deleteUnnecessaryUserData(newUserData) })
    })
  }

  getUser = (userData, callback) => {
    let userList = [];
    let userFound: GenericObject | null;
    this.async.series([
      (cb) => {
        this.services.AdminService?.getRecord({ _id: userData.adminId }, { password: 0 }, {}, (err, data) => {
          if (err) cb(err);
          else {
            if (data.length == 0) cb(this.ERROR.INCORRECT_ACCESSTOKEN);
            else {
              userFound = (this.convert.toObjectArray(data) && data[0]) || null;
              if (userFound?.isBlocked == true) cb(this.ERROR.ACCOUNT_BLOCKED)
              else cb()
            }
          }
        });
      },
      (cb) => {
        const projection = {
          password: 0,
          accessToken: 0,
          OTPCode: 0,
          code: 0,
          codeUpdatedAt: 0,
          __v: 0,
          registrationDate: 0
        }
        this.services.UserService?.getRecord({}, projection, {}, (err, data) => {
          if (err) cb(err)
          else {
            userList = data;
            cb()
          }
        })
      }
    ], (err) => {
      if (err) return callback(err)
      callback(null, { data: userList })
    })
  }

  logoutAdmin(tokenData, callback) {
    this.services.TokenService.deleteRecord({ _id: tokenData._id }, (err) => {
      if (err) callback(err);
      else callback();
    });
  }

  changePassword(userData, payloadData, callbackRoute) {
    const oldPassword = this.utils.CryptData(payloadData.oldPassword);
    const newPassword = this.utils.CryptData(payloadData.newPassword);
    let customerData;
    this.async.series(
      [
        (cb) => {
          const query = {
            _id: userData.adminId
          };
          const options = { lean: true };
          this.services.AdminService?.getRecord(query, {}, options, (err, data) => {
            if (err) {
              cb(err);
            } else {
              if (data.length == 0) cb(this.ERROR.INCORRECT_ACCESSTOKEN);
              else {
                customerData = (data && data[0]) || null;
                if (customerData.isBlocked) cb(this.ERROR.ACCOUNT_BLOCKED);
                else cb();
              }
            }
          });
        },
        (callback) => {
          const query = {
            _id: userData.adminId
          };
          const projection = {
            password: 1,
            firstLogin: 1
          };
          const options = { lean: true };
          this.services.AdminService?.getRecord(query, projection, options, (
            err,
            data
          ) => {
            if (err) {
              callback(err);
            } else {
              customerData = (data && data[0]) || null;
              if (customerData == null) {
                callback(this.ERROR.NOT_FOUND);
              } else {
                if (payloadData.skip == false) {
                  if (
                    data[0].password == oldPassword &&
                    data[0].password != newPassword
                  ) {
                    callback(null);
                  } else if (data[0].password != oldPassword) {
                    callback(this.ERROR.WRONG_PASSWORD);
                  } else if (data[0].password == newPassword) {
                    callback(this.ERROR.NOT_UPDATE);
                  }
                }
                else callback(null)
              }
            }
          });
        },
        (callback) => {
          let dataToUpdate;
          if (payloadData.skip == true && customerData.firstLogin == false) {
            dataToUpdate = { $set: { firstLogin: true }, $unset: { initialPassword: 1 } };
          }
          else if (payloadData.skip == false && customerData.firstLogin == false) {
            dataToUpdate = { $set: { password: newPassword, firstLogin: true }, $unset: { initialPassword: 1 } };
          }
          else if (payloadData.skip == true && customerData.firstLogin == true) {
            dataToUpdate = {}
          }
          else {
            dataToUpdate = { $set: { password: newPassword } };
          }
          this.services.AdminService?.updateRecord({ _id: userData.adminId }, dataToUpdate, {}, (err, user) => {
            if (err) {
              callback(err);
            } else {
              if (!user || user.length == 0) {
                callback(this.ERROR.NOT_FOUND);
              } else {
                callback(null);
              }
            }
          });
        }
      ],
      (error) => {
        if (error) return callbackRoute(error);
        callbackRoute(null);
      }
    )
  }

  blockUnblockUser(userData, payloadData, callback) {
    let userFound;
    this.async.series([
      (cb) => {
        this.services.AdminService?.getRecord({
          _id: userData.adminId
        }, { password: 0 }, {}, (err, data) => {
          if (err) cb(err);
          else {
            if (data.length == 0) cb(this.ERROR.INCORRECT_ACCESSTOKEN);
            else {
              userFound = (data && data[0]) || null;
              if (userFound.isBlocked == true) cb(this.ERROR.ACCOUNT_BLOCKED)
              else cb()
            }
          }
        });
      },
      (cb) => {
        this.services.UserService?.getRecord({ _id: payloadData.userId }, {}, {}, (err, data) => {
          if (err) cb(err)
          else {
            if (data.length == 0) cb(this.ERROR.USER_NOT_FOUND)
            else cb()
          }
        })
      },
      (cb) => {
        const criteria = {
          _id: payloadData.userId
        }
        const dataToUpdate = {
          $set: {
            isBlocked: payloadData.block
          }
        }
        this.services.UserService?.updateRecord(criteria, dataToUpdate, {}, (err, data) => {
          if (err) return cb(err);
          userFound = data;
          cb()
        })
      }
    ], (err) => {
      if (err) return callback(err);
      callback(null, userFound)
    })
  }
}

export default new AdminBaseController();

