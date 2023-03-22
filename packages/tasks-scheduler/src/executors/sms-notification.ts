import TwilioSDK from 'twilio';
import { TaskExecutorI, NotificationName, SmsNoticationExecutorConfigI, TypeMap } from '../types';

class SmsNotificationExecutor implements TaskExecutorI {
    name: NotificationName;

    private twilioClient: TwilioSDK.Twilio;

    constructor({ twilioClient }: SmsNoticationExecutorConfigI) {
        this.name = 'SmsNotification';
        this.twilioClient = twilioClient;
    }

    execute<T extends NotificationName>(payload: TypeMap[T]) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { from, to, text } = payload;
        return this.twilioClient.messages
            .create({
                body: text,
                from,
                to,
            });
    }
}

export default SmsNotificationExecutor; // TODO: check this name since we could use other services to send sms
