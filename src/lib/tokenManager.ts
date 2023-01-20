import Services from "../services/index";
import Config from "../config";
import {
  DeviceData,
  GenericObject,
  TokenData,
  GenericServiceCallback,
} from "../definations";
import { sign, verify } from "jsonwebtoken";

/**
 *
 * @param {String} userId
 * @param {String} userType
 * @param {String} deviceUUID
 * @param {String} token
 * @returns
 */
const getTokenFromDB = async function (
  userId: string,
  userType: string,
  token: string
) {
  const criteria = (() => {
    switch (userType) {
      case Config.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN:
      case Config.APP_CONSTANTS.DATABASE.USER_ROLES.SUPERADMIN:
        return { adminId: userId, accessToken: token };
      default:
        return { userId, accessToken: token };
    }
  })();
  const result = await Services.TokenService.getRecord(criteria, {}, {});
  if (result && result.length > 0) {
    (result[0] as GenericObject).type = userType;
    return result[0];
  } else {
    return Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_TOKEN;
  }
};

/**
 *
 * @param {String} userId
 * @param {String} userType
 * @param {Object} tokenData
 * @param {String} tokenData.accessToken
 * @param {String} tokenData.deviceType
 * @param {String} tokenData.deviceName
 * @param {String} tokenData.deviceUUID
 * @param {Function} callback
 */
const setTokenInDB = function (
  userId: string,
  userType: string,
  tokenData: GenericObject,
  callback: GenericServiceCallback
) {
  let objectToCreate: { [key: string]: GenericObject | string | unknown },
    criteria: { [key: string]: GenericObject | string | unknown };
  switch (userType) {
    case Config.APP_CONSTANTS.DATABASE.USER_ROLES.SUPERADMIN:
    case Config.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN: {
      objectToCreate = { adminId: userId, ...tokenData };
      criteria = { adminId: userId, deviceUUID: tokenData.deviceUUID };
      break;
    }
    default: {
      objectToCreate = { userId: userId, ...tokenData };
      criteria = { userId, deviceUUID: tokenData.deviceUUID };
    }
  }
  Services.TokenService.getRecord(criteria, {}, {}, (err, data) => {
    if (err) return callback(err as Error);
    if (data.length === 0) {
      Services.TokenService.createRecord(objectToCreate, (err, data) => {
        if (err) return callback(err as Error);
        return callback(null, data);
      });
    } else {
      Services.TokenService.updateRecord(criteria, tokenData, {}, callback);
    }
  });
};

/**
 *
 * @param {TokenData} tokenData
 * @param {String} tokenData.id User ID
 * @param {String} tokenData.type User Type
 * @param {DeviceData} deviceData
 * @param {String} deviceData.deviceUUID
 * @param {String} deviceData.deviceType
 * @param {String} deviceData.deviceName
 * @param {Function} callback
 */
const setToken = (
  tokenData: TokenData,
  deviceData: DeviceData,
  callback: (
    err: GenericObject | Error,
    result?: { accessToken: string }
  ) => void
) => {
  if (!tokenData.id || !tokenData.type) {
    callback(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
  } else {
    const tokenToSend = sign(tokenData, process.env.JWT_SECRET_KEY);
    setTokenInDB(
      tokenData.id,
      tokenData.type,
      { accessToken: tokenToSend, ...deviceData },
      (err) => callback(err as any, { accessToken: tokenToSend })
    );
  }
};

const verifyToken = async function (
  token: string
): Promise<unknown | GenericObject> {
  try {
    const decodedData = verify(
      token,
      process.env.JWT_SECRET_KEY
    ) as GenericObject;
    const result = (await getTokenFromDB(
      decodedData.id,
      decodedData.type,
      token
    )) as GenericObject;
    if (result && result._id) return { userData: result };
    else throw result;
  } catch (err) {
    console.error(err);
    return err;
  }
};

const decodeToken = async (token: string) => {
  try {
    const decodedData = verify(token, process.env.JWT_SECRET_KEY);
    return { userData: decodedData, token: token };
  } catch (err) {
    return err;
  }
};

export default {
  decodeToken: decodeToken,
  verifyToken: verifyToken,
  setToken: setToken,
};
