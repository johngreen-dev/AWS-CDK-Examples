const aws = require('aws-sdk');
aws.config.update({region: process.env.region});
class App {
  constructor() {
  }
  async start() {
    const documentClient = new aws.DynamoDB.DocumentClient();
    const params = {
      TableName : process.env.databaseTable,
      Item: {
        ID: Math.floor(Math.random() * Math.floor(10000000)).toString(),
      }
    }
    console.log('Add item to dynamo');
    const data = documentClient.put(params).promise();
  }
  
}
 
const app = new App();
app.start();