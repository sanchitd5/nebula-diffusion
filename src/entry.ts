import "./global";
import Server from "./server/server";
// Read .env file.
import "dotenv/config";
import cluster from "node:cluster";
import { cpus } from "node:os";
import Config from "./config/index";
import { throwIfNotRunningPnpm } from "./utils";

throwIfNotRunningPnpm();

const numCpus: number = cpus().length;
if (Config.APP_CONFIG.noOfClusters > numCpus) {
  throw "No of clusters configured more than available";
}
if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);
  for (let i = 0; i < Config.APP_CONFIG.noOfClusters; i++) {
    cluster.fork().on("disconnect", () => {
      // Worker has disconnected
    });
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  new Server().start();
}
