'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, collection, getDocs, limit, query } from 'firebase/firestore';

export default function QuickSetupPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasMaster, setHasMaster] = useState<boolean | null>(null);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const checkMasterExists = async () => {
    if (!user) return;
    
    setChecking(true);
    try {
      const masterQuery = query(collection(firestore, 'roles_master'), limit(1));
      const snapshot = await getDocs(masterQuery);
      setHasMaster(!snapshot.empty);
    } catch (error: any) {
      console.error('Erro ao verificar MASTER:', error);
      setResult({ success: false, message: 'Erro ao verificar: ' + error.message });
    } finally {
      setChecking(false);
    }
  };

  const setupMaster = async () => {
    if (!user) {
      setResult({ success: false, message: 'Você precisa estar logado!' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Verificar se já existe master
      const masterQuery = query(collection(firestore, 'roles_master'), limit(1));
      const snapshot = await getDocs(masterQuery);
      
      if (!snapshot.empty) {
        setResult({ 
          success: false, 
          message: 'Já existe um usuário MASTER! Use o painel admin para criar novos usuários.' 
        });
        setHasMaster(true);
        setLoading(false);
        return;
      }

      // Adicionar na coleção roles_master
      await setDoc(doc(firestore, 'roles_master', user.uid), {
        email: user.email,
        role: 'master',
        createdAt: new Date().toISOString(),
      });

      // Atualizar perfil do usuário
      await setDoc(doc(firestore, 'users', user.uid), {
        role: 'master',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setResult({ 
        success: true, 
        message: '🎉 Sucesso! Você agora é MASTER! Faça logout e login novamente para aplicar as permissões.' 
      });
      setHasMaster(true);
    } catch (error: any) {
      console.error('Erro ao configurar MASTER:', error);
      setResult({ 
        success: false, 
        message: 'Erro: ' + error.message + '. Tente usar o Firebase Console (veja COMO-SER-MASTER.md)' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl">Setup Rápido - MASTER</CardTitle>
          <CardDescription className="text-base">
            Configure-se como usuário MASTER em um clique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!user ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Você precisa estar logado!</strong>
                <br />
                <a href="/" className="underline">Clique aqui para fazer login</a>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Usuário Atual:</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>UID:</strong> {user.uid}
                </p>
              </div>

              {hasMaster === null && (
                <Button 
                  onClick={checkMasterExists} 
                  variant="outline" 
                  className="w-full"
                  disabled={checking}
                >
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar se já existe MASTER'
                  )}
                </Button>
              )}

              {hasMaster === false && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Nenhum MASTER encontrado!</strong>
                    <br />
                    Você pode configurar-se como MASTER agora.
                  </AlertDescription>
                </Alert>
              )}

              {hasMaster === true && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Já existe um MASTER configurado!</strong>
                    <br />
                    Se é você, faça logout e login novamente, depois acesse <a href="/admin" className="underline">/admin</a>
                  </AlertDescription>
                </Alert>
              )}

              {result && (
                <Alert variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription className="whitespace-pre-wrap">
                    {result.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={setupMaster} 
                className="w-full" 
                size="lg"
                disabled={loading || !user || hasMaster === true}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Tornar-me MASTER
                  </>
                )}
              </Button>

              <div className="space-y-2 text-sm text-muted-foreground border-t pt-4">
                <p className="font-medium">O que acontece ao clicar:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Você recebe role MASTER no Firestore</li>
                  <li>Pode criar, editar e excluir usuários</li>
                  <li>Acesso total ao painel admin</li>
                  <li>Controle completo do sistema</li>
                </ul>
                <p className="text-xs mt-4 text-center">
                  💡 Se tiver problemas, veja o arquivo <code>COMO-SER-MASTER.md</code>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
