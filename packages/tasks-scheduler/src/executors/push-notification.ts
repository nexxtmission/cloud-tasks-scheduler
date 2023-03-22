import admin from 'firebase-admin';
import { TaskExecutorI, NotificationName, PushNoticationExecutorConfigI, TypeMap } from '../types';

class PushNoticationExecutor implements TaskExecutorI {
    name: NotificationName;

    private firebaseAdmin: admin.app.App;

    constructor({ firebaseAdmin }: PushNoticationExecutorConfigI) {
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

export default PushNoticationExecutor;
