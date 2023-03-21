import admin from 'firebase-admin';
import serviceAccount from './service-account.json';
import notificationServiceAccount from './service-account.json';

export default admin.initializeApp({
    credential: admin.credential.cert(notificationServiceAccount as admin.ServiceAccount),
});
