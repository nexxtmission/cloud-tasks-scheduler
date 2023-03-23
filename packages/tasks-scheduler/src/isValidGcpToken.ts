import { Request, Response, NextFunction } from 'express';
import { JWT } from 'google-auth-library';
import { ServiceAccount } from './types';

const extractTokenFromReq = (req: Request) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    return undefined;
};

const verifyIdToken = async (serviceAccount: ServiceAccount, idToken: string) => {
    const authClient = new JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
    });
    try {
        const ticket = await authClient.verifyIdToken({
            idToken
        });
        if (ticket) {
            return ticket.getPayload();
        }
    } catch {
        //
    }
    return undefined;
};

const isValidGcpToken = async (req: Request, res: Response, next: NextFunction) => {
    const token = extractTokenFromReq(req);
    if (token) {
        const idTokenAuthInfo = await verifyIdToken(res.locals.serviceAccount, token);
        if (idTokenAuthInfo) {
            return next();
        }
    }
    return res.status(401).json({
        code: 'UNAUTHORIZED',
    });
}

export default isValidGcpToken;
