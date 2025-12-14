'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Shield, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';

export default function SetupMasterPage() {
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasMaster, setHasMaster] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // Verificar se já existe MASTER
  useEffect(() => {
    checkMaster();
  }, []);

  // Preencher email do usuário logado
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const checkMaster = async () => {
    try {
      const { getFirestore, collection, query, where, getDocs, limit } = await import('firebase/firestore');
      const { firebaseApp } = await import('@/firebase/config');
      
      const db = getFirestore(firebaseApp);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'master'), limit(1));
      const snapshot = await getDocs(q);
      
      setHasMaster(!snapshot.empty);
    } catch (error) {
      console.error('Erro ao verificar MASTER:', error);
      setHasMaster(false);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setResult({ 
        success: false, 
        error: 'Você precisa estar logado para configurar o MASTER' 
      });
      return;
    }

    if (user.email !== email.toLowerCase()) {
      setResult({ 
        success: false, 
        error: 'O email informado deve ser o mesmo da conta logada' 
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Importar dinamicamente as funções do Firebase
      const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { firebaseApp } = await import('@/firebase/config');
      
      const db = getFirestore(firebaseApp);
      const userDocRef = doc(db, 'users', user.uid);

      // Atualizar o documento do usuário com role master
      await setDoc(userDocRef, {
        role: 'master',
        email: email.toLowerCase(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setResult({ 
        success: true, 
        message: '✅ Usuário configurado como MASTER com sucesso! Recarregue a página para aplicar as permissões.' 
      });
      setHasMaster(true);
      
      // Recarregar após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao configurar MASTER:', error);
      setResult({ 
        success: false, 
        error: 'Erro ao configurar: ' + (error.message || 'Erro desconhecido') 
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Configurar Usuário MASTER</CardTitle>
          <CardDescription>
            Configure o primeiro usuário com permissões totais no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasMaster ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Já existe um usuário MASTER configurado!</strong>
                <br />
                Se você é o MASTER, faça login e acesse o painel admin em /admin
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> Este endpoint só funciona quando não existe nenhum MASTER.
                  Após criar o primeiro MASTER, use o painel admin para criar novos usuários.
                </AlertDescription>
              </Alert>

              {!user ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Você precisa estar logado!</strong>
                    <br />
                    Faça login primeiro e depois volte a esta página.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email do Usuário MASTER</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use o email da conta que está logada no momento
                    </p>
                  </div>

                  {result && (
                    <Alert variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {result.success ? result.message : result.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || !user}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Configurando...
                      </>
                    ) : (
                      'Configurar como MASTER'
                    )}
                  </Button>
                </form>
              )}

              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>O que acontece ao configurar MASTER:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Usuário recebe permissões totais</li>
                  <li>Pode criar, editar e excluir usuários</li>
                  <li>Pode alterar roles de outros usuários</li>
                  <li>Acesso completo ao sistema</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
