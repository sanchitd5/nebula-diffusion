/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable no-var */
import { Logger } from "log4js";
import { BaseEnvironment } from "./definations";

declare global {
    var appRoot: string;
    var appLogger: Logger;
    var uploadLogger: Logger;
    var socketLogger: Logger;
    var tokenLogger: Logger;
    var mongoLogger: Logger;
    var postgresLogger: Logger;
    // declare custom global variables here
    namespace NodeJS {
        interface ProcessEnv extends BaseEnvironment {

        }
    }
}
