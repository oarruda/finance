
'use client';
import Header from '@/components/dashboard/header';
import Footer from '@/components/dashboard/footer';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useUser, useFirebase } from '@/firebase';
import { redirect } from 'next/navigation';
import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { useUserPresence } from '@/hooks/use-user-presence';
import { ChangePasswordDialog } from '@/components/auth/change-password-dialog';
import { SessionTimeout } from '@/components/SessionTimeout';
import { SupportChat } from '@/components/dashboard/support-chat';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();
    const { firestore, auth } = useFirebase();
    const [isMounted, setIsMounted] = React.useState(false);
    const [showChangePassword, setShowChangePassword] = React.useState(false);
    const [isCheckingPassword, setIsCheckingPassword] = React.useState(true);
    
    // Atualizar presença do usuário
    useUserPresence();

    // Verificar se a senha é temporária
    React.useEffect(() => {
        const checkTemporaryPassword = async () => {
            if (user?.uid && firestore) {
                try {
                    const userRef = doc(firestore, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        if (userData.isTemporaryPassword === true) {
                            setShowChangePassword(true);
                        }
                    }
                } catch (error) {
                    console.error('Erro ao verificar senha temporária:', error);
                } finally {
                    setIsCheckingPassword(false);
                }
            } else if (user && !firestore) {
                setIsCheckingPassword(false);
            }
        };

        if (!isUserLoading && user) {
            checkTemporaryPassword();
        }
    }, [user, firestore, isUserLoading]);

    // Aguardar montagem do cliente para evitar hydration mismatch
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            redirect('/');
        }
    }, [user, isUserLoading]);

    // Durante SSR e primeira renderização, sempre renderizar o layout completo
    if (!isMounted || isUserLoading) {
        return (
            <SidebarProvider>
                <div className="md:flex min-h-screen w-full">
                    <Sidebar>
                        <SidebarNav />
                    </Sidebar>
                    <SidebarInset className="w-full">
                        <div className="flex flex-col min-h-screen">
                            <Header />
                            <main className="flex-1 p-5 sm:p-6 lg:p-8">
                                <div className="flex items-center justify-center min-h-[60vh]">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                </div>
                            </main>
                            <Footer />
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

    if (!user) {
        return null;
    }

  return (
    <>
      <SidebarProvider>
        <div className="md:flex min-h-screen w-full">
          <Sidebar>
            <SidebarNav />
          </Sidebar>
          <SidebarInset className="w-full">
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 p-5 sm:p-6 lg:p-8">{children}</main>
              <Footer />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>

      {/* Dialog de troca de senha obrigatória */}
      {user && !isCheckingPassword && (
        <ChangePasswordDialog 
          open={showChangePassword}
          userId={user.uid}
          onPasswordChanged={() => setShowChangePassword(false)}
        />
      )}

      {/* Controle de timeout de sessão */}
      <SessionTimeout />

      {/* Botão de suporte flutuante */}
      <SupportChat />
    </>
  );
}
