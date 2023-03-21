import Koa from "koa";
import root from "./routes/root"

import json from "koa-json";
import bodyParser from "koa-bodyparser";

const app = new Koa();
const port = Number(process.env.NODE_PORT) || 3000

// Basic logging middleware.
// Will revisit for better logging options.
app.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date().getTime() - start.getTime();
    console.log('%s %s - %s', ctx.method, ctx.url, ms);
});

app.use(json());
app.use(bodyParser());

// Routes - only root currently in use
app.use(root.routes()).use(root.allowedMethods())

app.listen(port, () => {
    console.log("Koa started");
});
