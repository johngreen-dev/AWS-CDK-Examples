import { Context, Callback } from 'aws-lambda';
import { SESv2Client, CreateContactCommand  } from "@aws-sdk/client-sesv2";

export async function main(event: any, _context: Context, callback: Callback) {
    console.log('event', event)
    console.log('create ses');
    const ses = new SESv2Client({ region: process.env.region });

    try {
        if (!event.body){
            throw(new Error("No Body"))
        }
        const body = JSON.parse(event.body);
        console.log('body', body)
        if (!body.email){
            throw(new Error("No Email Address"))
        }
        console.log('process.env.contactListName', process.env.contactListName);

        const command = new CreateContactCommand({
                ContactListName: process.env.contactListName!,
                EmailAddress: body.email,
                UnsubscribeAll: false,
                TopicPreferences: [
                    {
                        TopicName: 'ExampleTopicName',
                        SubscriptionStatus: 'OPT_IN'
                    }
                ],
            });

        const response = await ses.send(command);
        console.log('response', response);


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