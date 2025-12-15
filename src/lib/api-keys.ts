'use server';

import { getServerSdks } from '@/firebase/server';
import { getUserSettings } from '@/lib/user-settings';

/**
 * Busca a chave de API do Resend em TODOS os usuários MASTER
 * (não apenas no primeiro MASTER encontrado)
 * @returns A chave de API ou null
 */
export async function getMasterResendApiKey(): Promise<string | null> {
  try {
    const { firestore } = getServerSdks();
    
    console.log('🔍 Buscando resendApiKey em todos os usuários MASTER...');
    
    // Buscar todos os documentos na coleção roles_master
    const mastersSnap = await firestore.collection('roles_master').listDocuments();
    
    console.log(`📋 Total de MASTER users encontrados: ${mastersSnap.length}`);
    
    // Iterar por todos os MASTER users até encontrar um com API key configurada
    for (const masterDoc of mastersSnap) {
      const masterId = masterDoc.id;
      console.log(`🔍 Verificando MASTER: ${masterId}`);
      
      const userSettings = await getUserSettings(firestore, masterId);
      
      if (userSettings?.success && userSettings?.data?.resendApiKey) {
        console.log(`✅ resendApiKey encontrada no MASTER: ${masterId}`);
        return userSettings.data.resendApiKey;
      } else {
        console.log(`❌ MASTER ${masterId} não possui resendApiKey configurada`);
      }
    }
    
    console.log('❌ Nenhum MASTER possui resendApiKey configurada');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar resendApiKey dos MASTER users:', error);
    return null;
  }
}

/**
 * Busca a chave de API do Wise Bank em TODOS os usuários MASTER
 * (não apenas no primeiro MASTER encontrado)
 * @returns A chave de API ou null
 */
export async function getMasterWiseApiKey(): Promise<string | null> {
  try {
    const { firestore } = getServerSdks();
    
    console.log('🔍 Buscando wiseApiKey em todos os usuários MASTER...');
    
    // Buscar todos os documentos na coleção roles_master
    const mastersSnap = await firestore.collection('roles_master').listDocuments();
    
    console.log(`📋 Total de MASTER users encontrados: ${mastersSnap.length}`);
    
    // Iterar por todos os MASTER users até encontrar um com API key configurada
    for (const masterDoc of mastersSnap) {
      const masterId = masterDoc.id;
      console.log(`🔍 Verificando MASTER: ${masterId}`);
      
      const userSettings = await getUserSettings(firestore, masterId);
      
      if (userSettings?.success && userSettings?.data?.wiseApiKey) {
        console.log(`✅ wiseApiKey encontrada no MASTER: ${masterId}`);
        return userSettings.data.wiseApiKey;
      } else {
        console.log(`❌ MASTER ${masterId} não possui wiseApiKey configurada`);
      }
    }
    
    console.log('❌ Nenhum MASTER possui wiseApiKey configurada');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar wiseApiKey dos MASTER users:', error);
    return null;
  }
}

/**
 * Busca a chave de API do C6 Bank em TODOS os usuários MASTER
 * (não apenas no primeiro MASTER encontrado)
 * @returns A chave de API ou null
 */
export async function getMasterC6ApiKey(): Promise<string | null> {
  try {
    const { firestore } = getServerSdks();
    
    console.log('🔍 Buscando c6ApiKey em todos os usuários MASTER...');
    
    // Buscar todos os documentos na coleção roles_master
    const mastersSnap = await firestore.collection('roles_master').listDocuments();
    
    console.log(`📋 Total de MASTER users encontrados: ${mastersSnap.length}`);
    
    // Iterar por todos os MASTER users até encontrar um com API key configurada
    for (const masterDoc of mastersSnap) {
      const masterId = masterDoc.id;
      console.log(`🔍 Verificando MASTER: ${masterId}`);
      
      const userSettings = await getUserSettings(firestore, masterId);
      
      if (userSettings?.success && userSettings?.data?.c6ApiKey) {
        console.log(`✅ c6ApiKey encontrada no MASTER: ${masterId}`);
        return userSettings.data.c6ApiKey;
      } else {
        console.log(`❌ MASTER ${masterId} não possui c6ApiKey configurada`);
      }
    }
    
    console.log('❌ Nenhum MASTER possui c6ApiKey configurada');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar c6ApiKey dos MASTER users:', error);
    return null;
  }
}

/**
 * Busca os emails configurados para o Resend em TODOS os usuários MASTER
 * @returns Objeto com resendFromEmail, resendFromName e appUrl, ou null
 */
export async function getMasterResendConfig(): Promise<{ resendFromEmail: string; resendFromName?: string; appUrl: string } | null> {
  try {
    const { firestore } = getServerSdks();
    
    console.log('🔍 Buscando configurações do Resend em todos os usuários MASTER...');
    
    // Buscar todos os documentos na coleção roles_master
    const mastersSnap = await firestore.collection('roles_master').listDocuments();
    
    console.log(`📋 Total de MASTER users encontrados: ${mastersSnap.length}`);
    
    // Iterar por todos os MASTER users até encontrar um com configuração completa
    for (const masterDoc of mastersSnap) {
      const masterId = masterDoc.id;
      console.log(`🔍 Verificando MASTER: ${masterId}`);
      
      const userSettings = await getUserSettings(firestore, masterId);
      
      if (userSettings?.success && userSettings?.data?.resendFromEmail && userSettings?.data?.appUrl) {
        console.log(`✅ Configurações do Resend encontradas no MASTER: ${masterId}`);
        return {
          resendFromEmail: userSettings.data.resendFromEmail,
          resendFromName: userSettings.data.resendFromName || undefined,
          appUrl: userSettings.data.appUrl
        };
      } else {
        console.log(`❌ MASTER ${masterId} não possui configurações completas do Resend`);
      }
    }
    
    console.log('❌ Nenhum MASTER possui configurações completas do Resend');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar configurações do Resend dos MASTER users:', error);
    return null;
  }
}
