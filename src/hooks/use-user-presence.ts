'use client';

import { useEffect } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Hook para atualizar a presença online do usuário
 * Atualiza o campo lastActive a cada 2 minutos enquanto o usuário estiver ativo
 */
export function useUserPresence() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  useEffect(() => {
    if (!user?.uid || !firestore) return;

    const updatePresence = async () => {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          lastActive: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error updating user presence:', error);
      }
    };

    // Atualizar imediatamente
    updatePresence();

    // Atualizar a cada 2 minutos
    const interval = setInterval(updatePresence, 2 * 60 * 1000);

    // Atualizar quando a janela ganhar foco
    const handleFocus = () => updatePresence();
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.uid, firestore]);
}
