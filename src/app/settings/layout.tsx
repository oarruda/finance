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

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            redirect('/');
        }
    }, [user, isUserLoading]);

    if (isUserLoading || !user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
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
