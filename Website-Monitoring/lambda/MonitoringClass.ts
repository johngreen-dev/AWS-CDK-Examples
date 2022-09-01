const aws = require('aws-sdk');
const got = require('got');
import {DynamoDB} from 'aws-sdk';


export class MonitoringClass {

  // Go and Get the Website data with a GET request
    async PollWebsite(url: string){
        // Post request to get the token
        try {
          const token = await got.get( url);
          return {ok: true, response: token.body};
        } catch (error) {
          console.log('error', error);
          return {ok: false, response: error};
        }

    }

  // Check the String we are looking for is in the page
    CheckForString(str: string, title: string) {
        return str.includes(title);
    }

  // Write the results to the historic Dynamo table
    async WriteToHistoricDB(urlStr: string, titleStr: string, statusB: boolean, infoStr: string) {
        try{
            const documentClient = new DynamoDB.DocumentClient();
            const params: DynamoDB.DocumentClient.PutItemInput = {
                TableName : process.env.resultsHistoricTable!,
                Item: {
                    ID: Date.now().toString(),
                    url: urlStr,
                    title: titleStr,
                    status: statusB,
                    info: infoStr
                }
            }
            const data = await documentClient.put(params).promise();
        }
        catch(e) {
            throw new Error('Failed to write to DB');
        }
    }

    // Get the latest values from the DynamoDB table
      async GetLastValues(url: string) {
          const documentClient = new DynamoDB.DocumentClient();
          const params: DynamoDB.DocumentClient.GetItemInput = {
              TableName: process.env.resultsLatestTable!,
              Key: {
                  ID: url
              }
          };
          try{
              const result = await documentClient.get(params).promise();
              return result;
          } catch (e) {
              throw new Error('Failed to get last values');
          }
      }

      // Write the Latest Values to the Current values table
      async WriteLatestValue(urlStr: string, statusB: boolean, infoStr: string) {
          try{
              const documentClient = new DynamoDB.DocumentClient();
              const params: DynamoDB.DocumentClient.PutItemInput = {
                  TableName : process.env.resultsLatestTable!,
                  Item: {
                      ID: urlStr,
                      time: Date.now().toString(),
                      status: statusB,
                      info: infoStr
                  }
              }
              const data = await documentClient.put(params).promise();
              console.log('Added ', data);
          }
          catch(e) {
              throw new Error('Failed to write to DB');
          }
      }

    // Publish the SNS Event
    async SendEventSNS(message: string, subject: string, topicArn: string, from: string){
      // Note for Text messages sender ID must be less that 11 chars
        if (from.length > 11) {
            throw new Error('SenderID > 11 char');
        }
        try{
            var sns = new aws.SNS();
            var params = {
                Message: message,
                Subject: subject,
                TopicArn: topicArn,
                MessageAttributes: {
                "AWS.SNS.SMS.SenderID": {
                    "DataType":"String",
                    "StringValue": from
                }
                }
            };
            const pub = await sns.publish(params).promise();
        } catch (e) {
            throw new Error('Failed to write to DB');
        }
    }


    // Change the EventBridge polling rate
    async UpdatePollRate(rate: number) {
        const eventBridge = new aws.EventBridge();

        const params = {
            Name: process.env.eventSchedularName!
        };

        const getRule = await eventBridge.describeRule(params).promise();

        let expression = `rate(${rate} minutes)`
        if (rate === 1) {
            expression = `rate(${rate} minute)`
        }

        const newParams = {
            Name: getRule.Name,
            ScheduleExpression: expression
        };
        const updateRule = await eventBridge.putRule(newParams).promise();
    }

}
