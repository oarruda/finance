import { currencyRates, users } from '@/lib/data';
import { ArrowRightLeft, PanelLeft } from 'lucide-react';
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

export default function Header() {
  const currentUser = users[0];

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
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="person portrait" />
                <AvatarFallback>
                  {currentUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href="/" passHref>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
