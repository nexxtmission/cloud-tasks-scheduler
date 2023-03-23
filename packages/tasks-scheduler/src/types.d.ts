import { Express } from 'express';
import admin from 'firebase-admin';
import TwilioSDK from 'twilio';

export interface PushNotificationExecutorPayload {
    registrationToken: string;
    message: {
        title?: string;
        body?: string;
    };
}

export interface SmsNotificationExecutorPayload {
    from: string;
    to: string;
    text: string;
    // message: string; // TODO: PushNotificationExecutorPayload and SmsNotificationExecutorPayload are mixing types in executor then if you use message also here in executor it fails because it get `stirng | { title, body }` as the type
}

export interface TypeMap {
    PushNotification: PushNotificationExecutorPayload;
    SmsNotification: SmsNotificationExecutorPayload;
}

export type NotificationName = keyof TypeMap;

export type Metadata = Record<string, unknown>;

export type Task<T extends NotificationName> = {
    id: string;
    name: T;
    scheduleTime?: number;
    payload: TypeMap[T];
    metadata?: Metadata;
};

export interface TaskSchedulerI {
    add<T extends NotificationName>(task: Omit<Task<T>, "id">): Promise<Task<T>>;
    delete(id: string): Promise<boolean>;
}

export interface TaskExecutorI {
    name: NotificationName;
    execute: <T extends NotificationName>(payload: TypeMap[T], metadata?: Metadata) => void;
    // getQueue?: () => string; // TODO: implement this to pass queue in executor
}

interface ServiceAccount {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}

export interface TaskSchedulerConfigI {
    defaultQueue: string;
    defaultLocation?: string;
    serviceAccount: ServiceAccount;
    executors: Array<TaskExecutorI>;
    webhook: {
        expressInstance: Express;
        baseUrl: string;
        pathname?: string;
    };
}

export interface PushNoticationExecutorConfigI {
    firebaseAdmin: admin.app.App;
}

export interface SmsNoticationExecutorConfigI {
    twilioClient: TwilioSDK.Twilio;
}
