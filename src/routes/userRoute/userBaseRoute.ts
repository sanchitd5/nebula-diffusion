import { ServerRoute } from '@hapi/hapi';
import * as Joi from "joi";
import { sendError, sendSuccess, failActionFunction, verifyEmailFormat } from "../../utils";
import Controller from "../../controllers";
import Config from '../../config';

const userRegister = {
  method: "POST",
  path: "/api/user/register",
  options: {
    description: "Register a new user",
    tags: ["api", "user"],
    handler: (request: any) => {
      const payloadData = request.payload;
      return new Promise((resolve, reject) => {
        if (!verifyEmailFormat(payloadData.emailId))
          reject(
            sendError(Config.APP_CONSTANTS.STATUS_MSG.ERROR
              .INVALID_EMAIL_FORMAT)
          );
        else {
          Controller.UserBaseController.createUser(payloadData, (err, data) => {
            if (err) reject(sendError(err));
            else resolve(
              sendSuccess(
                Config.APP_CONSTANTS.STATUS_MSG.SUCCESS
                  .CREATED,
                data
              )
            );
          });
        }
      });
    },
    validate: {
      payload: Joi.object({
        firstName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).required(),
        lastName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).required(),
        emailId: Joi.string().required(),
        phoneNumber: Joi.string().regex(/^[0-9]+$/).min(5).required(),
        countryCode: Joi.string().max(4).required().trim(),
        password: Joi.string().required().min(5)
      }).label("User: Register"),
      failAction: failActionFunction
    },
    plugins: {
      "hapi-swagger": {
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages
      }
    }
  }
};

const verifyOTP = {
  method: "PUT",
  path: "/api/user/OTP",
  options: {
    auth: "UserAuth",
    description: "Verify OTP for User",
    tags: ["api", "user"],
    handler: (request: any) => {
      const payloadData = request.payload;
      const userData = (request.auth && request.auth.credentials && request.auth.credentials.userData) || null;
      return new Promise((resolve, reject) => {
        Controller.UserBaseController.verifyOTP({ data: payloadData, userData }, (err, data) => {
          if (err) reject(sendError(err));
          else {
            resolve(
              sendSuccess(
                Config.APP_CONSTANTS.STATUS_MSG.SUCCESS
                  .VERIFY_COMPLETE,
                data
              )
            );
          }
        });
      });
    },
    validate: {
      payload: Joi.object({
        OTPCode: Joi.string().length(6).required()
      }).label("User: Verify OTP Model"),
      failAction: failActionFunction
    },
    plugins: {
      "hapi-swagger": {
        security: [{ 'user': {} }],
        responseMessages:
          Config.APP_CONSTANTS.swaggerDefaultResponseMessages
      }
    }
  }
};

const login = {
  method: "POST",
  path: "/api/user/login",
  options: {
    description: "Login Via Phone Number & Password For User",
    tags: ["api", "user"],
    handler: (request: any) => {
      const payloadData = request.payload;
      return new Promise((resolve, reject) => {
        if (!verifyEmailFormat(payloadData.emailId)) {
          reject(
            sendError(
              Config.APP_CONSTANTS.STATUS_MSG.ERROR
                .INVALID_EMAIL_FORMAT
            )
          );
        } else {
          Controller.UserBaseController.loginUser(payloadData, (err, data) => {
            if (err) reject(sendError(err));
            else resolve(sendSuccess(undefined, data));
          });
        }
      });

    },
    validate: {
      payload: Joi.object({
        emailId: Joi.string().required(),
        password: Joi.string().required().min(5).trim(),
        deviceData: Joi.object({
          deviceType: Joi.string().valid(...Object.values(Config.APP_CONSTANTS.DATABASE.DEVICE_TYPES)).required(),
          deviceName: Joi.string().required(),
          deviceUUID: Joi.string().required(),
        }).label('deviceData')
      }).label("User: Login"),
      failAction: failActionFunction
    },
    plugins: {
      "hapi-swagger": {
        responseMessages:
          Config.APP_CONSTANTS.swaggerDefaultResponseMessages
      }
    }
  }
};

const resendOTP = {
  method: "POST",
  path: "/api/user/OTP/resend",
  options: {
    description: "Resend OTP for Customer",
    tags: ["api", "customer"],
    auth: "UserAuth",
    handler: (request: any) => {
      const userData =
        (request.auth &&
          request.auth.credentials &&
          request.auth.credentials.userData) ||
        null;
      return new Promise((resolve, reject) => {
        Controller.UserBaseController.resendOTP(userData, (err, data) => {
          if (err) {
            reject(sendError(err));
          } else {
            resolve(
              sendSuccess(
                Config.APP_CONSTANTS.STATUS_MSG.SUCCESS
                  .VERIFY_SENT,
                data
              )
            );
          }
        });
      });
    },
    validate: {
      failAction: failActionFunction
    },
    plugins: {
      "hapi-swagger": {
        security: [{ 'user': {} }],
        responseMessages:
          Config.APP_CONSTANTS.swaggerDefaultResponseMessages
      }
    }
  }
};

const getOTP = {
  method: "GET",
  path: "/api/user/OTP",
  options: {
    description: "get OTP for Customer",
    tags: ["api", "user"],
    handler: (request: any) => {
      const userData = request.query;
      return new Promise((resolve, reject) => {
        Controller.UserBaseController.getOTP(userData, (error, success) => {
          {
            if (error) return reject(sendError(error));
            resolve(
              sendSuccess(
                Config.APP_CONSTANTS.STATUS_MSG.SUCCESS
                  .DEFAULT,
                success
              )
            );
          }
        });
      });
    },
    validate: {
      query: {
        emailId: Joi.string().required()
      },
      failAction: failActionFunction
    },
    plugins: {
      "hapi-swagger": {
        responseMessages:
          Config.APP_CONSTANTS.swaggerDefaultResponseMessages
      }
    }
  }
};

const accessTokenLogin = {
  method: "POST",
  path: "/api/user/login/accesstoken",
  options: {
    description: "access token login",
    tags: ["api", "user"],
    handler: (request: any) => {
      const userData =
        (request.auth &&
          request.auth.credentials &&
          request.auth.credentials.userData) ||
        null;
      return new Promise((resolve, reject) => {
        Controller.UserBaseController.accessTokenLogin(userData, (err, data) => {
          if (!err) {
            resolve(sendSuccess(undefined, data));
          } else {
            reject(sendError(err));
          }
        });
      });
    },
    auth: "UserAuth",
    validate: {
      failAction: failActionFunction
    },
    plugins: {
      "hapi-swagger": {
        security: [{ 'user': {} }],
        responseMessages:
          Config.APP_CONSTANTS.swaggerDefaultResponseMessages
      }
    }
  }
};

const logoutCustomer = {
  method: "PUT",
  path: "/api/user/logout",
  options: {
    description: "Logout user",
    auth: "UserAuth",
    tags: ["api", "user"],
    handler: (request: any) => {
      const userData =
        (request.auth &&
          request.auth.credentials &&
          request.auth.credentials.userData) ||
        null;
      return new Promise((resolve, reject) => {
        Controller.UserBaseController.logoutCustomer(userData, (err, data) => {
          if (err) {
            reject(sendError(err));
          } else {
            resolve(
              sendSuccess(
                Config.APP_CONSTANTS.STATUS_MSG.SUCCESS
                  .LOGOUT, {}
              )
            );
          }
        });
      });
    },
    validate: {
      failAction: failActionFunction
    },
    plugins: {
      "hapi-swagger": {
        security: [{ 'user': {} }],
        responseMessages:
          Config.APP_CONSTANTS.swaggerDefaultResponseMessages
      }
    }
  }
};

const getProfile = {
  method: "GET",
  path: "/api/user/profile",
  options: {
    description: "get profile of user",
    auth: "UserAuth",
    tags: ["api", "user"],
    handler: (request: any) => {
      const userData =
        (request.auth &&
          request.auth.credentials &&
          request.auth.credentials.userData) ||
        null;
      return new Promise((resolve, reject) => {
        if (userData && userData._id) {
          Controller.UserBaseController.getProfile(userData, (error, success) => {
            if (error) {
              reject(sendError(error));
            } else {
              resolve(
                sendSuccess(
                  Config.APP_CONSTANTS.STATUS_MSG.SUCCESS
                    .DEFAULT,
                  success
                )
              );
            }
          });
        } else {
          reject(
            sendError(
              Config.APP_CONSTANTS.STATUS_MSG.ERROR
                .INVALID_TOKEN
            )
          );
        }
      });
    },
    validate: {
      failAction: failActionFunction
    },
    plugins: {
      "hapi-swagger": {
        security: [{ 'user': {} }],
        responseMessages:
          Config.APP_CONSTANTS.swaggerDefaultResponseMessages
      }
    }
  }
};

const changePassword = {
  method: "PUT",
  path: "/api/user/password",
  options: {
    description: "change Password",
    tags: ["api", "customer"],
    handler: (request: any) => {
      const userData =
        (request.auth &&
          request.auth.credentials &&
          request.auth.credentials.userData) ||
        null;
      return new Promise((resolve, reject) => {
        Controller.UserBaseController.changePassword(
          userData,
          request.payload,
          (err, user) => {
            if (!err) {
              resolve(
                sendSuccess(
                  Config.APP_CONSTANTS.STATUS_MSG.SUCCESS
                    .PASSWORD_RESET,
                  user
                )
              );
            } else {
              reject(sendError(err));
            }
          }
        );
      });
    },
    auth: "UserAuth",
    validate: {
      payload: Joi.object({
        skip: Joi.boolean().required(),
        oldPassword: Joi.string().when('skip', { is: false, then: Joi.string().required().min(5), otherwise: Joi.string().optional().allow("") }),
        newPassword: Joi.string().when('skip', { is: false, then: Joi.string().required().min(5), otherwise: Joi.string().optional().allow("") })
      }).label("User: Change Password"),
      failAction: failActionFunction
    },
    plugins: {
      "hapi-swagger": {
        security: [{ 'user': {} }],
        responseMessages:
          Config.APP_CONSTANTS.swaggerDefaultResponseMessages
      }
    }
  }
};

const forgotPassword = {
  method: "POST",
  path: "/api/user/password/forgot",
  options: {
    description: "forgot password",
    tags: ["api", "user"],
    handler: (request: any) => {
      const payloadData = request.payload;
      return new Promise((resolve, reject) => {
        if (!verifyEmailFormat(payloadData.emailId)) {
          reject(
            sendError(
              Config.APP_CONSTANTS.STATUS_MSG.ERROR
                .INVALID_EMAIL_FORMAT
            )
          );
        } else {
          Controller.UserBaseController.forgetPassword(
            request.payload,
            (error, success) => {
              if (error) {
                reject(sendError(error));
              } else {
                resolve(
                  sendSuccess(
                    Config.APP_CONSTANTS.STATUS_MSG.SUCCESS
                      .VERIFY_SENT,
                    success
                  )
                );
              }
            }
          );
        }
      });
    },
    validate: {
      payload: Joi.object({
        emailId: Joi.string().required()
      }).label("User: Forget Password"),
      failAction: failActionFunction
    },
    plugins: {
      "hapi-swagger": {
        responseMessages:
          Config.APP_CONSTANTS.swaggerDefaultResponseMessages
      }
    }
  }
};

const resetPassword = {
  method: "POST",
  path: "/api/user/password/reset",
  options: {
    description: "reset password",
    tags: ["api", "user"],
    handler: (request: any) => {
      const payloadData = request.payload;
      return new Promise((resolve, reject) => {
        if (!verifyEmailFormat(payloadData.emailId)) {
          reject(
            sendError(
              Config.APP_CONSTANTS.STATUS_MSG.ERROR
                .INVALID_EMAIL_FORMAT
            )
          );
        } else {
          Controller.UserBaseController.resetPassword(request.payload, (error, success) => {
            if (error) {
              reject(sendError(error));
            } else {
              resolve(
                sendSuccess(
                  Config.APP_CONSTANTS.STATUS_MSG.SUCCESS
                    .PASSWORD_RESET,
                  success
                )
              );
            }
          });
        }
      });
    },
    validate: {
      payload: Joi.object({
        password: Joi.string()
          .min(6)
          .required()
          .trim(),
        emailId: Joi.string().required(),
        OTPCode: Joi.string().required()
      }).label("User: Reset Password"),
      failAction: failActionFunction
    },
    plugins: {
      "hapi-swagger": {
        responseMessages:
          Config.APP_CONSTANTS.swaggerDefaultResponseMessages
      }
    }
  }
};

const userBaseRoutes: ServerRoute[] = [
  userRegister,
  verifyOTP,
  login,
  resendOTP,
  getOTP,
  accessTokenLogin,
  logoutCustomer,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword
];

export default userBaseRoutes;
