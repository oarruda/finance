
'use client';
import Header from '@/components/dashboard/header';
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

export default function DashboardLayout({
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
      <div className="md:flex">
        <Sidebar>
          <SidebarNav />
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col">
            <Header />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
