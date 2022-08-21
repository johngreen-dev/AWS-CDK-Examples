import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as ecs_patterns,
  aws_applicationautoscaling as app_auto_scaling,
  RemovalPolicy,
} from 'aws-cdk-lib';
import path = require('path');

export class FargateSchedularDynamoDbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The DynamoDB table we will be written to by the fargate function
    const dynamoTable = new dynamodb.Table(this, 'DynamoTable', {
      partitionKey: {name:'ID', type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // the vpc to contain the fargate service
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2
    });

    // add the dynamo table into the vpc
    const dynamoGatewayEndpoint = vpc.addGatewayEndpoint('dynamoGatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB
    });

    // create a cluster from the vpc
    const cluster = new ecs.Cluster(this, 'MyCluster', {
      vpc: vpc
    });

    // add the container image 
    const containerImage = ecs.ContainerImage.fromAsset(path.join(__dirname, '../containers/test-scheduler/'));

    // create the fargate task and setup the schedule
    const fargate = new ecs_patterns.ScheduledFargateTask(this, 'ScheduledFargateTask', {
      cluster,
      scheduledFargateTaskImageOptions: {
        image: containerImage,
        memoryLimitMiB: 512,
        environment: {
          databaseTable: dynamoTable.tableName,
          region: process.env.CDK_DEFAULT_REGION!
        },
      },
      schedule: app_auto_scaling.Schedule.expression('rate(1 minute)'),
      platformVersion: ecs.FargatePlatformVersion.LATEST,
    });

    // Allow PutItem action from the Fargate Task Definition only
    dynamoGatewayEndpoint.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: [
          'dynamodb:PutItem',
        ],
        resources: [
          `${dynamoTable.tableArn}`
        ],
        conditions: {
          'ArnEquals': {
            'aws:PrincipalArn': `${fargate.taskDefinition.taskRole.roleArn}`
          }
        }
      })
    );

    // Write permissions for Fargate
    dynamoTable.grantWriteData(fargate.taskDefinition.taskRole);

  }

}
