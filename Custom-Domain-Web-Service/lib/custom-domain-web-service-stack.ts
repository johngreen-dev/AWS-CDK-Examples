import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import {
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNode,
  aws_apigateway as apigw,
  aws_route53 as route53,
  aws_certificatemanager as cert,
  Duration
} from 'aws-cdk-lib';

export class CustomDomainWebServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Node Lambda Function
    const lambdaFn = new lambdaNode.NodejsFunction(this, 'LambdaFunctionHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'lambda/helloWorld.ts',
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
      }
    });

    // API Gateway
    const gateway = new apigw.RestApi(this, 'ApiGAteway');
    const version = gateway.root.addResource('v1');
    const api = version.addResource('hello');
    // enable cors
    api.addCorsPreflight({
      allowOrigins: apigw.Cors.ALL_ORIGINS
    });
    // Integration of lambda
    const lambdaIntegration = new apigw.LambdaIntegration(lambdaFn);
    // Add the Lambda as a GET method
    api.addMethod('GET', lambdaIntegration)
 


    

    // Add Custom Domain for API gateway
    const domainName = 'AddDomainName.com'; // MODIFY THIS WITH YOUR DOMAIN NAME! 
    const certDomainName = `*.${domainName}`; // Cirtificate will be generated for *.AddDomainName.com
    const domainNamePart = 'test'; // this will add a subdomain eg. test.AddDomainName.com

    // Get the zone by the domain name
    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', { "domainName": domainName });

    // Create New Wild Card Certificate
    const certVal = new cert.DnsValidatedCertificate(this, 'Certificate', {
      hostedZone: zone,
      domainName: certDomainName,
      region: 'us-east-1',
    });

    // Create the custom domain
    const customDomain = new apigw.DomainName(this, 'customDomain', {
      domainName: ( domainNamePart + '.' + domainName ),
      certificate: cert.Certificate.fromCertificateArn(this, 'ACM_Certificate', certVal.certificateArn),
      endpointType: apigw.EndpointType.EDGE,
      securityPolicy: apigw.SecurityPolicy.TLS_1_2
    });

    // Associate the Custom domain that we created with new APIGateway using BasePathMapping:
    const basePathMap = new apigw.BasePathMapping(this, 'CustomBasePathMapping', {
      domainName: customDomain,
      restApi: gateway
    });

    // Finally, add a CName record in the hosted zone with a value of the new custom domain that was created above:
    const r53Record = new route53.CnameRecord(this, 'ApiGatewayRecordSet', {
      zone: zone,
      recordName: domainNamePart,
      domainName: customDomain.domainNameAliasDomainName
    });


  }
}
