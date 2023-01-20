import GenericController from "../GenericController";

class DemoBaseController extends GenericController {

    /**
    * 
    * @param {Object} payload 
    * @param {String} payload.message 
    * @param {Function} callback 
     */
    demoFunction = (payload: any, callback: Function) => {
        global.appLogger.info(payload.message); 
        return callback(null, payload);
    };
}

export default new DemoBaseController();