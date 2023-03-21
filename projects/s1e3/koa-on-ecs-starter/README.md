# AWS on Air: AMster & The Brit's Code Corner
## Koa on ECS Starter - Collectable Cards API

## Included AWS Services
This project lays the foundation for our [collectable card](https://en.wikipedia.org/wiki/Trading_card) service.

We use the [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) to provision an [ECS cluster](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html) to host our API written in [TypeScript](https://www.typescriptlang.org/docs/handbook/intro.html). We deploy our application by using a [Construct](https://docs.aws.amazon.com/cdk/v2/guide/constructs.html) in the CDK called [`ApplicationLoadBalancedFargateService`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns.ApplicationLoadBalancedFargateService.html). 

The included Dockerfile uses a [multi-stage build](https://docs.docker.com/build/building/multi-stage/) to transpile the TypeScript project to JavaScript and uses a smaller base container image to run once the build completes. We store the resulting container image in an [ECR repo](https://aws.amazon.com/ecr/) declared in our CDK project.

The CDK project also creates a new VPC for the ECS cluster to use and includes an IAM policy to grant the container permission to `sagemaker:InvokeEndpoint`. This policy uses `*` as the resource and should be scoped to the specific [SageMaker Inference endpoints](https://docs.aws.amazon.com/sagemaker/latest/dg/deploy-model.html#deploy-model-steps) eventually created for this project.

## What Does the Project Do?
Currently this project deploys out a TypeScript project that includes [Koa](https://koajs.com/), a web framework for [Node.js](https://nodejs.org/en). The Koa API deploys to a container by using [Fargate](https://explore.skillbuilder.aws/learn/course/external/view/elearning/81/introduction-to-aws-fargate) in an [ECS cluster](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html) with an [Application Load balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html) to provide access to the API from the public Internet.

Eventually this project will allow someone to create their own collectable card series through the magic of [generative AI](https://en.wikipedia.org/wiki/Generative_artificial_intelligence). We'll eventually use deployed [SageMaker JumpStart](https://docs.aws.amazon.com/sagemaker/latest/dg/studio-jumpstart.html) models with [SageMaker Inference endpoints](https://docs.aws.amazon.com/sagemaker/latest/dg/deploy-model.html#deploy-model-steps) to use [stable diffusion](https://en.wikipedia.org/wiki/Stable_Diffusion) models to generate card images and [GPT](https://en.wikipedia.org/wiki/Generative_pre-trained_transformer) models to generate card descriptions.

## Example Usage
`curl <application-load-balancer-url>`

Response:
```json
{
  "msg": "Hello world!"
}
```

## Build and Deploy the Project
You'll use the [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) to build and deploy this project to your own AWS Account. 

To deploy:

`cdk bootstrap`

`cdk deploy`

To remove: 

`cdk destroy`
