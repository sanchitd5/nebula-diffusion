import { Model } from "sequelize";
import { Util as HapiUtil, Lifecycle as HapiLifecycle } from "@hapi/hapi";

export interface GenericObject {
  [key: string]: any;
}

export interface FrozenObject {
  readonly [key: string]: any;
}

export type GenericServiceCallback = (
  err: Error | unknown | string,
  data?: unknown
) => void;

export class GenericError extends Error {
  declare readonly misc: GenericObject | undefined;
  constructor(message: string, misc?: GenericObject) {
    super(message);
    this.misc = misc;
  }
}

export interface InternalError {
  name: string;
}

export interface MongoError extends InternalError {
  code: number;
  errmsg: string;
}

export interface ApplicationError extends InternalError {
  message: string;
}

export type ValidationError = InternalError;

export class SqlModel extends Model {
  declare createdAt: Date;
  declare updatedAt: Date;
}

export enum AuthType {
  NONE,
  USER,
  ADMIN,
}

export interface RouteProperties {
  method: HapiUtil.HTTP_METHODS_PARTIAL[] | string;
  validate?: GenericObject;
  path: string;
  handler: HapiLifecycle.Method;
  auth: AuthType;
  tags?: string[];
  description?: string;
  plugins?: GenericObject;
}
