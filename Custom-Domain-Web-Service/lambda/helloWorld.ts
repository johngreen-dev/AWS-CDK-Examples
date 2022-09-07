import { Context, Callback } from 'aws-lambda';
import {DynamoDB} from 'aws-sdk';

export async function main(event: any, _context: Context, callback: Callback) {
    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: "Hello World"
    };
}