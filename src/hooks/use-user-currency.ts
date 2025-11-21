'use client';

import { useFirebase, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import * as React from 'react';

export function useUserCurrency() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [currency, setCurrency] = React.useState<'BRL' | 'EUR' | 'USD'>('BRL');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadCurrency = async () => {
      if (user?.uid && firestore) {
        try {
          const userRef = doc(firestore, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().defaultCurrency) {
            setCurrency(userSnap.data().defaultCurrency);
          }
        } catch (error) {
          console.error('Error loading user currency:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadCurrency();
  }, [user?.uid, firestore]);

  return { currency, isLoading };
}
