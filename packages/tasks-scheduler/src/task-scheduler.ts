import { CloudTasksClient, protos } from '@google-cloud/tasks';
import { Request, Response } from 'express';
import {
    TaskSchedulerI,
    TaskSchedulerConfigI,
    NotificationName,
    Task,
    TaskExecutorI,
} from './types';

class TaskScheduler implements TaskSchedulerI {
    private client: CloudTasksClient;

    private queue: string;

    private executors: Record<NotificationName | string, TaskExecutorI | undefined>;

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
                pathname = '/cloud-task/webhook',
            },
        } = config;

        this.client = new CloudTasksClient({
            credentials: serviceAccount,
        });
        const queue = this.client.queuePath(serviceAccount.project_id, defaultLocation, defaultQueue);
        this.queue = queue;
        this.executors = executors.reduce((acc, executor) => ({
            ...acc,
            [executor.name]: executor,
        }), {});
        this.url = new URL(pathname, baseUrl).href;

        expressInstance.post(pathname, async (req: Request<object, object, Task<NotificationName>>, res: Response) => {
            const { name, payload, metadata } = req.body;
            if (this.executors[name]) {
                await this.executors[name]?.execute(payload, metadata);
            }
            return res.sendStatus(200);
        });
    }

    async add<T extends NotificationName>(task: Omit<Task<T>, "id">) {
        const { scheduleTime } = task;
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
                seconds: scheduleTime / 1000,
            };
        }

        const request: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
            parent: this.queue,
            task: taskData,
        };
        const [response] = await this.client.createTask(request);
        const arr = response.name?.split('/') || [];
        return {
            ...task,
            id: arr[arr.length -1],
        };
    }

    async delete(id: string) {
        try {
            await this.client.deleteTask({
                name: `${this.queue}/tasks/${id}`,
            });
            return true;
        } catch (error) {
            return false
        }
    }
}

export default TaskScheduler;
