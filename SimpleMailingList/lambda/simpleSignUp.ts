import { Context, Callback } from 'aws-lambda';
import { SESV2 } from 'aws-sdk';

export async function main(event: any, _context: Context, callback: Callback) {
    const ses = new SESV2({ region: process.env.region });
    console.log('event', event)
    console.log('create ses');

    try {
        if (!event.body){
            throw(new Error("No Body"))
        }
        if (!event.body.email){
            throw(new Error("No Email Address"))
        }
        console.log('process.env.contactLitsName', process.env.contactLitsName);
        // const createContact = await ses.createContact({
        //     ContactListName: process.env.contactLitsName!,
        //     EmailAddress: event.body.email,
        //     UnsubscribeAll: false,
        //     TopicPreferences: [
        //         {
        //             TopicName: 'ExampleTopicName',
        //             SubscriptionStatus: 'OPT_IN'
        //         }
        //     ],
        // }).promise()

        // console.log('createContact done')
        // if (createContact.$response.error) {
        //     throw(createContact.$response.error)
        // }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify("done")
        };
    } catch (error: any) {
        console.log('error', error)
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(error.message)
        };
    }
}