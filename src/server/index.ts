import cors from "cors";
import fastifyFactory from "fastify";
import httpRoutes from "./routes";

const fastify = fastifyFactory({
  logger: true
});

fastify.register(require("fastify-helmet"));
// @ts-ignore
fastify.use(cors());
fastify.register(httpRoutes, { prefix: "/api/v1" });

// Run the server!
const port = parseInt(process.env.PORT || "8000");
const start = async () => {
  try {
    await fastify.listen(port);
    fastify.log.info(`SERVER Started: ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
