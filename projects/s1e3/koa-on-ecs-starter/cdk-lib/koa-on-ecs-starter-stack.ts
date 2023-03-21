import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import { join } from 'path'

export class KoaOnEcsStarterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    /*
      All infra for REST API 
    */
    const healthCheckEndpoint = "/healthcheck";
    const containerPort = 3000;

    const ecrRepo = new ecr.Repository(this, 'ccRepo');

    const vpc = new ec2.Vpc(this, 'cc-cdk-vpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1,
      maxAzs: 3
    });

    const cluster = new ecs.Cluster(this, "cc-ecs-cluster", {
      vpc: vpc,
    });

    const logging = new ecs.AwsLogDriver({
      streamPrefix: "ecs-logs"
    });

    const taskrole = new iam.Role(this, `cc-ecs-taskrole-${this.stackName}`, {
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

    const taskDef = new ecs.FargateTaskDefinition(this, "cc-ecs-taskdef", {
      taskRole: taskrole
    });

    taskDef.addToTaskRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: ['sagemaker:InvokeEndpoint']
    }));

    taskDef.addToExecutionRolePolicy(executionRolePolicy);

    const container = taskDef.addContainer('cc-api-app', {
      image: ecs.ContainerImage.fromAsset(join(__dirname, "..", "cc-api")),
      memoryLimitMiB: 256,
      cpu: 256,
      logging,
      environment: {
        CARD_DESCRIPTION_ENDPOINT: "",
        CARD_IMAGE_ENDPOINT: "",
      }
    });

    container.addPortMappings({
      containerPort,
      protocol: ecs.Protocol.TCP
    });

    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "ecs-service", {
      cluster: cluster,
      taskDefinition: taskDef,
      publicLoadBalancer: true,
      desiredCount: 3,
      listenerPort: 80,
    });

    fargateService.targetGroup.configureHealthCheck({
      path: healthCheckEndpoint
    });
  }
}
