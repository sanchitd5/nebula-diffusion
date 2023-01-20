import { Server as HapiServer } from "@hapi/hapi";
import * as HapiSwagger from "hapi-swagger";
import "dotenv/config";

const swaggerOptions: HapiSwagger.RegisterOptions = {
  pathPrefixSize: 2,
  info: {
    title: `${process.env.APP_NAME} Backend`,
    description: `${process.env.APP_NAME} Backend APIs.`,
    version: `${process.env.npm_package_version}`,
  },
  documentationPath: "/swagger",
  securityDefinitions: {
    user: {
      type: "apiKey", // apiKey is defined by the Swagger spec
      name: "Authorization", // the name of the query parameter / header
      in: "header", // how the key is passed
    },
    admin: {
      type: "apiKey", // apiKey is defined by the Swagger spec
      name: "Authorization", // the name of the query parameter / header
      in: "header", // how the key is passed
    },
  },
};

export const register = async (
  server: HapiServer,
  options: HapiSwagger.RegisterOptions
) => {
  try {
    await server.register({
      plugin: HapiSwagger,
      options: { ...options, ...swaggerOptions },
    });
    server.log(["info"], "hapi-swagger interface loaded");
  } catch (e) {
    server.log(["error"], "hapi-swagger load error: " + e);
  }
};

export const name = "swagger-plugin";
