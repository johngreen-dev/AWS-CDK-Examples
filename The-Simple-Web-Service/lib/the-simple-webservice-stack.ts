import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import {
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNode,
  aws_apigateway as apigw,
  Duration,
  RemovalPolicy
} from 'aws-cdk-lib';

export class TheSimpleWebserviceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Dynamo Table for returning data
    const dynamoTable = new dynamodb.Table(this, 'simpleWebserviceTable', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'ID', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      tableName: 'simpleWebserviceTable',
    });


    // Node Lambda Function
    const lambdaFn = new lambdaNode.NodejsFunction(this, 'LambdaFunctionHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'lambda/simpleWebservice.ts',
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
        region: process.env.CDK_DEFAULT_REGION!,
        tableName: dynamoTable.tableName
      }
    });
    // Grant read access to the lambda function on the dynamo table
    dynamoTable.grantReadData(lambdaFn);

    // API Gateway
    const gateway = new apigw.RestApi(this, 'ApiGAteway');
    const version = gateway.root.addResource('v1');
    const api = version.addResource('get-dynamo-item');
    // enable cors
    api.addCorsPreflight({
      allowOrigins: apigw.Cors.ALL_ORIGINS
    });
    // Integration of lambda
    const lambdaIntegration = new apigw.LambdaIntegration(lambdaFn);
    // Add the Lambda as a GET method
    api.addMethod('GET', lambdaIntegration)
 

  }
}
