import { doc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

export interface UserSettingsData {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp?: string;
  phone?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cpf?: string;
  timezone: string;
  defaultCurrency?: 'BRL' | 'EUR' | 'USD';
  defaultLanguage?: 'PT-BR' | 'PT-PT' | 'EN-US';
  aiProvider?: string;
  aiApiKey?: string;
  wiseApiKey?: string;
  c6ApiKey?: string;
  exchangeRateProvider?: string;
  exchangeRateApiKey?: string;
  resendApiKey?: string;
  resendFromEmail?: string;
  appUrl?: string;
  avatarId?: string;
}

export async function saveUserSettings(
  firestore: any,
  auth: any,
  userId: string,
  currentUser: any,
  data: UserSettingsData
) {
  try {
    // Atualizar displayName no Firebase Auth
    const displayName = `${data.firstName} ${data.lastName}`.trim();
    if (currentUser) {
      await updateProfile(currentUser, { displayName });
    }

    // Salvar dados no Firestore
    const userRef = doc(firestore, 'users', userId);
    const userData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: displayName,
      email: data.email,
      whatsapp: data.whatsapp || null,
      phone: data.phone || null,
      address: {
        zipCode: data.zipCode || null,
        street: data.street || null,
        number: data.number || null,
        complement: data.complement || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        state: data.state || null,
      },
      cpf: data.cpf || null,
      timezone: data.timezone || 'America/Sao_Paulo',
      defaultCurrency: data.defaultCurrency || 'BRL',
      defaultLanguage: data.defaultLanguage || 'PT-BR',
      aiProvider: data.aiProvider || 'gemini',
      aiApiKey: data.aiApiKey || null,
      wiseApiKey: data.wiseApiKey || null,
      c6ApiKey: data.c6ApiKey || null,
      exchangeRateProvider: data.exchangeRateProvider || 'eodhd',
      exchangeRateApiKey: data.exchangeRateApiKey || null,
      resendApiKey: data.resendApiKey || null,
      resendFromEmail: data.resendFromEmail || null,
      appUrl: data.appUrl || null,
      avatarId: data.avatarId || 'user-1',
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, userData, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error('Error saving user settings:', error);
    return { success: false, error: error?.message || 'Erro ao salvar configurações' };
  }
}

export async function getUserSettings(firestore: any, userId: string) {
  try {
    // Detectar se é Admin SDK ou Client SDK
    const isAdminSDK = typeof firestore.collection === 'function';
    
    let docSnap: any;
    let data: any;
    
    if (isAdminSDK) {
      // Admin SDK (servidor)
      const userRef = firestore.collection('users').doc(userId);
      docSnap = await userRef.get();
      
      if (!docSnap.exists) {
        console.log('User document does not exist in Firestore:', userId);
        return { success: true, data: null };
      }
      
      data = docSnap.data();
    } else {
      // Client SDK (navegador)
      const userRef = doc(firestore, 'users', userId);
      docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        console.log('User document does not exist in Firestore:', userId);
        return { success: true, data: null };
      }

      data = docSnap.data();
    }
    
    console.log('User data from Firestore:', data);
    
    return {
      success: true,
      data: {
        firstName: data?.firstName || '',
        lastName: data?.lastName || '',
        email: data?.email || '',
        whatsapp: data?.whatsapp || '',
        phone: data?.phone || '',
        zipCode: data?.address?.zipCode || '',
        street: data?.address?.street || '',
        number: data?.address?.number || '',
        complement: data?.address?.complement || '',
        neighborhood: data?.address?.neighborhood || '',
        city: data?.address?.city || '',
        state: data?.address?.state || '',
        cpf: data?.cpf || '',
        timezone: data?.timezone || 'America/Sao_Paulo',
        defaultCurrency: data?.defaultCurrency || 'BRL',
        defaultLanguage: data?.defaultLanguage || 'PT-BR',
        aiProvider: data?.aiProvider || 'gemini',
        aiApiKey: data?.aiApiKey || '',
        wiseApiKey: data?.wiseApiKey || '',
        c6ApiKey: data?.c6ApiKey || '',
        exchangeRateProvider: data?.exchangeRateProvider || 'eodhd',
        exchangeRateApiKey: data?.exchangeRateApiKey || '',
        resendApiKey: data?.resendApiKey || '',
        resendFromEmail: data?.resendFromEmail || '',
        appUrl: data?.appUrl || '',
        avatarId: data?.avatarId || 'user-1',
      },
    };
  } catch (error: any) {
    console.error('Error getting user settings:', error);
    return { success: false, error: error?.message || 'Erro ao carregar configurações' };
  }
}
