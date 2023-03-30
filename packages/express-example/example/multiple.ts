/* eslint-disable @typescript-eslint/ban-ts-comment, no-console */
import { TaskScheduler, SmsNotificationExecutor, PushNotificationExecutor } from 'cloud-tasks-scheduler';
import twilio from 'twilio';
import admin from 'firebase-admin';
// @ts-ignore
import serviceAccount from './service-account.json';
// @ts-ignore
import notificationServiceAccount from './notification-service-account.json';
import expressApp from '../src';

const firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(notificationServiceAccount as admin.ServiceAccount),
});

const registrationToken = '';

const accountSid = '';
const authToken = '';

const from = '';
const to = '';

const client = twilio(accountSid, authToken);

const scheduler = new TaskScheduler({
    defaultQueue: 'testing-queue',
    serviceAccount,
    executors: [
        new PushNotificationExecutor({
            firebaseAdmin,
        }),
        new SmsNotificationExecutor({
            twilioClient: client,
        }),
    ],
    webhook: {
        expressInstance: expressApp,
        baseUrl: 'https://9d52-67-188-16-40.ngrok.io',
    },
});

(async () => {
    await scheduler.add({
        name: 'SmsNotification',
        scheduleTime: Date.now() + 10000,
        payload: {
            text: 'This is a test message from Cloud Task',
            from,
            to,
        },
    });
    await scheduler.add({
        name: 'PushNotification',
        scheduleTime: Date.now() + 10000,
        payload: {
            registrationToken,
            message: {
                title: 'test notification',
                body: 'this is a message text',
            },
        },
    });
    console.log('Success!!!');
})();
