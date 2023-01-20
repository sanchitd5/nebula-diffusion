import { ServerRoute } from '@hapi/hapi';
import * as Joi from "joi";
import Controller from "../../controllers";
import { createRoute, sendError, sendSuccess } from '../../utils';
import Config from '../../config'
import { AuthType } from '../../definations';


const demoRoute = createRoute({
  method: "POST",
  path: "/api/demo/demoApi",
  description: "demo api",
  auth: AuthType.NONE,
  handler: (request) => {
    return new Promise((resolve, reject) => {
      Controller.DemoBaseController.demoFunction(request.payload, (err: Error, data: any) => {
        if (err) return reject(sendError(err));
        resolve(
          sendSuccess(
            Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
            data
          )
        );
      });
    });
  },
  validate: {
    payload: Joi.object({
      message: Joi.string().required()
    }).label("Demo Model"),
  }
});

const DemoBaseRoute: ServerRoute[] = [demoRoute];
export default DemoBaseRoute;
