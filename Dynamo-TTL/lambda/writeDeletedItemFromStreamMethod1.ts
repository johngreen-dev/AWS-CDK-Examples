import { Context, Callback } from 'aws-lambda';

export async function main(event: any, _context: Context, callback: Callback) {

    try {
        const {Records} = event
        Records.forEach((record: { eventName: any; dynamodb: any; }) => {
            console.log(record)
            const {eventName, dynamodb} = record
            if (eventName === 'REMOVE') {
                // logic for archiving the lambda item 
            } else {
                // ignore this event type
            }
        })
    } catch (error) {
        console.log('error', error)
    }
}



