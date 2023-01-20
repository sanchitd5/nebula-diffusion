import { GenericObject } from "../../definations";


export default class GenericDBService {

    /**
     * @private
     * @author Sanchit Dang
     * @description Validate if models exists
     * @param {String} modelName name of the model 
     */
    protected isModelValid(Models: GenericObject, modelName: string): boolean {
        return !(!modelName || 0 === modelName.length || !Models.hasOwnProperty(modelName as PropertyKey));
    }
}