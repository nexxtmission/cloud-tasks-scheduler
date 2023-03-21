/* eslint-disable max-classes-per-file */
import { CloudTasksClient, protos } from '@google-cloud/tasks';
import { Request, Response } from 'express';
import admin from 'firebase-admin';
import {
    TaskSchedulerI,
    TaskSchedulerConfigI,
    NotificationName,
    Task,
    TaskExecutorI,
    PushNoticationExecutorConfigI,
    TypeMap,
} from './types';

class TaskScheduler implements TaskSchedulerI {
    private client: CloudTasksClient;

    private queue: string;

    private executors: TaskExecutorI[];

    private url: string;

    constructor(config: TaskSchedulerConfigI) {
        const {
            defaultQueue,
            defaultLocation = 'us-central1',
            serviceAccount,
            executors,
            webhook: {
                expressInstance,
                baseUrl,
                pathname, // TODO: we will use a default pathname?
            },
        } = config;

        this.client = new CloudTasksClient({
            credentials: serviceAccount,
        });
        const queue = this.client.queuePath(serviceAccount.project_id, defaultLocation, defaultQueue);
        this.queue = queue;
        this.executors = executors;
        this.url = new URL(pathname, baseUrl).href;

        expressInstance.post(pathname, async (req: Request, res: Response) => {
            await Promise.all([
                this.executors.map(executor => { // TODO: check what to do here with all executors, change this to find only the executor
                    const { payload, metadata } = req.body;
                    return executor.execute(payload, metadata);
                })
            ]);
            return res.sendStatus(200);
        });
    }

    async add<T extends NotificationName>(task: Task<T>) {
        const { payload, scheduleTime, name } = task;
        const taskData: protos.google.cloud.tasks.v2.ITask = {
            httpRequest: {
                headers: {
                    'Content-Type': 'application/json',
                },
                httpMethod: 'POST',
                url: this.url,
                body: task ? Buffer.from(JSON.stringify(task)).toString('base64') : undefined,
            },
        };

        if (scheduleTime) {
            taskData.scheduleTime = {
                // seconds: parseInt(String(inSeconds)) + Date.now() / 1000,
                seconds: scheduleTime / 1000,
            };
        }

        const request: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
            parent: this.queue,
            task: taskData,
        };
        const [response] = await this.client.createTask(request);
        // console.log(`Created task ${response.name}`);
        // console.log(`Task response:`, JSON.stringify(response, null, 2));
        // return response.name; // TODO: here we can simply return the name (a string) or we can return and object with { name: string, createdTime: Date | Timestamp, scheduledTime: Date | Timestamp }
        return {
            id: response.name, // TODO: add id to Task type
            name,
            scheduleTime,
            payload,
        }
    }

    // TODO: discuss if we will have a get method
    // async get(name: string) {
    //     const [response] = await this.client.getTask({
    //         name,
    //     });
    //     return response; // TODO: check what to return here
    // }

    async delete(name: string) {
        await this.client.deleteTask({
            name
        });
        return name;
    }
}

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

export { TaskScheduler, PushNoticationExecutor };
