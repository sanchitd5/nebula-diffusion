import { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import {
  createRoute,
  sendError,
  sendSuccess,
  failActionFunction,
  verifyEmailFormat,
} from "../../utils";
import Controller from "../../controllers";
import Config from "../../config";
import { AuthType, DeviceData } from "../../definations";

const adminLogin: ServerRoute = createRoute({
  method: "POST",
  path: "/api/admin/login",
  description: "Admin Login; UUID : 507e0a58-dee2-4f21-bbcb-dbf30f6a8f09",
  tags: ["api", "admin"],
  handler: (request) => {
    return new Promise((resolve, reject) => {
      Controller.AdminBaseController.adminLogin(
        request.payload as {
          emailId: string;
          password: string;
          deviceData: DeviceData;
        },
        (error: unknown, data: any) => {
          if (error) return reject(sendError(error));
          resolve(sendSuccess("Success", data));
        }
      );
    });
  },
  validate: {
    payload: Joi.object({
      emailId: Joi.string().email().required(),
      password: Joi.string().required().min(5).trim(),
      deviceData: Joi.object({
        deviceType: Joi.string()
          .valid(...Object.values(Config.APP_CONSTANTS.DATABASE.DEVICE_TYPES))
          .required(),
        deviceName: Joi.string().required(),
        deviceUUID: Joi.string().required(),
      }).label("deviceData"),
    }).label("Admin: Login"),
    failAction: failActionFunction,
  },
  auth: AuthType.NONE,
});

const accessTokenLogin: ServerRoute = {
  method: "POST",
  path: "/api/admin/login/accessToken",
  handler: function (request) {
    const userData = request?.auth?.credentials?.userData || null;
    (request.auth &&
      request.auth.credentials &&
      request.auth.credentials.userData) ||
      null;
    return new Promise((resolve, reject) => {
      Controller.AdminBaseController.accessTokenLogin(
        userData,
        (err: Error, data: any) => {
          if (err) return reject(sendError(err));
          resolve(sendSuccess(undefined, data));
        }
      );
    });
  },
  options: {
    description: "access token login",
    tags: ["api", "admin"],
    auth: "UserAuth",
    validate: {
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        security: [{ admin: {} }],
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const createAdmin: ServerRoute = {
  method: "POST",
  path: "/api/admin/usermanagement/admin",
  handler: function (request, h) {
    const userData =
      (request.auth &&
        request.auth.credentials &&
        request.auth.credentials.userData) ||
      null;
    const payloadData: any = request.payload;
    return new Promise((resolve, reject) => {
      if (!verifyEmailFormat(payloadData.emailId)) {
        reject(
          sendError(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL_FORMAT)
        );
      } else {
        Controller.AdminBaseController.createAdmin(
          userData,
          payloadData,
          (err: Error, data: any) => {
            if (err) return reject(sendError(err));
            resolve(sendSuccess(undefined, data));
          }
        );
      }
    });
  },
  options: {
    description: "create sub admin",
    tags: ["api", "admin"],
    auth: "UserAuth",
    validate: {
      payload: Joi.object({
        emailId: Joi.string().required(),
        fullName: Joi.string().optional().allow(""),
      }).label("Admin: Create Admin"),
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        security: [{ admin: {} }],
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const getAdmin: ServerRoute = {
  method: "GET",
  path: "/api/admin/usermanagement/admin",
  handler: function (request, h) {
    const userData =
      (request.auth &&
        request.auth.credentials &&
        request.auth.credentials.userData) ||
      null;
    return new Promise((resolve, reject) => {
      Controller.AdminBaseController.getAdmin(
        userData,
        (err: Error, data: any) => {
          if (!err) {
            resolve(sendSuccess(undefined, data));
          } else {
            reject(sendError(err));
          }
        }
      );
    });
  },
  options: {
    description: "get all sub admin list",
    tags: ["api", "admin"],
    auth: "UserAuth",
    validate: {
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        security: [{ admin: {} }],
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const blockUnblockAdmin: ServerRoute = {
  method: "PUT",
  path: "/api/admin/usermanagement/admin/{sid}/blockUnblock",
  handler: function (request, h) {
    const userData =
      (request.auth &&
        request.auth.credentials &&
        request.auth.credentials.userData) ||
      null;
    return new Promise((resolve, reject) => {
      Controller.AdminBaseController.blockUnblockAdmin(
        userData,
        {
          sid: request.params.sid,
          block: (request.payload as{block:boolean}).block,
        },
        (err: Error, data: any) => {
          if (err) return reject(sendError(err));
          resolve(sendSuccess(undefined, data));
        }
      );
    });
  },
  options: {
    description: "block/unblock a sub admin",
    tags: ["api", "admin"],
    auth: "UserAuth",
    validate: {
      params: Joi.object({
        sid: Joi.string().required(),
      }),
      payload: Joi.object({
        block: Joi.boolean().required(),
      }).label("Admin: Block-Unblock Admin"),
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        security: [{ admin: {} }],
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const createUser: ServerRoute = {
  method: "POST",
  path: "/api/admin/usermanagement/user",
  handler: function (request, h) {
    const userData =
      (request.auth &&
        request.auth.credentials &&
        request.auth.credentials.userData) ||
      null;
    return new Promise((resolve, reject) => {
      if (!verifyEmailFormat((request.payload as any).emailId)) {
        reject(
          sendError(Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL_FORMAT)
        );
      } else {
        Controller.AdminBaseController.createUser(
          userData,
          request.payload,
          (err: Error, data: any) => {
            if (!err) {
              resolve(sendSuccess(undefined, data));
            } else {
              reject(sendError(err));
            }
          }
        );
      }
    });
  },
  options: {
    description: "create new user from admin",
    tags: ["api", "admin"],
    auth: "UserAuth",
    validate: {
      payload: Joi.object({
        firstName: Joi.string()
          .regex(/^[a-zA-Z ]+$/)
          .trim()
          .min(2)
          .required(),
        lastName: Joi.string()
          .regex(/^[a-zA-Z ]+$/)
          .trim()
          .min(2)
          .required(),
        emailId: Joi.string().required(),
        phoneNumber: Joi.string()
          .regex(/^[0-9]+$/)
          .min(5)
          .required(),
        countryCode: Joi.string().max(4).required().trim(),
      }).label("Admin: Create User"),
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        security: [{ admin: {} }],
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const getUser: ServerRoute = {
  method: "GET",
  path: "/api/admin/usermanagement/user",
  handler: function (request, h) {
    const userData =
      (request.auth &&
        request.auth.credentials &&
        request.auth.credentials.userData) ||
      null;
    return new Promise((resolve, reject) => {
      Controller.AdminBaseController.getUser(
        userData,
        (err: Error, data: any) => {
          if (!err) {
            resolve(sendSuccess(undefined, data));
          } else {
            reject(sendError(err));
          }
        }
      );
    });
  },
  options: {
    description: "get all user list",
    tags: ["api", "admin"],
    auth: "UserAuth",
    validate: {
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        security: [{ admin: {} }],
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const blockUnblockUser: ServerRoute = {
  method: "PUT",
  path: "/api/admin/usermanagement/user/{sid}/blockUnblock",
  handler: function (request, h) {
    const userData =
      (request.auth &&
        request.auth.credentials &&
        request.auth.credentials.userData) ||
      null; 
    return new Promise((resolve, reject) => {
      Controller.AdminBaseController.blockUnblockUser(
        userData,
        {userId:request.params.sid ,block: (request.payload as{block:boolean}).block},
        (err: Error, data: any) => {
          if (!err) {
            resolve(sendSuccess(undefined, data));
          } else {
            reject(sendError(err));
          }
        }
      );
    });
  },
  options: {
    description: "block/unblock a user",
    tags: ["api", "admin"],
    auth: "UserAuth",
    validate: {
      params: Joi.object({
        sid: Joi.string().required(),
      }),
      payload: Joi.object({
        block: Joi.boolean().required(),
      }).label("Admin: Block-Unblock User"),
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        security: [{ admin: {} }],
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const changePassword: ServerRoute = {
  method: "PUT",
  path: "/api/admin/password",
  handler: function (request, h) {
    const userData =
      (request.auth &&
        request.auth.credentials &&
        request.auth.credentials.userData) ||
      null;
    return new Promise((resolve, reject) => {
      Controller.AdminBaseController.changePassword(
        userData,
        request.payload,
        (err: Error, user: any) => {
          if (!err) {
            resolve(
              sendSuccess(
                Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.PASSWORD_RESET,
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
  options: {
    description: "change Password",
    tags: ["api", "admin"],
    auth: "UserAuth",
    validate: {
      payload: Joi.object({
        skip: Joi.boolean().required(),
        oldPassword: Joi.string().when("skip", {
          is: false,
          then: Joi.string().required().min(5),
          otherwise: Joi.string().optional().allow(""),
        }),
        newPassword: Joi.string().when("skip", {
          is: false,
          then: Joi.string().required().min(5),
          otherwise: Joi.string().optional().allow(""),
        }),
      }).label("Admin: Change Password"),
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        security: [{ admin: {} }],
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const logoutAdmin: ServerRoute = {
  method: "PUT",
  path: "/api/admin/logout",
  options: {
    description: "Logout admin",
    auth: "UserAuth",
    tags: ["api", "admin"],
    handler: function (request, h) {
      const userData =
        (request.auth &&
          request.auth.credentials &&
          request.auth.credentials.userData) ||
        null;
      return new Promise((resolve, reject) => {
        Controller.AdminBaseController.logoutAdmin(userData, (err: Error) => {
          if (err) {
            reject(sendError(err));
          } else {
            resolve(
              sendSuccess(Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.LOGOUT, {})
            );
          }
        });
      });
    },
    validate: {
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        security: [{ admin: {} }],
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const adminBaseRoutes: ServerRoute[] = [
  adminLogin,
  accessTokenLogin,
  createAdmin,
  getAdmin,
  blockUnblockAdmin,
  createUser,
  getUser,
  blockUnblockUser,
  changePassword,
  logoutAdmin,
];

export default adminBaseRoutes;
