
'use client';
import Header from '@/components/dashboard/header';
import Footer from '@/components/dashboard/footer';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { useUserPresence } from '@/hooks/use-user-presence';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();
    const [isMounted, setIsMounted] = React.useState(false);
    
    // Atualizar presença do usuário
    useUserPresence();

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
  );
}
