import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import {
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNode,
  aws_events as events,
  aws_events_targets as targets,
  aws_iam as iam,
  Duration,
} from 'aws-cdk-lib';

export class AwsCostsToSlackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const SLACK_CHANNEL = "https://hooks.slack.com/services/###########/###########/########################"; // Modify this with your webhook or .env file

    // Function called by schedular check the billing and send a message to slack
    const triggeredEventFn = new lambdaNode.NodejsFunction(this, 'SlackBudgetTriggerEventHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'lambda/writeBudgetToSlack.ts',
      handler: 'main',
      timeout: Duration.seconds(3),
      logRetention: 14,
      bundling: {
        externalModules: [
        ],
        nodeModules: [
          'got',
          'moment'
        ],
        minify: true
      },
      environment: {
        "SLACK_CHANNEL": SLACK_CHANNEL,
        region: process.env.CDK_DEFAULT_REGION!
      }
    });

    // Add permissions for get-cost-and-usage
    const changeCronRatePolicy = new iam.PolicyStatement({
      actions: [
        'ce:Get*',
        'ce:Describe*',
      ],
      resources: ['*'],
    });

    triggeredEventFn.role?.attachInlinePolicy(new iam.Policy(this, 'Cost-And-Usage-Policy', {
      statements:[changeCronRatePolicy]
    }));

    // Schedular from event bridge
    const eventBridgeSchedular = new events.Rule(this, 'SlackBudgetEventBridgeSchedular', {
      ruleName: 'slackBudgetEventBridgeSchedular',
      schedule: events.Schedule.rate(Duration.days(1))
    });

    // Add the lambda as a target of the schedular event
    eventBridgeSchedular.addTarget(new targets.LambdaFunction(triggeredEventFn));


  }
}
