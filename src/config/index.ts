import { DATABASE, GenericObject } from "../definations";
import APP_CONSTANTS from "./appConstants";
import AWS_S3_CONFIG from "./awsS3Config";
import DB_CONFIG from "./dbConfig";

class AppConfig {
    declare databases: GenericObject;
    declare userDatabase: DATABASE;
    declare adminDatabase: DATABASE;
    declare useSocket: boolean;
    declare noOfClusters: number;
    constructor() {
        this.databases = {
            mongo: true,
            postgres: false,
            mysql: false
        };
        this.userDatabase = DATABASE.MONGODB;
        this.adminDatabase = DATABASE.MONGODB;
        this.useSocket = false;
        this.noOfClusters = 4;
    }
}

export default {
    APP_CONSTANTS,
    AWS_S3_CONFIG,
    DB_CONFIG,
    APP_CONFIG: new AppConfig()
} as const;