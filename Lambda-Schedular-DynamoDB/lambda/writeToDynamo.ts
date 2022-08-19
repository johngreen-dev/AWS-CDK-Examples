import { Context, Callback } from 'aws-lambda';
import {DynamoDB} from 'aws-sdk';

export async function main(event: any, _context: Context, callback: Callback) {

    try {
        // Write a random number to the dynamo table
        const documentClient = new DynamoDB.DocumentClient();
        const params: DynamoDB.DocumentClient.PutItemInput = {
            TableName : process.env.tableName!,
            Item: {
                ID: Math.floor(Math.random() * Math.floor(10000000)).toString(),
                time: Date.now().toString(),
            }
        }
        const data = await documentClient.put(params).promise();
        console.log('Added ', data);
        return;
    } catch (error) {
        console.log('error', error)
    }
}



