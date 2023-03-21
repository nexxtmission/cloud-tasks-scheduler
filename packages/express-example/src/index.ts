import express, { Request, Response, } from 'express';
import scheduler, { router as schedulerRouter } from './services/task-scheduler';

const port = 8080;

const app = express();

app.use(express.json());
app.use(schedulerRouter);

app.post('/reminders', async (req: Request, res: Response) => {
    const { id } = await scheduler.add({
        name: 'PushNotification',
        scheduleTime: Date.now() + req.body.delay,
        payload: {
            registrationToken: 'x',
            message: {
                title: req.body.title,
                body: req.body.body,
            },
        },
        metadata: {
            foo: 'bar',
        },
    });
    console.log('Success!!!');
    return res.send(id);
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;
