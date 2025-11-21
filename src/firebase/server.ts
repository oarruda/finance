import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Inicializa o Firebase Admin SDK para uso server-side
 * Usado em Server Actions e API Routes
 */
export function initializeFirebaseAdmin() {
  if (!getApps().length) {
    // Para Firebase Admin, precisamos usar as credenciais de serviço
    // Em produção, use as variáveis de ambiente do Firebase App Hosting
    try {
      return initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          // Em produção, adicione as credenciais completas via variáveis de ambiente
          // clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } catch (e) {
      console.warn('Firebase Admin initialization failed:', e);
      throw e;
    }
  }

  return getApp();
}

export function getServerSdks() {
  const app = initializeFirebaseAdmin();
  return {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}
