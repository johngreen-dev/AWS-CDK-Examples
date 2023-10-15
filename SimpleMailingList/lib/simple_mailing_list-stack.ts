import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNode,
  aws_apigateway as apigw,
  Duration,
  aws_ses as ses,
} from 'aws-cdk-lib';

export class SimpleMailingListStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
      const cfnContactList = new ses.CfnContactList(this, 'MyCfnContactList', {
        contactListName: 'exampleContactListName',
        description: 'description',
        topics: [{
          defaultSubscriptionStatus: 'OPT_IN',
          displayName: 'ExampleTopicDisplayName',
          topicName: 'ExampleTopicName',
      
          // the properties below are optional
          description: 'topicDescription for ExampleTopicName',
        }],
      });
      
      
    
      // Node Lambda Function
      const signupFn = new lambdaNode.NodejsFunction(this, 'LambdaFunctionHandler', {
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: 'lambda/simpleSignUp.ts',
        handler: 'main',
        timeout: Duration.seconds(5),
        bundling: {
          externalModules: [
          ],
          nodeModules: [
          ],
          minify: true
        },
        environment: {
          region: process.env.CDK_DEFAULT_REGION!,
          contactLitsName: cfnContactList.contactListName!
        }
      });

      // API Gateway
      const gateway = new apigw.RestApi(this, 'ApiGAteway');
      const version = gateway.root.addResource('v1');
      const api = version.addResource('sign-up');
      // enable cors
      api.addCorsPreflight({
        allowOrigins: apigw.Cors.ALL_ORIGINS
      });
      // Integration of lambda
      const lambdaIntegration = new apigw.LambdaIntegration(signupFn);
      // Add the Lambda as a GET method
      api.addMethod('POST', lambdaIntegration)
  

    }
}
