'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Global singleton stored on window object to survive hot reloads
declare global {
  interface Window {
    __FIREBASE_SERVICES__?: {
      firebaseApp: FirebaseApp;
      auth: Auth;
      firestore: Firestore;
      storage: FirebaseStorage;
    };
  }
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('Firebase must be initialized on the client side');
  }

  // Return cached services from window if already initialized
  if (window.__FIREBASE_SERVICES__) {
    console.log('Firebase: Using cached services from window');
    return window.__FIREBASE_SERVICES__;
  }

  // Check if already initialized by Firebase SDK
  const existingApps = getApps();
  if (existingApps.length > 0) {
    console.log('Firebase: Found existing app, reusing it');
    const services = getSdks(existingApps[0]);
    window.__FIREBASE_SERVICES__ = services;
    return services;
  }

  // Initialize Firebase with a specific name to avoid conflicts
  let firebaseApp: FirebaseApp;
  
  console.log('Firebase: Starting fresh initialization...');
  
  try {
    // Validate config before initializing
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
      throw new Error('Firebase config is incomplete. Check firebaseConfig in config.ts');
    }
    
    console.log('Firebase: Initializing with config for project:', firebaseConfig.projectId);
    // Use a specific name for the app to avoid conflicts
    firebaseApp = initializeApp(firebaseConfig, '[DEFAULT]');
    console.log('Firebase: Initialized successfully with name [DEFAULT]');
  } catch (e) {
    console.error('Firebase: Initialization failed:', e);
    // If app already exists with this name, get it
    if ((e as any)?.code === 'app/duplicate-app') {
      console.log('Firebase: App already exists, getting it');
      firebaseApp = getApp('[DEFAULT]');
    } else {
      throw new Error(`Failed to initialize Firebase: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Cache services globally and return
  const services = getSdks(firebaseApp);
  window.__FIREBASE_SERVICES__ = services;
  return services;
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
