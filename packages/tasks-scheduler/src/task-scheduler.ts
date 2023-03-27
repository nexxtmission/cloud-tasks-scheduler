import { CloudTasksClient, protos } from '@google-cloud/tasks';
import { NextFunction, Request, Response } from 'express';
import isValidGcpToken from './isValidGcpToken';
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

    private serviceAccountEmail: string;

    private projectId: string;

    private location: string;

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
        this.queue = this.client.queuePath(serviceAccount.project_id, defaultLocation, defaultQueue);
        this.executors = executors.reduce((acc, executor) => ({
            ...acc,
            [executor.name]: executor,
        }), {});
        this.url = new URL(pathname, baseUrl).href;
        this.serviceAccountEmail = serviceAccount.client_email;
        this.projectId = serviceAccount.project_id;
        this.location = defaultLocation;

        expressInstance.use((_, res: Response, next: NextFunction) => {
            res.locals.serviceAccount = serviceAccount
            return next();
        })
        expressInstance.use(isValidGcpToken);
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
                oidcToken: {
                    serviceAccountEmail: this.serviceAccountEmail,
                }
            },
        };

        if (scheduleTime) {
            taskData.scheduleTime = {
                seconds: scheduleTime / 1000,
            };
        }

        try {
            const [response] = await this.client.createTask({
                parent: this.queue,
                task: taskData,
            });
            const arr = response.name?.split('/') || [];
            return {
                ...task,
                id: arr[arr.length -1],
            };
        } catch (error) {
            if ((error as { code: number }).code === 9) {
                await this.client.createQueue({
                    parent: this.client.locationPath(this.projectId, this.location),
                    queue: {
                        name: this.queue,
                    }
                });
                const [response] = await this.client.createTask({
                    parent: this.queue,
                    task: taskData,
                });
                const arr = response.name?.split('/') || [];
                return {
                    ...task,
                    id: arr[arr.length -1],
                };
            }
            throw error;
        }
    }

    async get(id: string) {
        try {
            // TODO: here we are getting an empty buffer in the body, we need the body data to get all the task info we manage to be consistent with the add api
            const [response] = await this.client.getTask({
                name: `${this.queue}/tasks/${id}`,
            });
            return {
                id,
                scheduleTime: Number(response.scheduleTime?.seconds) * 1000
            }
        } catch (error) {
            return null
        }
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
