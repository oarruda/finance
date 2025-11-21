
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import {addDoc, collection, doc, updateDoc} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getAuth } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(
  prevState: { message: string } | undefined,
  formData: FormData
) {
  const validatedFields = loginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Invalid fields!',
    };
  }

  const { email, password } = validatedFields.data;
  const { auth } = initializeFirebase();

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    return {
      message: 'Invalid email or password.',
    };
  }
  redirect('/dashboard');
}

const addTransactionSchema = z.object({
    description: z.string().min(3),
    amount: z.coerce.number(),
    date: z.date(),
    category: z.string().optional(),
});


// Placeholder for adding a transaction
export async function addTransactionAction(values: unknown) {
    const { auth, firestore } = initializeFirebase();
    const user = auth.currentUser;

    if (!user) {
        return { success: false, message: "You must be logged in to add a transaction." };
    }

    const validatedFields = addTransactionSchema.safeParse(values);

    if (!validatedFields.success) {
        return { success: false, message: "Invalid transaction data." };
    }
    
    const { description, amount, date, category } = validatedFields.data;

  try {
    await addDoc(collection(firestore, 'users', user.uid, 'transactions'), {
      description,
      amount,
      date,
      category: category || 'Other',
      type: amount >= 0 ? 'income' : 'expense',
      currency: 'BRL',
      userId: user.uid,
    });
    return { success: true, message: 'Transaction added successfully.' };
  } catch (error) {
    console.error("Error adding transaction: ", error);
    return { success: false, message: 'Failed to add transaction.' };
  }
}

// Placeholder for updating a user role
export async function updateUserRoleAction(userId: string, role: string) {
    const { firestore } = initializeFirebase();
    try {
        const userDocRef = doc(firestore, 'users', userId);
        await updateDoc(userDocRef, { role });
        return { success: true, message: 'User role updated.' };
    } catch (error) {
        console.error(`Error updating user ${userId} to role ${role}`, error);
        return { success: false, message: 'Failed to update user role.' };
    }
}

