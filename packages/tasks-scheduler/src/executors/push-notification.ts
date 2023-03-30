import admin from 'firebase-admin';
import { TaskExecutorI, NotificationName, PushNotificationExecutorConfigI, TypeMap } from '../types';

class PushNotificationExecutor implements TaskExecutorI {
    name: NotificationName;

    private firebaseAdmin: admin.app.App;

    constructor({ firebaseAdmin }: PushNotificationExecutorConfigI) {
        this.name = 'PushNotification';
        this.firebaseAdmin = firebaseAdmin;
    }

    execute<T extends NotificationName>(payload: TypeMap[T]) { // TODO: improve typing here to simply use PushNotificationExecutorPayload
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { registrationToken, message } = payload; // TODO: improve typing here
        this.firebaseAdmin.messaging().sendToDevice(registrationToken, {
            notification: message,
        });
        // TODO: add event listener here to let you know when the notification was sent
    }
}

export default PushNotificationExecutor;
