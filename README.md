# `cloud-tasks-scheduler`

> Module to schedule tasks to Google Cloud Tasks. Inside this module we provide executors then you don't need to implement a handler for the task

## Usage

```js
import { TaskScheduler, PushNoticationExecutor } from 'cloud-tasks-scheduler';
// or you can use ES6 import `import { TaskScheduler, PushNoticationExecutor } from 'cloud-tasks-scheduler';`

const scheduler = new TaskScheduler({
    defaultQueue: 'queue-name',
    defaultLocation: 'us-central1', // optional, by default it is 'us-central1'
    serviceAccount, // service account json for the project where the queue will exists
    executors: [new PushNoticationExecutor({
        firebaseAdmin, // firebase admin instance initialized
    })],
    webhook: {
        expressInstance: expressApp, // express app instance
        baseUrl: 'https://api.my-backend.com', // base url, this could be an env variable since it can change between environments
        pathname: '/push-notification/send', // endpoint pathname you want to use for the handler thus it does not conflict with your current endpoints
    },
});

...

const { id } = await scheduler.add({
    name: 'PushNotification',
    scheduleTime: Date.now() + 30000, // in 30 seconds
    payload: {
        registrationToken, // firebase device token
        message: {
            title: 'test notification',
            body: 'this is a test message',
        },
    },
    metadata: {
        foo: 'bar',
    },
});
```

### if you want to remove a task

```js
const res = await scheduler.delete(id); // res will be a boolean indicating if the deletion was success or not
```

## Using the local example

Run: `ts-node packages/express-example/example/file-name-example.ts`

## Publish the `cloud-tasks-scheduler` package

1. `cd packages/tasks-scheduler`
2. `yarn publish`
