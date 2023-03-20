import admin from 'firebase-admin';
import { TaskScheduler, PushNoticationExecutor } from 'cloud-tasks-scheduler';
import serviceAccount from './service-account.json';
import notificationServiceAccount from './notification-service-account.json';
import expressApp from '../src';

const firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(notificationServiceAccount as admin.ServiceAccount),
});

const registrationToken = 'token here';

const scheduler = new TaskScheduler({
    defaultQueue: 'testing-queue', // TODO: pass queue also to scheduler.add method, same for location
    serviceAccount,
    executors: [new PushNoticationExecutor({
        firebaseAdmin,
    })],
    webhook: {
        expressInstance: expressApp,
        baseUrl: 'https://3fed-67-188-16-40.ngrok.io', // TODO: document how to use ngrok to set the URL
        pathname: '/test',
    },
});

(async () => {
    const { id } = await scheduler.add({ // TODO: maybe here we need to define a standar type with inSeconds or scheduleTime and payload which will be the generic one
        name: 'PushNotification',
        scheduleTime: Date.now() + 20000, // in 20 seconds
        payload: {
            registrationToken,
            message: {
                title: 'test notification',
                body: 'this is a message text',
            }
        },
    });
    // await scheduler.delete('projects/rainbow-modules/locations/us-central1/queues/testing-queue/tasks/55252566736411927541') // TODO: document delete task
    // const res = await scheduler.get('projects/rainbow-modules/locations/us-central1/queues/testing-queue/tasks/55252566736411927541') // TODO: document get task
    console.log('Success!!!');
})()
