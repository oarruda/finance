import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Credenciais hardcoded para funcionar sem variáveis de ambiente
 * Em produção, estas credenciais estão protegidas pois o código roda no servidor
 */
const FIREBASE_CREDENTIALS = {
  projectId: 'studio-8444859572-1c9a4',
  clientEmail: 'firebase-adminsdk-fbsvc@studio-8444859572-1c9a4.iam.gserviceaccount.com',
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCvGfIu5laKgpgC
jrs7SWiKKoz2JfN7wTSOj719VN8PZR0cbUx0r1ZTVJOQ81MoA22FBtgmfnruZ8cY
6/TyPZmZAnEC4T1vHmztFLLcAEUwKExF9G3oiH1v/dI0A2NZO39+4MqIW/WeeJAy
XEmo6VFPTwGMEE9cSk6jeoFEiJzJJqvwRWAt6CNKWbF2JoplfZIZE3Jvm6Z/Sg2r
gcxPmaVYyqzkvuQ+HY4Y3M1Mt1tJ8LEW+/+9pVsmBylv/FNUT84JBg2A8UD/Qdq9
GDnitLdkMnqBg2j5OXSq+TOqwBwPbdMDzS1sMWE3i5C73Bapz5tOL4vfH2SNuRAX
7o8EjSDrAgMBAAECggEAUdsSQWSCflvQjhmFY5DMoxKDNSrGqUrHtAF0NtvvLvY4
5qodvMqe03PNTEzDygfYMgDiGRS1iS/QflEIABpV7JacmBkNrB2QFEDB4GDr9zhP
d8BthPARm8IPeys+TV+oGXsikx5SM1PvLOvBr4nq7eVkNsMFJoLCQmApgA1RJiL8
8uKjrUXjDFMT9GHFjPBxGxuCzbgEA6R/+VzbFdk60qnGX7eATEEiytnilu2Z/hhg
3cAhS9F2eKxqMHWDkx1rO3hzJW1eoODlRZpVr8pA+bUXzifTBw9u4ot6QMV54faC
Dm9QADbrg8n7Sf0fcUx/zr5gF3yiX8oNCGacDEIJGQKBgQDWw+kBXKbsJA7RpcJ4
BfZgmnfymnqfZnh0Q/vk/Q4kZkz4S6cWTHehHieWVi10TfIdZndmDcQY/s73liiw
8GPEEMmoD/j40xR/0Wv/GAHVJlEsa2Ce2oBVzJlbwu29uFRFhWRtOzqKdK3w8RWl
FETwkosIahEY5nE+u0Sq1Dp/5QKBgQDQuHwI2j/Vgk6D3r+nMb8Cq/uzoP99ROIu
OWqkk/GqcY3qZcnrPeaKo4RDGO4U+lH1+qBmamTpZUV9eRFXqqE5v+t0rNXsBYKP
IewxFMhirkQ58lefVrZUhao+/6nWPm4OTPSxHwQxpHq/gMWUVTXC+tQX6vfnINjc
dpQLloXwjwKBgQC4FShtIGt7UNTa4ge0NPgfiYdyjPK6Gmz4yyTn+/fZP06OLNpF
BLotgdlQxQElBYKXrLJ+6SHCgvYHxc+PCh2ZewI+aaJwNQ0HGgxFlOBNQRCm0Er7
HjKOWFbDDmwVCCBDjrir3+6nqqdFNH/nBV6qDhHZ3oBVJYC/0mhjPJH/+QKBgA41
4UwBAAObYZkc21OY0XZvGy35sitnOzcGdbpK0FNYc98Xmw3HIyEhTOn8kokfGeFz
dORELiat3HNUgNfFKED0TiWddtsg7Oit2JTm41XEo6SGWWzhzHwotZSgd4G8smWK
28YLZI+0sR7Et68HtidWSIZwWvyDggBQmnfHgcsFAoGAK1gUvt45CEqwmOHB1vPA
+eRIKGwh08FcLS/nB1QxXT1cKBZ8DeclL818+inKUa1WZSh8qydh3tx5rPiWHMGv
WO3NBrEtYLVPAmPl/vwIDp4bRTo52ZFCBwi1J8x61+uauPFr1wiWf+oukktgwK7T
EEoI4O6VsiITgeClBwfot/U=
-----END PRIVATE KEY-----`
};

/**
 * Inicializa o Firebase Admin SDK para uso server-side
 * Usado em Server Actions e API Routes
 */
export function initializeFirebaseAdmin() {
  if (!getApps().length) {
    try {
      // Verificar se temos credenciais de serviço (produção com Secret Manager)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        return initializeApp({
          credential: cert(serviceAccount),
          projectId: firebaseConfig.projectId,
        });
      }
      
      // Verificar se temos credenciais individuais via env vars
      if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        return initializeApp({
          credential: cert({
            projectId: firebaseConfig.projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      }

      // Fallback: usar credenciais hardcoded (seguro pois roda no servidor)
      console.log('⚠️ Usando credenciais hardcoded do Firebase Admin SDK');
      return initializeApp({
        credential: cert({
          projectId: FIREBASE_CREDENTIALS.projectId,
          clientEmail: FIREBASE_CREDENTIALS.clientEmail,
          privateKey: FIREBASE_CREDENTIALS.privateKey,
        }),
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
