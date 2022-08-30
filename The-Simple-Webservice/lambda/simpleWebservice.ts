import { Context, Callback } from 'aws-lambda';
import {DynamoDB} from 'aws-sdk';

export async function main(event: any, _context: Context, callback: Callback) {

    try {
        // Write a random number to the dynamo table
        const documentClient = new DynamoDB.DocumentClient();
        const params: DynamoDB.DocumentClient.GetItemInput = {
            TableName : process.env.tableName!,
            Key: {
                ID: "TEST_ITEM"
            }
        }
        const data = await documentClient.get(params).promise();
        console.log('data ', data);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.log('error', error)
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(error)
        };
    }
}