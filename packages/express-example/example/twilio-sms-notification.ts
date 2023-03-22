/* eslint-disable @typescript-eslint/ban-ts-comment, no-console */
import { TaskScheduler, SmsNotificationExecutor } from 'cloud-tasks-scheduler';
import twilio from 'twilio';
// @ts-ignore
import serviceAccount from './service-account.json';
import expressApp from '../src';

const accountSid = '';
const authToken = '';

const from = '';
const to = '';

const client = twilio(accountSid, authToken);

const scheduler = new TaskScheduler({
    defaultQueue: 'testing-queue',
    serviceAccount,
    executors: [new SmsNotificationExecutor({
        twilioClient: client,
    })],
    webhook: {
        expressInstance: expressApp,
        baseUrl: 'https://9d52-67-188-16-40.ngrok.io',
        pathname: '/test-sms',
    },
});

(async () => {
    const { id } = await scheduler.add({
        name: 'SmsNotification',
        scheduleTime: Date.now() + 10000, // in 10 seconds
        payload: {
            text: 'This is a test message from Cloud Task',
            from,
            to,
        },
    });
    console.log(id);
    console.log('Success!!!');
})();
