import { ServerRoute } from "@hapi/hapi";
import * as Joi from "joi";
import { sendError, sendSuccess, failActionFunction } from "../../utils";
import Controller from "../../controllers";
import Config from "../../config";

const uploadImage: ServerRoute = {
  method: "POST",
  path: "/api/upload/image",
  handler: (request: any) => {
    const payloadData = request.payload;
    return new Promise((resolve, reject) => {
      Controller.UploadBaseController.uploadImage(payloadData, (err, data) => {
        if (err) {
          reject(sendError(err));
        } else {
          resolve(
            sendSuccess(Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data)
          );
        }
      });
    });
  },
  options: {
    description: "image upload",
    tags: ["api", "upload", "image"],
    payload: {
      maxBytes: 20715200,
      output: "stream",
      parse: true,
      allow: "multipart/form-data",
    },
    validate: {
      payload: Joi.object({
        imageFile: Joi.any()
          .meta({ swaggerType: "file" })
          .required()
          .description("image file"),
      }).label("Upload: Image"),
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const uploadVideo: ServerRoute = {
  method: "POST",
  path: "/api/upload/video",
  handler: (request) => {
    const payloadData = request.payload;
    return new Promise((resolve, reject) => {
      Controller.UploadBaseController.uploadVideo(payloadData, (err, data) => {
        if (err) {
          reject(sendError(err));
        } else {
          resolve(
            sendSuccess(Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data)
          );
        }
      });
    });
  },
  options: {
    description: "video upload",
    tags: ["api", "upload", "video"],
    payload: {
      maxBytes: 207152000,
      output: "stream",
      parse: true,
      allow: "multipart/form-data",
    },
    validate: {
      payload: Joi.object({
        videoFile: Joi.any()
          .meta({ swaggerType: "file" })
          .required()
          .description("video file"),
      }).label("Upload: Video"),
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const uploadDocument: ServerRoute = {
  method: "POST",
  path: "/api/upload/document",
  handler: (request) => {
    const payloadData = request.payload;
    return new Promise((resolve, reject) => {
      Controller.UploadBaseController.uploadDocument(
        payloadData,
        (err, data) => {
          if (err) {
            reject(sendError(err));
          } else {
            resolve(
              sendSuccess(Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data)
            );
          }
        }
      );
    });
  },
  options: {
    description: "upload document",
    tags: ["api", "upload", "document"],
    payload: {
      maxBytes: 20715200,
      output: "stream",
      parse: true,
      allow: "multipart/form-data",
    },
    validate: {
      payload: Joi.object({
        documentFile: Joi.any()
          .meta({ swaggerType: "file" })
          .required()
          .description("document file"),
      }).label("Upload: Document"),
      failAction: failActionFunction,
    },
    plugins: {
      "hapi-swagger": {
        responseMessages: Config.APP_CONSTANTS.swaggerDefaultResponseMessages,
      },
    },
  },
};

const routes: ServerRoute[] = [uploadImage, uploadDocument, uploadVideo];

export default routes;
