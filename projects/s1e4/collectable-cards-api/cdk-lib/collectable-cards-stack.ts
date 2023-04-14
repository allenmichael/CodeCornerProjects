import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { join } from "path";

const stackBaseName = "collectable-cards-api";
const region = "us-west-2";
const cardDescriptionPort = 3001;
const cardImagePort = 5001;

export class CollectableCardStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cardImageBucket = new s3.Bucket(this, 'cardImageBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: false,
      autoDeleteObjects: true
    });

    const vpc = new ec2.Vpc(this, `${stackBaseName}-vpc`, {
      maxAzs: 3,
    });

    const s3GatewayEndpoint = vpc.addGatewayEndpoint('s3GatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3
    });

    const cluster = new ecs.Cluster(this, `${stackBaseName}-fargate-cluster`, {
      vpc,
    });

    const logging = new ecs.AwsLogDriver({
      streamPrefix: "ecs-logs"
    });

    const taskRole = new iam.Role(this, `cc-ecs-taskrole-${this.stackName}`, {
      roleName: `cc-ecs-taskrole-${this.stackName}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });

    const executionRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        "ecr:getauthorizationtoken",
        "ecr:batchchecklayeravailability",
        "ecr:getdownloadurlforlayer",
        "ecr:batchgetimage",
        "logs:createlogstream",
        "logs:putlogevents"
      ]
    });

    const cardDescriptionTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      `${stackBaseName}-task-definition`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
        taskRole,
      }
    );

    cardDescriptionTaskDefinition.addToExecutionRolePolicy(executionRolePolicy);
    cardDescriptionTaskDefinition.addToTaskRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: ['sagemaker:InvokeEndpoint']
    }));

    const cardDescriptionServiceContainer = cardDescriptionTaskDefinition.addContainer(
      `${stackBaseName}-card-description-service-container`,
      {
        image: ecs.ContainerImage.fromAsset(join(__dirname, "..", "card-description-api")),
        logging
      }
    );

    cardDescriptionServiceContainer.addEnvironment("PORT", cardDescriptionPort.toString());
    cardDescriptionServiceContainer.addEnvironment("CARD_DESCRIPTION_ENDPOINT", "jumpstart-dft-hf-textgeneration-gpt2");
    cardDescriptionServiceContainer.addEnvironment("REGION", region);

    cardDescriptionServiceContainer.addPortMappings({
      containerPort: cardDescriptionPort,
    });

    const cardDescriptionServiceSecurityGroup = new ec2.SecurityGroup(
      this,
      `${stackBaseName}-card-description-service-security-group`,
      {
        allowAllOutbound: true,
        securityGroupName: `${stackBaseName}-card-description-service-security-group`,
        vpc,
      }
    );

    const cardDescriptionService = new ecs.FargateService(
      this,
      `${stackBaseName}-card-description-service`,
      {
        cluster,
        taskDefinition: cardDescriptionTaskDefinition,
        assignPublicIp: true,
        desiredCount: 1,
        securityGroups: [cardDescriptionServiceSecurityGroup],
      }
    );

    const cardImageDefinition = new ecs.FargateTaskDefinition(
      this,
      `${stackBaseName}-card-image-definition`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
        taskRole,
      }
    );

    cardImageBucket.grantReadWrite(cardImageDefinition.taskRole)
    cardImageDefinition.addToExecutionRolePolicy(executionRolePolicy)
    cardImageDefinition.addToTaskRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: ['sagemaker:InvokeEndpoint']
    }));

    const cardImageServiceContainer = cardImageDefinition.addContainer(
      `${stackBaseName}-card-image-service-container`,
      {
        image: ecs.ContainerImage.fromAsset(join(__dirname, "..", "card-image-api")),
        logging
      }
    );

    cardImageServiceContainer.addEnvironment("CARD_IMAGE_ENDPOINT", "jumpstart-dft-naclbit-trinart-stable-diffusion-v2-1");
    cardImageServiceContainer.addEnvironment("CARD_IMAGE_BUCKET", cardImageBucket.bucketName);
    cardImageServiceContainer.addEnvironment("PORT", cardImagePort.toString());
    cardImageServiceContainer.addEnvironment("REGION", region);

    cardImageServiceContainer.addPortMappings({
      containerPort: cardImagePort,
    });

    const cardImageServiceSecurityGroup = new ec2.SecurityGroup(
      this,
      `${stackBaseName}-card-image-service-security-group`,
      {
        allowAllOutbound: true,
        securityGroupName: `${stackBaseName}-name-service-security-group`,
        vpc,
      }
    );

    const cardImageService = new ecs.FargateService(
      this,
      `${stackBaseName}-card-image-service`,
      {
        cluster,
        taskDefinition: cardImageDefinition,
        assignPublicIp: false,
        desiredCount: 1,
        securityGroups: [cardImageServiceSecurityGroup],
      }
    );

    cardDescriptionService.autoScaleTaskCount({
      minCapacity: 0,
      maxCapacity: 2,
    });

    cardImageService.autoScaleTaskCount({
      minCapacity: 0,
      maxCapacity: 2,
    });

    const httpApiALB = new elbv2.ApplicationLoadBalancer(
      this,
      `${stackBaseName}-internal-elbv2`,
      {
        vpc,
        internetFacing: true,
      }
    );

    const httpApiListener = httpApiALB.addListener(
      `${stackBaseName}-http-api-listener`,
      {
        port: 80,
        defaultAction: elbv2.ListenerAction.fixedResponse(404),
      }
    );

    const cardDescriptionServiceTargetGroup = httpApiListener.addTargets(
      `${stackBaseName}-card-description-target-group`,
      {
        port: 80,
        priority: 1,
        healthCheck: {
          path: "/card-description/healthcheck",
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(3),
        },
        targets: [cardDescriptionService],
        // @ts-ignore
        pathPattern: "/card-description*",
      }
    );

    const cardImageServiceTargetGroup = httpApiListener.addTargets(
      `${stackBaseName}-card-image-target-group`,
      {
        port: 80,
        priority: 2,
        healthCheck: {
          path: "/card-image/healthcheck",
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(3),
        },
        targets: [cardImageService],
        // @ts-ignore
        pathPattern: "/card-image*",
      }
    );

    cardDescriptionServiceSecurityGroup.connections.allowFrom(
      httpApiALB,
      ec2.Port.tcp(80)
    );

    cardImageServiceSecurityGroup.connections.allowFrom(
      httpApiALB,
      ec2.Port.tcp(80)
    );
  }
}