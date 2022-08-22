import { Context, Callback } from 'aws-lambda';
import { CostExplorer } from 'aws-sdk';
import { SlackClass } from './SlackClass';

const moment = require('moment');

export async function main(event: any, _context: Context, callback: Callback) {

    var date = new Date();
    var StartDate = moment(date).add(-1, 'd').format('YYYY-MM-DD');
    var EndDate = moment(date).format('YYYY-MM-DD');
    var StartDateReadable = moment(date).add(-1, 'd').format('MMMM Do, YYYY');

    const costs = new CostExplorer({region: 'us-east-1'});

    const params: CostExplorer.Types.GetCostAndUsageRequest = {
        Granularity: 'DAILY',
        TimePeriod: {
            End: EndDate,
            Start: StartDate
        },
        Metrics: ['UNBLENDED_COST'],

    };
    const usage = await costs.getCostAndUsage(params).promise();
    console.log('usage',usage);
    const data: any =  usage.$response.data;
    // const UnblendedCost = data.ResultsByTime[0].Total.UnblendedCost;

    const slack = new SlackClass();
    const send = await slack.SendToSlack(`Daily Spend: $ ${data.ResultsByTime[0].Total.UnblendedCost.Amount}`);
    
    callback(null);

}
