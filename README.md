# Cloud Tasks Scheduler SDK Documentation

This document provides a detailed overview of the Cloud Tasks Scheduler SDK, a library that uses GCP Cloud Task to create tasks for executing scheduled jobs.

## Table of Contents

- [Cloud Tasks Scheduler SDK Documentation](#cloud-tasks-scheduler-sdk-documentation)
  - [Table of Contents](#table-of-contents)
  - [Before you begin](#before-you-begin)
  - [Getting Started](#getting-started)
  - [Initialization](#initialization)
  - [Configuration](#configuration)
  - [Usage](#usage)
    - [Adding a Task](#adding-a-task)
    - [Retrieving a Task](#retrieving-a-task)
    - [Deleting a Task](#deleting-a-task)
  - [Executors](#executors)
    - [PushNotificationExecutor](#pushnotificationexecutor)
    - [SmsNotificationExecutor](#smsnotificationexecutor)
    - [Creating your own executor classes](#creating-your-own-executor-classes)
  - [Using local examples](#using-local-examples)
  - [Publish the package](#publish-the-package)

---

## Before you begin

Before using the SDK you need to set up your Cloud environment in Google Cloud Console:

1. Optional: Go to https://console.cloud.google.com/cloudtasks and create a queue in GCP. This step is not required since if the default queue used does not exists then we create it for you the first time you add a task with the SDK.
2. The service account used to initialize the `TaskScheduler` must have:
   1. `Cloud Tasks Admin` role (for enqueue task)
   2. `Service Account User` role (used for authentication in the handler endpoint)

## Getting Started

To begin, install the SDK using npm:

`npm install cloud-tasks-scheduler`

or with yarn:

`yarn add cloud-tasks-scheduler`

## Initialization

First, import the necessary modules and initialize the SDK with your configuration:

```js
import { TaskScheduler, PushNotificationExecutor } from 'cloud-tasks-scheduler';

// Initialize the SDK
const scheduler = new TaskScheduler({
  defaultQueue: ‘queue-name’,
  defaultLocation: ‘us-central1’,
  serviceAccount,
  executors: [
    new PushNotificationExecutor({
      firebaseAdmin,
    }),
    // Add other executors as needed
  ],
  webhook: {
    expressInstance: expressApp,
    baseUrl: ‘https://api.my-backend.com’,
    pathname: ‘/push-notification/send’,
  },
});
```

## Configuration

When initializing the TaskScheduler instance, you need to provide the following configuration options:

| Option | Description |
| --- | --- |
| `defaultQueue` | The name of the Cloud Task queue where tasks will be created. |
| `defaultLocation` (optional) | The GCP region of the Cloud Task queue. The default value is `'us-central1'`. |
| `serviceAccount` | The service account JSON for the GCP project where the queue will exist. |
| `executors` | An array of executor instances that will be used to execute tasks. The SDK comes with two built-in executors: **PushNotificationExecutor** and **SmsNotificationExecutor**. |
| `webhook` | The webhook configuration object with the following properties: |
| `webhook.expressInstance` | The instance of the Express.js application that will handle the webhook requests. |
| `webhook.baseUrl` | The base URL for the webhook endpoint. |
| `webhook.pathname` (optional) | The pathname for the webhook endpoint. The default value is `'/cloud-task/webhook'`. |


## Usage

### Adding a Task

To add a task to the scheduler, use the `add` method:

```js
const { id, scheduleTime, payload, metadata } = await scheduler.add({
  name: ‘PushNotification’,
  scheduleTime: Date.now() + 30000, // in 30 seconds
  payload: {
    registrationToken, // the firebase device token to send the push notification
    message: {
      title: ‘test notification’,
      body: ‘this is a test message’,
    },
  },
  metadata: {
    foo: ‘bar’,
  },
});
```

The add method takes an object with the following properties:

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | The name of the task. |
| `scheduleTime` | `number` | The Unix timestamp (in milliseconds) when the task should be executed. |
| `payload` | `object` | The payload object that will be passed to the executor. The payload shape is specific for each executor. |
| `metadata` | `object` (optional) | Additional metadata to attach to the task. |


### Retrieving a Task

To retrieve a task, use the `get` method:

```js
const { id } = await scheduler.get(‘12345’);
```

### Deleting a Task

To delete a task, use the `delete` method:

```js
const wasRemoved = await scheduler.delete(‘12345’);
```

## Executors

The SDK supports various types of executors. In the example above, we use the `PushNotificationExecutor`, which sends push notifications using Firebase. You can also use the `SmsNotificationExecutor` for sending SMS notifications via Twilio.
When initializing the SDK, pass an array of executor instances to the `executors` property in the configuration object. You can also create your own executor classes by extending the TaskExecutorI class.

### PushNotificationExecutor

The PushNotificationExecutor class sends push notifications to a Firebase device token using the firebase-admin library.

```js
import { PushNoticationExecutor } from 'cloud-tasks-scheduler';

new PushNotificationExecutor({
  firebaseAdmin, // Firebase Admin instance initialized with a service account JSON
});
```

### SmsNotificationExecutor

```js
import { SmsNotificationExecutor } from 'cloud-tasks-scheduler';

const client = twilio(accountSid, authToken);

const executor = new SmsNotificationExecutor({
  twilioClient,
});

```

### Creating your own executor classes

You can create your own executor classes by extending the `TaskExecutorI` class and implementing the `execute(payload)` method.

```js
class MyExecutor implements TaskExecutorI {
  constructor(config) {
    this.config = config;
  }

  async execute(payload) {
    // Execute your custom logic here
  }
}

```

## Using local examples

In your terminal run:

`ts-node packages/express-example/example/file-name-example.ts`

You need to have ts-node installed globally to this command to work.

## Publish the package

In your terminal run:

1. `cd packages/tasks-scheduler`
2. `yarn publish`
3. Enter the new version and done.
