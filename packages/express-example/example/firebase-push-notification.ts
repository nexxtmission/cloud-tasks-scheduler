/* eslint-disable @typescript-eslint/ban-ts-comment, no-console */
import admin from 'firebase-admin';
import { TaskScheduler, PushNoticationExecutor } from 'cloud-tasks-scheduler';
// @ts-ignore
import serviceAccount from './service-account.json';
// @ts-ignore
import notificationServiceAccount from './notification-service-account.json';
import expressApp from '../src';

const firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(notificationServiceAccount as admin.ServiceAccount),
});

const registrationToken = '';

const scheduler = new TaskScheduler({
    defaultQueue: 'testing-queue',
    serviceAccount,
    executors: [new PushNoticationExecutor({
        firebaseAdmin,
    })],
    webhook: {
        expressInstance: expressApp,
        baseUrl: 'https://9d52-67-188-16-40.ngrok.io',
        pathname: '/test',
    },
});

(async () => {
    const { id } = await scheduler.add({
        name: 'PushNotification',
        scheduleTime: Date.now() + 20000, // in 20 seconds
        payload: {
            registrationToken,
            message: {
                title: 'test notification',
                body: 'this is a message text',
            },
        },
        metadata: {
            foo: 'bar',
        },
    });
    console.log(id);
    console.log('Success!!!');
})();
