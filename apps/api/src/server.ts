import "dotenv/config";
import { construirApp } from "./app.js";

const app = construirApp();
const port = Number(process.env.PORT ?? 3333);

app
  .listen({ port, host: "0.0.0.0" })
  .then((addr) => app.log.info(`API ouvindo em ${addr}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
