import got from 'got';


export class SlackClass {
 

    async SendToSlack(msg: string) {
        // Post request to get the token
        try {
            const bodyVal = {
                text: msg
            };
        
            const options = {
                body: JSON.stringify(bodyVal)
            };
            const send = await got.post(process.env.SLACK_CHANNEL!, options);
            return send;

        } catch (error) {
            console.log('error', error);
            return 'error'
        }
    }

}
