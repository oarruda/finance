'use client';

import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [firebaseServices, setFirebaseServices] = useState<ReturnType<typeof initializeFirebase> | null>(null);
  const initAttempted = useRef(false);
  
  useEffect(() => {
    // Prevent double initialization
    if (initAttempted.current) {
      return;
    }
    initAttempted.current = true;

    // Only run on client side after mount
    if (typeof window === 'undefined') {
      return;
    }

    try {
      console.log('FirebaseClientProvider: Attempting to initialize Firebase...');
      // Initialize Firebase on the client side, once per component mount.
      const services = initializeFirebase();
      console.log('FirebaseClientProvider: Firebase initialized successfully');
      setFirebaseServices(services);
      setIsInitialized(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Firebase initialization failed');
      console.error('FirebaseClientProvider: Firebase initialization error:', error);
      setError(error);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6 bg-destructive/10 rounded-lg">
          <h2 className="text-xl font-bold text-destructive mb-2">Erro ao Inicializar Firebase</h2>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while Firebase initializes
  if (!isInitialized || !firebaseServices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Inicializando Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}