import express, { Request, Response } from 'express';

const port = 8080;

const app = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;
