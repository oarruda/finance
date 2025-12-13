'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { loginWithEmailPassword } from '@/lib/auth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function LoginForm() {
  const { user, isUserLoading } = useUser();
  const { auth } = useFirebase();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState<string | undefined>();
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setIsLoading(true);

    const result = await loginWithEmailPassword(email, password);
    
    if (!result.success) {
      setError(result.message);
      setIsLoading(false);
    }
    // Se sucesso, o useEffect acima vai redirecionar
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(undefined);
    setResetSuccess(false);
    setIsResetting(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess(true);
      setResetEmail('');
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess(false);
      }, 3000);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setResetError('Email não encontrado.');
      } else if (error.code === 'auth/invalid-email') {
        setResetError('Email inválido.');
      } else {
        setResetError('Erro ao enviar email de recuperação. Tente novamente.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="rafael@rafaelarruda.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
          <Button
            type="button"
            variant="link"
            className="text-sm text-muted-foreground"
            onClick={() => setShowResetModal(true)}
          >
            Esqueci minha senha
          </Button>
        </CardFooter>
      </Card>

      {/* Modal de recuperação de senha */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>
              Digite seu email cadastrado para receber o link de recuperação de senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword}>
            <div className="space-y-4 py-4">
              {resetError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{resetError}</AlertDescription>
                </Alert>
              )}
              {resetSuccess && (
                <Alert>
                  <AlertDescription>
                    Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isResetting || resetSuccess}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResetModal(false);
                  setResetError(undefined);
                  setResetSuccess(false);
                  setResetEmail('');
                }}
                disabled={isResetting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isResetting || resetSuccess}>
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar link'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  );
}
