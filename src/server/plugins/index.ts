import * as inert from "@hapi/inert";
import * as vision from "@hapi/vision";

export default [
  inert,
  vision,
  { plugin: require("./swagger") },
  { plugin: require("./auth-token") },
];
