import * as fs from 'fs-extra';
import { GenericError } from "../definations";
import CONFIG from "../config/index";
import { connect as mongooseConnect, disconnect as mongooseDisconnect } from "mongoose";
import { Sequelize } from 'sequelize';
import { Server } from "@hapi/hapi";
import { getLogger, configure as log4jsConfigure } from "log4js";
import Routes from "../routes";
import BootStrap from "../utils/bootStrap";
import Plugins from './plugins';

/**
 * @description Helper file for the server
 */
class ServerHelper {
  declare sequilizeInstance: Sequelize;
  constructor(pid:number) {
    this.configureLog4js(pid);
  }

  setGlobalAppRoot() {
    import('path').then(path => {
      global.appRoot = path.resolve(__dirname);
    });
  }

  bootstrap() {
    BootStrap.bootstrapAdmin((err: any) => {
      if (err) global.appLogger.debug(err)
    });
  }

  /**
   * 
   * @param {Server} server 
   */
  addSwaggerRoutes(server: Server) {
    server.route(Routes);
  }

  /**
   * 
   * @param {Server} server 
   */
  attachLoggerOnEvents(server: Server) {
    server.events.on("response", (request: any) => {
      global.appLogger.info(
        `PID : ${process.pid} - ${request.info.remoteAddress} : ${request.method.toUpperCase()} ${request.url.pathname} --> ${request.response.statusCode}`);
      global.appLogger.info("Request payload:", request.payload);
    });
  }

  removeListeners(server: Server) {
    server.events.removeAllListeners('response');
  }

  /**
   * @returns {Server} A Hapi Server
   */
  async createServer(): Promise<Server> {
    const server = new Server({
      app: {
        name: process.env.APP_NAME || "default"
      },
      port: process.env.HAPI_PORT || 8000,
      routes: { cors: true }
    });
    server.validator(await import('joi'));
    return server;
  }

  /**
   * @author Sanchit Dang
   * @description Adds Views to the server
   * @param {Server} server 
   */
  async addViews(server: Server) {
    const handlebars = await import('handlebars')
    server.views({
      engines: {
        html: handlebars
      },
      relativeTo: __dirname,
      path: "../../views"
    });
  }

  /**
   * @author Sanchit Dang
   * @description sets default route for the server
   * @param {Server} server HAPI Server
   * @param {string} defaultRoute Optional - default route
   */
  setDefaultRoute(server: Server, defaultRoute?: string) {
    if (defaultRoute === undefined) defaultRoute = "/"
    server.route({
      method: "GET",
      path: defaultRoute,
      handler: (req, res) => {
        return (res as any).view("welcome");
      }
    });
  }

  /**
   * 
   * @param {Server} server HAPI Server
   */
  async registerPlugins(server: Server) {
    try {
      await server.register(Plugins as any);
      server.log(["info"], "Plugins Loaded");
    } catch (e) {
      server.log(["error"], "Error while loading plugins : " + e);
    } finally {
      return server;
    }
  }

  configureLog4js = (pid:number) => {
    const loggers =['App', 'Upload_Manager', 'Socket_Manager','Token_Manager','Mongo_Manager','Postgres_Manager'];
    const appenders ={};
    loggers.forEach((logger)=>{
      const name = "PID_"+ pid.toString() +"_"+logger;
      Object.assign(appenders, {[name]:{ type: 'console' }});
    });
    // Configuration for log4js.
    log4jsConfigure({
      appenders: appenders,
      categories: {
        default: { appenders: [`PID_${pid}_`+ 'App'], level: 'trace' },
        Upload_Manager: { appenders: [`PID_${pid}_`+'Upload_Manager'], level: 'trace' },
        Socket_Manager: { appenders: [`PID_${pid}_`+'Socket_Manager'], level: 'trace' },
        Token_Manager: { appenders: [`PID_${pid}_`+'Token_Manager'], level: 'trace' },
        Mongo_Manager: { appenders: [`PID_${pid}_`+'Mongo_Manager'], level: 'trace' },
        Postgres_Manager: { appenders: [`PID_${pid}_`+'Postgres_Manager'], level: 'trace' },
      }
    });
    // Global Logger variables for logging
    global.appLogger = getLogger(`PID_${pid}_`+'App');
    global.uploadLogger = getLogger(`PID_${pid}_`+'Upload_Manager');
    global.socketLogger = getLogger(`PID_${pid}_`+'Socket_Manager');
    global.tokenLogger = getLogger(`PID_${pid}_`+'Token_Manager');
    global.mongoLogger = getLogger(`PID_${pid}_`+'Mongo_Manager');
    global.postgresLogger = getLogger(`PID_${pid}_`+'Postgres_Manager');
  }

  /**
   * 
   * @param {Server} server 
   */
  async startServer(server: Server): Promise<Server> {
    try {
      await server.start();
      global.appLogger.info("Server running on %s", server.info.uri);
    } catch (error) {
      global.appLogger.fatal(error);
    }
    return server;
  }

  async connectMongoDB() {
    if (!CONFIG.APP_CONFIG.databases.mongo) return global.mongoLogger.info('MongoDB Connect : Disabled');
    try {
      global.mongoLogger.debug('Trying to make connection to DB');
      const mongoose = await mongooseConnect(CONFIG.DB_CONFIG.mongo.URI);
      global.mongoLogger.info('MongoDB Connected');
      return mongoose;
    } catch (e: any) {
      global.mongoLogger.error("DB Connect Error: ", e);
      throw new GenericError('MONGODB_CONNECT_ERROR', e);
    }
  }

  async connectPostgresDB() {
    if (!CONFIG.APP_CONFIG.databases.postgres) return global.postgresLogger.info('Postgres Connect : Disabled');
    try {
      global.postgresLogger.debug('Trying to make connection to DB');
      const postgres = new Sequelize(CONFIG.DB_CONFIG.postgres);
      await postgres.authenticate();
      this.sequilizeInstance = postgres;
      global.postgresLogger.info('PostgresDB Connected');
      return postgres;
    } catch (e: any) {
      global.postgresLogger.error("DB Connect Error: ", e);
      throw new GenericError('POSTGRES_CONNECT_ERROR', e);
    }
  }

  async disconnectMongoDB() {
    if (!CONFIG.APP_CONFIG.databases.mongo) return global.mongoLogger.info('MongoDB Disconnect : Disabled');
    try {
      mongooseDisconnect();
    } catch (e: any) {
      global.mongoLogger.error("DB Disconnect Error: ", e);
      throw new GenericError('MONGODB_DISCONNECT_ERROR', e);
    }
  }

  async ensureEnvironmentFileExists() {
    await fs.copy('.env.example', '.env', {
      filter: (src, dest) => {
        return !!dest;
      },
      overwrite: false
    });
  }

  async getSequelizeInstance() {
    if (!this.sequilizeInstance) {
      await this.connectPostgresDB();
    }
    return this.sequilizeInstance;
  }
}

const instance = new ServerHelper(process.pid);
export default instance;