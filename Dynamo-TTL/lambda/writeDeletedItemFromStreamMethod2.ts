import { Context, Callback } from 'aws-lambda';
import {DynamoDB} from 'aws-sdk';

export async function main(event: any, _context: Context, callback: Callback) {

    try {
        const {Records} = event
        Records.forEach((record: { eventName: any; dynamodb: any; }) => {
            console.log(record)
            // archive logic
        })
    } catch (error) {
        console.log('error', error)
    }
}



