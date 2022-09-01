import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNode,
  aws_sns as sns,
  aws_sns_subscriptions as subscriptions,
  aws_dynamodb as dynamodb,
  aws_events as events,
  aws_events_targets as targets,
  aws_iam as iam,
  Duration,
  RemovalPolicy,
} from 'aws-cdk-lib';

export class WebsiteMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const monitorAppURL = "https://Website.URL";
    const monitorAppString = "String to find in the index.html";
    const monitorServerFrom = "WebMonitor"; // Max 11ch
    const monitoringEmail = "email_me@mail.com";
    const scheduleRuleName = `ScheduleMonitorRule`;
    const mainScheduleRate = 1; // Check every X mins


    // Create the Historic results table
    const ddbResultsTable = new dynamodb.Table(this, 'MonitorResultsTable', {
      partitionKey: {name:'ID', type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });
    // The latest results
    const ddbLatestResultsTable = new dynamodb.Table(this, 'MonitorLatestResultsTable', {
      partitionKey: {name:'ID', type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // the monitor topic
    const monitorTopic = new sns.Topic(this, 'NotifySNS');
    // monitorTopic.addSubscription(new subscriptions.SmsSubscription('+440000000000')); // to enable SMS
    monitorTopic.addSubscription(new subscriptions.EmailSubscription(monitoringEmail));


    // Schedular
    const cronEvent = new events.Rule(this, 'MonitorAppScheduleRule', {
      ruleName: scheduleRuleName,
      schedule: events.Schedule.rate(Duration.minutes(mainScheduleRate))
    });

    // Function called by schedular to Monitor the site
    const runMonitorCheckFn = new lambdaNode.NodejsFunction(this, 'MonitorCheckHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'lambda/monitorSites.ts',
      handler: 'main',
      timeout: Duration.seconds(5),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
          'got'
        ],
        minify: true
      },
      environment: {
        "monitorTopicArn": monitorTopic.topicArn,
        "resultsHistoricTable": ddbResultsTable.tableName,
        "resultsLatestTable": ddbLatestResultsTable.tableName,
        "monitorUrl": monitorAppURL,
        "monitorTitle": monitorAppString,
        "monitorServer": monitorServerFrom,
        "eventSchedularName": scheduleRuleName,
        "eventSchedularRate": mainScheduleRate.toString(),
        region: process.env.CDK_DEFAULT_REGION!
      }
    });
    monitorTopic.grantPublish(runMonitorCheckFn);
    ddbResultsTable.grantWriteData(runMonitorCheckFn);
    ddbLatestResultsTable.grantReadWriteData(runMonitorCheckFn);
    const changeCronRatePolicy = new iam.PolicyStatement({
      actions: ['events:DescribeRule', 'events:PutRule'],
      resources: [cronEvent.ruleArn],
    });
    runMonitorCheckFn.role?.attachInlinePolicy(new iam.Policy(this, 'Monitoring-Change-Cron-Rate-Policy', {
      statements:[changeCronRatePolicy]
    }));

    cronEvent.addTarget(new targets.LambdaFunction(runMonitorCheckFn));

  }
}
