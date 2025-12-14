'use server';

import { getFirestore, query, where, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/firebase/config';

/**
 * Busca a chave de API da IA do Firestore
 * @param userId ID do usuário
 * @returns A chave de API ou null
 */
export async function getAIApiKeyFromDatabase(userId: string): Promise<string | null> {
  try {
    const db = getFirestore(firebaseApp);
    const usersRef = collection(db, 'users');
    
    const q = query(usersRef, where('uid', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userData = querySnapshot.docs[0].data();
    return userData.aiApiKey || null;
  } catch (error) {
    console.error('Erro ao buscar chave de API:', error);
    return null;
  }
}
