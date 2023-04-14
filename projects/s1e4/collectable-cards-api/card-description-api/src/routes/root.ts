import Router from "koa-router";
import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";
const cardDescriptionEndpoint = process.env.CARD_DESCRIPTION_ENDPOINT || "jumpstart-dft-hf-textgeneration-gpt2";
const region = process.env.REGION || "us-west-2";
const client = new SageMakerRuntimeClient({
    region
});
interface PromptRequest {
    prompt: string
}

const root = new Router();
root.get("/", async (ctx, next) => {
    ctx.body = { msg: "Hello world!" };
    await next();
});

root.get("/card-description/healthcheck", async (ctx, next) => {
    ctx.status = 200
    await next();
});

root.post("/card-description/prompt", async (ctx, next) => {
    if (ctx.request.body) {
        const data = <PromptRequest>ctx.request.body;
        console.log(data);
        const query = {
            "text_inputs": data.prompt,
            "max_length": 200
        }
        const command = new InvokeEndpointCommand({
            EndpointName: cardDescriptionEndpoint,
            Body: Buffer.from(JSON.stringify(query)),
            ContentType: 'application/json'
        })
        const response = await client.send(command);
        if (response.Body) {
            ctx.body = {
                msg: Buffer.from(response.Body).toString("utf-8")
            }
        }
    } else {
        ctx.body = { msg: "Looking to get some card descriptions?" };
    }
    await next();
});

export default root
