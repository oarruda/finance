import { initializeFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export interface LoginResult {
  success: boolean;
  message?: string;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<LoginResult> {
  try {
    const { auth, firestore } = initializeFirebase();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Verificar se o usuário está desativado no Firestore
    const { doc, getDoc } = await import('firebase/firestore');
    const userRef = doc(firestore, 'users', userCredential.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists() && userSnap.data()?.disabled === true) {
      // Fazer logout se o usuário estiver desativado
      await auth.signOut();
      return { 
        success: false, 
        message: 'Sua conta foi desativada. Entre em contato com o administrador do sistema.' 
      };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Mapear erros comuns do Firebase para mensagens amigáveis
    let message = 'Erro ao fazer login. Tente novamente.';
    
    if (error.code === 'auth/invalid-email') {
      message = 'Email inválido.';
    } else if (error.code === 'auth/user-disabled') {
      message = 'Usuário desabilitado.';
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      message = 'Email ou senha incorretos.';
    } else if (error.code === 'auth/invalid-credential') {
      message = 'Credenciais inválidas.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Muitas tentativas. Tente novamente mais tarde.';
    }
    
    return { success: false, message };
  }
}
