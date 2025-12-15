'use server';

import { getFirestore, query, where, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/firebase/config';
import { getServerSdks } from '@/firebase/server';
import { getUserSettings } from '@/lib/user-settings';

/**
 * Busca a chave de API da IA em TODOS os usuários MASTER
 * (não apenas no primeiro MASTER encontrado)
 * @returns A chave de API ou null
 */
export async function getMasterAIApiKey(): Promise<string | null> {
  try {
    const { firestore } = getServerSdks();
    
    console.log('🔍 Buscando aiApiKey em todos os usuários MASTER...');
    
    // Buscar todos os documentos na coleção roles_master
    const mastersSnap = await firestore.collection('roles_master').listDocuments();
    
    console.log(`📋 Total de MASTER users encontrados: ${mastersSnap.length}`);
    
    // Iterar por todos os MASTER users até encontrar um com API key configurada
    for (const masterDoc of mastersSnap) {
      const masterId = masterDoc.id;
      console.log(`🔍 Verificando MASTER: ${masterId}`);
      
      const userSettings = await getUserSettings(firestore, masterId);
      
      if (userSettings?.success && userSettings?.data?.aiApiKey) {
        console.log(`✅ aiApiKey encontrada no MASTER: ${masterId}`);
        return userSettings.data.aiApiKey;
      } else {
        console.log(`❌ MASTER ${masterId} não possui aiApiKey configurada`);
      }
    }
    
    console.log('❌ Nenhum MASTER possui aiApiKey configurada');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar aiApiKey dos MASTER users:', error);
    return null;
  }
}

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
