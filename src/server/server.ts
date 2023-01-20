import { Server as HapiServer } from "@hapi/hapi";
import ServerHelper from "./helpers";
import SocketManager from "../lib/socketManager";

class Server {
  private declare socketManager: SocketManager;
  private declare server: HapiServer;
  private receivedShutdownSignal = false;

  /**
   * @author Sanchit Dang
   * @description Initilize HAPI Server
   */
  private async initilize(): Promise<HapiServer> {
    await ServerHelper.ensureEnvironmentFileExists();

    //Create Server
    this.server = await ServerHelper.createServer();

    //Register All Plugins
    this.server = await ServerHelper.registerPlugins(this.server);

    //Default Routes
    ServerHelper.setDefaultRoute(this.server);

    //add views
    await ServerHelper.addViews(this.server);

    // Add routes to Swagger documentation
    ServerHelper.addSwaggerRoutes(this.server);

    // Bootstrap Application
    ServerHelper.bootstrap();

    // Initiate Socket Server
    this.socketManager = new SocketManager(this.server);
    this.socketManager.connectSocket();

    ServerHelper.attachLoggerOnEvents(this.server);

    // Start Server
    this.server = await ServerHelper.startServer(this.server);

    return this.server;
  }

  private async shutdownGracefully(server?: HapiServer, fatal = false) {
    // force shutdown after waiting for 10 seconds
    setTimeout(() => {
      global.appLogger.warn("Waited for 10 seconds, forcing shutdown");
      process.exit(fatal ? 0 : 1);
    }, 10000);
    this.receivedShutdownSignal = true;
    
    global.appLogger.info("Shutting down gracefully");
    if (server) {
      ServerHelper.removeListeners(server);
      await server.stop();
    }
    await ServerHelper.disconnectMongoDB();

    process.exit(fatal ? 0 : 1);
  }

  /**
   * @author Sanchit Dang
   * @description Start HAPI Server
   */
  async start() {
    await ServerHelper.connectMongoDB();
    await ServerHelper.connectPostgresDB();

    // Global variable to get app root folder path
    ServerHelper.setGlobalAppRoot();

    process.on("unhandledRejection", (err) => {
      global.appLogger.fatal(err);
      this.shutdownGracefully(this.server, !!err);
    });

    const server = await this.initilize();

    process.on(
      "SIGINT",
      () => !this.receivedShutdownSignal && this.shutdownGracefully(this.server)
    );

    process.on(
      "SIGTERM",
      () => !this.receivedShutdownSignal && this.shutdownGracefully(this.server)
    );

    process.on(
      "end",
      () => !this.receivedShutdownSignal && this.shutdownGracefully(this.server)
    );

    server.listener.on(
      "end",
      () => !this.receivedShutdownSignal && this.shutdownGracefully(this.server)
    );
  }
}

export default Server;
