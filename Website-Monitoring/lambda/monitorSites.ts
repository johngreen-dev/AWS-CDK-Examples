import { Context, Callback } from 'aws-lambda';
import { MonitoringClass } from './MonitoringClass';

export async function main(event: any, _context: Context, callback: Callback) {

  // const evBody = JSON.parse(event.body);
  const monitorTopic = process.env.monitorTopicArn!;

  const Monitoring = new MonitoringClass();
  const url = process.env.monitorUrl!;
  const title = process.env.monitorTitle!;
  const server = process.env.monitorServer!;
  const eventSchedularRate: number = parseInt(process.env.eventSchedularRate!);

  try {

    // Get the previous test results
    const getLastValues = await Monitoring.GetLastValues(url);

    // Run the GET request
    const poll = await Monitoring.PollWebsite(url);
    if (poll.ok) {
      // Find the String we are looking for ( usually page title)
      const containsString = await Monitoring.CheckForString(poll.response, title);
      if (containsString) {

        // Site Found
        await Monitoring.WriteToHistoricDB(url, title, true, 'ok');

        // IF changes alsos send SNS and update the poll rate back to the predefined one
        if (getLastValues!.Item!.status === false) {
          await Monitoring.WriteLatestValue(url, true, 'ok');
          await Monitoring.SendEventSNS(`${url} Restored`, `${url} Restored`, monitorTopic, server);
          await Monitoring.UpdatePollRate(eventSchedularRate);
        }

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Complete" })
        };

      } else {
        // No Title found
        await Monitoring.WriteToHistoricDB(url, title, false, 'No Title');

        //IF changes also send SNS and update the poll rate to run every 1 minute
        if (getLastValues!.Item!.status === true) {
          await Monitoring.WriteLatestValue(url, false, 'Website Down');
          await Monitoring.SendEventSNS(`${url} is not reachable`, `${url} is not reachable`, monitorTopic, server);
          await Monitoring.UpdatePollRate(1);
        }
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: "Title Not Found"
        };
      }
    } else {
      // Website Down
      await Monitoring.WriteToHistoricDB(url, title, false, 'URL Not Found');

      //IF changes also send SNS and update the poll rate to run every 1 minute
      if (getLastValues!.Item!.status === true) {
        await Monitoring.WriteLatestValue(url, false, 'Website Down');
        await Monitoring.SendEventSNS(`${url} is not reachable`, `${url} is not reachable`, monitorTopic, server);
        await Monitoring.UpdatePollRate(1);
      }

      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: 'Website Down'
      };
    }



  } catch (e) {

    const error: any = e;
    console.log('error ', error);
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(error)
    };
  }
}

