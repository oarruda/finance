import { doc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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
  exchangeRateApiKey?: string;
}

export async function uploadProfilePhoto(
  storage: any,
  userId: string,
  file: File
): Promise<{ success: boolean; photoURL?: string; error?: string }> {
  try {
    // Validar tamanho do arquivo (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: 'O arquivo deve ter no máximo 2MB' };
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'O arquivo deve ser uma imagem' };
    }

    // Criar referência no Storage
    const storageRef = ref(storage, `users/${userId}/profile.jpg`);

    // Fazer upload do arquivo
    await uploadBytes(storageRef, file);

    // Obter URL de download
    const photoURL = await getDownloadURL(storageRef);

    return { success: true, photoURL };
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    return { success: false, error: error?.message || 'Erro ao fazer upload da foto' };
  }
}

export async function saveUserSettings(
  firestore: any,
  auth: any,
  userId: string,
  currentUser: any,
  data: UserSettingsData,
  photoURL?: string
) {
  try {
    // Atualizar displayName e photoURL no Firebase Auth
    const displayName = `${data.firstName} ${data.lastName}`.trim();
    if (currentUser) {
      const profileUpdate: any = { displayName };
      if (photoURL) {
        profileUpdate.photoURL = photoURL;
      }
      await updateProfile(currentUser, profileUpdate);
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
      exchangeRateApiKey: data.exchangeRateApiKey || null,
      updatedAt: new Date().toISOString(),
    };

    if (photoURL) {
      userData.photoURL = photoURL;
    }

    await setDoc(userRef, userData, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error('Error saving user settings:', error);
    return { success: false, error: error?.message || 'Erro ao salvar configurações' };
  }
}

export async function getUserSettings(firestore: any, userId: string) {
  try {
    const userRef = doc(firestore, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      return { success: true, data: null };
    }

    const data = docSnap.data();
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
        exchangeRateApiKey: data?.exchangeRateApiKey || '',
      },
    };
  } catch (error: any) {
    console.error('Error getting user settings:', error);
    return { success: false, error: error?.message || 'Erro ao carregar configurações' };
  }
}
