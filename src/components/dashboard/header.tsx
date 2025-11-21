'use client';

import { currencyRates } from '@/lib/data';
import { ArrowRightLeft } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SidebarTrigger } from '../ui/sidebar';
import { useUser, useFirebase } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { signOut } from 'firebase/auth';

export default function Header() {
  const { user, isUserLoading } = useUser();
  const { auth } = useFirebase();

  const handleLogout = () => {
    signOut(auth);
  };
  
  if (isUserLoading) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/60 md:px-6">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div className="flex-1" />
            <Skeleton className="h-9 w-9 rounded-full" />
        </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/60 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex-1">
        <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <div className="flex items-center gap-2">
            <span>BRL/EUR: {currencyRates.BRL_EUR.toFixed(4)}</span>
            <ArrowRightLeft className="size-3" />
            <span>EUR/BRL: {currencyRates.EUR_BRL.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>BRL/USD: {currencyRates.BRL_USD.toFixed(4)}</span>
            <ArrowRightLeft className="size-3" />
            <span>USD/BRL: {currencyRates.USD_BRL.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="overflow-hidden rounded-full h-9 w-9"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? ''} data-ai-hint="person portrait" />
                <AvatarFallback>
                  {user?.displayName?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.displayName ?? user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
