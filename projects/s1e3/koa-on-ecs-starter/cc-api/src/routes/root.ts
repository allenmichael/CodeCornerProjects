import Router from "koa-router";

const root = new Router();
root.get("/", async (ctx, next) => {
    ctx.body = { msg: "Hello world!" };
    await next();
});

root.get("/healthcheck", async (ctx, next) => {
    ctx.status = 200
    await next();
});

export default root
