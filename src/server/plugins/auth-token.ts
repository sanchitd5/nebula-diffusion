import { Server as HapiServer } from "@hapi/hapi";
import * as AuthBearer from "hapi-auth-bearer-token";
import TokenManager from "../../lib/tokenManager";
import converters from "../../utils/converters";

export const register = async function (server: HapiServer) {
  await server.register(AuthBearer);
  //Register Authorization Plugin
  server.auth.strategy("UserAuth", "bearer-access-token", {
    allowQueryToken: false,
    allowMultipleHeaders: true,
    accessTokenName: "accessToken",
    validate: async function (request, token, h) {
      let isValid = false;
      const credentials = await TokenManager.verifyToken(token);
      if (converters.toObject(credentials) && credentials.userData) {
        isValid = true;
      }
      return { isValid, credentials };
    },
  });
};

export const name = "auth-token-plugin";
