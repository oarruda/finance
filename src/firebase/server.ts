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
    try {
      // Verificar se temos credenciais de serviço (produção)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        return initializeApp({
          credential: cert(serviceAccount),
          projectId: firebaseConfig.projectId,
        });
      }
      
      // Verificar se temos credenciais individuais
      if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        return initializeApp({
          credential: cert({
            projectId: firebaseConfig.projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      }

      // Desenvolvimento: usar Application Default Credentials
      // Isso funciona se você estiver autenticado via `gcloud auth application-default login`
      // ou se estiver rodando no Firebase/Google Cloud
      console.log('Inicializando Firebase Admin com Application Default Credentials');
      return initializeApp({
        projectId: firebaseConfig.projectId,
      });
    } catch (e) {
      console.error('Firebase Admin initialization failed:', e);
      throw new Error('Falha ao inicializar Firebase Admin SDK. Verifique as credenciais.');
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
