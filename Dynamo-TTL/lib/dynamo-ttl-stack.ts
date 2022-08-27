import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import {
aws_dynamodb as dynamodb,
aws_lambda as lambda,
aws_lambda_nodejs as lambdaNode,
Duration,
RemovalPolicy
} from 'aws-cdk-lib';
import {DynamoEventSource} from 'aws-cdk-lib/aws-lambda-event-sources'
import { CfnEventSourceMapping, EventSourceMapping } from 'aws-cdk-lib/aws-lambda';

export class DynamoTtlStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // METHOD 1 - FILTERED within the Lambda function

    const ttlTable1 = new dynamodb.Table(this, 'ttlTable1', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      tableName: 'ttlTable1',
      timeToLiveAttribute: "TTL"
    });


    const triggeredEventFn = new lambdaNode.NodejsFunction(this, 'TriggerEventHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'lambda/writeDeletedItemFromStreamMethod1.ts',
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
        region: process.env.CDK_DEFAULT_REGION!
      }
    });
    ttlTable1.grantStreamRead(triggeredEventFn);
    // simple Dynamo Event Source with filtering in the lambda
    triggeredEventFn.addEventSource(new DynamoEventSource(ttlTable1, {
      startingPosition: lambda.StartingPosition.LATEST,
    }));



    // Method 2 - Filtered Event Method
    const ttlTable2 = new dynamodb.Table(this, 'ttlTable2', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      tableName: 'ttlTable2',
      timeToLiveAttribute: "TTL"
    });

    const triggeredEventMethod2Fn = new lambdaNode.NodejsFunction(this, 'TriggerEventHandlerFiltered', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'lambda/writeDeletedItemFromStreamMethod2.ts',
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
        region: process.env.CDK_DEFAULT_REGION!
      }
    });
    ttlTable2.grantStreamRead(triggeredEventMethod2Fn);

    // Add new source mapping
    const sourceMapping = new EventSourceMapping(this, 'eventSourceMapping', {
      startingPosition: lambda.StartingPosition.LATEST,
      target: triggeredEventMethod2Fn,
      eventSourceArn: ttlTable2.tableStreamArn,
      batchSize: 10,
      retryAttempts: 10,
    });

    // override the filter criteria 
    const cfnSourceMapping = sourceMapping.node.defaultChild as CfnEventSourceMapping  
    cfnSourceMapping.addPropertyOverride('FilterCriteria', {
        Filters: [
            {
                Pattern:
                    JSON.stringify({
                        // Only capture the REMOVE events
                        eventName: ['REMOVE'],
                    }),
            },
        ],
    });

  }

}
