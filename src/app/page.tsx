import { LoginForm } from '@/components/auth/login-form';
import { PiggyBank } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
            <div className="flex justify-center">
                <PiggyBank className="size-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-headline">Family Finance Tracker</h1>
            <p className="text-muted-foreground">
                Sign in to access your financial dashboard.
            </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}