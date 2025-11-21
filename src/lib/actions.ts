
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

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

  // Hardcoded credentials as per the user request
  if (email === 'rafael@rafaelarruda.com' && password === 'admin123') {
    redirect('/dashboard');
  } else {
    return {
      message: 'Invalid email or password.',
    };
  }
}

// Placeholder for adding a transaction
export async function addTransactionAction(data: any) {
  console.log('Adding transaction:', data);
  // In a real app, you would interact with Firestore here
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: 'Transaction added successfully.' };
}

// Placeholder for updating a user role
export async function updateUserRoleAction(userId: string, role: string) {
  console.log(`Updating user ${userId} to role ${role}`);
  // In a real app, you would interact with Firestore here
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message: 'User role updated.' };
}
