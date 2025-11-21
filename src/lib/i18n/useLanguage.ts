'use client';

import { useFirebase, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import * as React from 'react';
import { translations, type TranslationKey, type Language } from './translations';

export function useLanguage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [language, setLanguage] = React.useState<Language>('PT-BR');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadLanguage = async () => {
      if (user?.uid && firestore) {
        try {
          const userRef = doc(firestore, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().defaultLanguage) {
            setLanguage(userSnap.data().defaultLanguage as Language);
          }
        } catch (error) {
          console.error('Error loading user language:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, [user?.uid, firestore]);

  const t = React.useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || key;
    },
    [language]
  );

  return { language, t, isLoading };
}
