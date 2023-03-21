import { TaskScheduler } from 'cloud-tasks-scheduler';
import serviceAccount from '../firebase-admin/service-account.json';
import {Router} from 'express';

class PushNotificationExecutor {
    name: 'PushNotification' = 'PushNotification';
    constructor() {
    }

    execute(payload: any, metadata: any) {
        console.log(payload)
        console.log(metadata)
        console.log('executing');
    };
}

export const router = Router();

export default new TaskScheduler({
    defaultQueue: 'testing',
    serviceAccount,
    executors: [new PushNotificationExecutor()],
    webhook: {
        expressInstance: router,
        baseUrl: 'https://c980-81-202-92-218.ngrok.io',
        pathname: '/scheduler-webhook',
    },
});
