import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNode,
  aws_dynamodb as dynamodb,
  aws_events as events,
  aws_events_targets as targets,
  Duration,
  RemovalPolicy,
} from 'aws-cdk-lib';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class LambdaSchedularDynamoDbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The DynamoDB table we will be written to by the lambda function
    const dynamoTable = new dynamodb.Table(this, 'DynamoTable', {
      partitionKey: {name:'ID', type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      tableName: 'lambda-schedular-dynamo-table'
    });

    
    // Function called by schedular
    const triggeredEventFn = new lambdaNode.NodejsFunction(this, 'TriggerEventHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'lambda/writeToDynamo.ts',
      handler: 'main',
      timeout: Duration.seconds(3),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
        ],
        minify: true
      },
      environment: {
        "tableName": dynamoTable.tableName,
        region: process.env.CDK_DEFAULT_REGION!
      }
    });

    // Schedular from event bridge
    const eventBridgeSchedular = new events.Rule(this, 'EventBridgeSchedular', {
      ruleName: 'eventBridgeSchedular',
      schedule: events.Schedule.rate(Duration.minutes(1))
    });

    // Give the lambda permissions to write to the dynamo table
    dynamoTable.grantWriteData(triggeredEventFn);
    // Add the lambda as a target of the schedular event
    eventBridgeSchedular.addTarget(new targets.LambdaFunction(triggeredEventFn));
  }
}
