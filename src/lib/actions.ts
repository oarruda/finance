
'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const addTransactionSchema = z.object({
    description: z.string().min(3),
    amount: z.coerce.number(),
    date: z.date(),
    category: z.string().optional(),
});

// Inicializar Firebase Admin SDK
if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      console.warn('Firebase Admin SDK não inicializado: FIREBASE_SERVICE_ACCOUNT_KEY não encontrada');
    }
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin SDK:', error);
  }
}

// Placeholder for adding a transaction
export async function addTransactionAction(values: unknown) {
    // Implementar com Firebase Admin SDK
    return { success: false, message: "Funcionalidade não implementada ainda." };
}

// Atualizar função de um usuário
export async function updateUserRoleAction(userId: string, role: 'master' | 'admin' | 'viewer') {
  try {
    const db = getFirestore();
    
    // Atualizar o campo role no documento do usuário
    await db.collection('users').doc(userId).update({
      role: role,
      updatedAt: new Date().toISOString(),
    });
    
    // Remover de collections antigas de roles
    const masterRef = db.collection('roles_master').doc(userId);
    const adminRef = db.collection('roles_admin').doc(userId);
    
    await Promise.all([
      masterRef.delete().catch(() => {}), // Ignora erro se não existir
      adminRef.delete().catch(() => {}),  // Ignora erro se não existir
    ]);
    
    // Adicionar na collection correspondente ao novo role
    if (role === 'master') {
      await masterRef.set({
        userId: userId,
        createdAt: new Date().toISOString(),
      });
    } else if (role === 'admin') {
      await adminRef.set({
        userId: userId,
        createdAt: new Date().toISOString(),
      });
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar função do usuário:', error);
    return { 
      success: false, 
      message: error?.message || 'Erro ao atualizar função do usuário.' 
    };
  }
}

