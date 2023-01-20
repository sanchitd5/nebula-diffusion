import { CastError } from "mongoose";
import { ApplicationError, FrozenResponseMessage, GenericObject, MongoError, ValidationError } from "../definations";

class DataTypeConverters {

    toObjectArray = (data: unknown): data is Array<GenericObject> => !!data && !!(data as Array<unknown>).length;
    toUnknownArray = (data: unknown): data is Array<unknown> => !!data && !!(data as Array<unknown>).length;
    toObject = (data: unknown): data is GenericObject => !!data;
    toUnknown = (data: unknown): data is unknown => !!data;
    toError = (error: unknown): error is Error => !!error;
    toFrozenResponseMessage = (error: unknown): error is FrozenResponseMessage => !!error;
    isMongoError = (error: GenericObject): error is MongoError => error.name === 'MongoError';
    isApplicationError = (error: GenericObject): error is ApplicationError => error.name === 'ApplicationError';
    isValidationError = (error: GenericObject): error is ValidationError => error.name === 'ValidationError';
    isCastError = (error: GenericObject): error is CastError => error.name === 'CastError';
}

export default new DataTypeConverters();