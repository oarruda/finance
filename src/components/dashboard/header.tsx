'use client';

import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import { getExchangeRates } from '@/lib/exchange-rates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '../ui/sidebar';
import { useUser, useFirebase } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import * as React from 'react';
import { useLanguage } from '@/lib/i18n';

export default function Header() {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase();
  const [showBrlEur, setShowBrlEur] = React.useState(false);
  const [showBrlUsd, setShowBrlUsd] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [timezone, setTimezone] = React.useState('America/Sao_Paulo');
  const [rates, setRates] = React.useState({
    BRL_EUR: 0.17,
    BRL_USD: 0.19,
    EUR_BRL: 5.88,
    USD_BRL: 5.26,
  });

  React.useEffect(() => {
    const fetchRates = async () => {
      const data = await getExchangeRates();
      if (data.success) {
        setRates(data.rates);
      }
    };
    fetchRates();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Atualizar relógio a cada segundo
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Buscar timezone do usuário do Firestore
  React.useEffect(() => {
    const loadTimezone = async () => {
      if (user?.uid && firestore) {
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const userRef = doc(firestore, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.timezone) {
              setTimezone(userData.timezone);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar timezone:', error);
        }
      }
    };
    
    loadTimezone();
  }, [user?.uid, firestore]);

  const formatDateTime = () => {
    try {
      const date = new Intl.DateTimeFormat('pt-BR', {
        timeZone: timezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(currentTime);
      
      const time = new Intl.DateTimeFormat('pt-BR', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(currentTime);
      
      return { date, time };
    } catch {
      return { date: '--/--/----', time: '--:--:--' };
    }
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-[#3a3a3a] px-4 backdrop-blur md:px-6">
      <div className="md:hidden">
        <SidebarTrigger className="text-white" />
      </div>
      <div className="hidden md:flex flex-1 items-center gap-6">
        {/* Exchange Rates, Date and Time Group */}
        <div className="flex items-center gap-4">
          {/* BRL > EUR Section */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-md">
            <div className="flex items-center gap-2 text-white">
              {showBrlEur ? (
                <>
                  <img src="https://flagcdn.com/w20/br.png" alt="Brasil" className="w-5 h-4" />
                  <ArrowRightLeft className="size-3" />
                  <img src="https://flagcdn.com/w20/eu.png" alt="União Europeia" className="w-5 h-4" />
                </>
              ) : (
                <>
                  <img src="https://flagcdn.com/w20/eu.png" alt="União Europeia" className="w-5 h-4" />
                  <ArrowRightLeft className="size-3" />
                  <img src="https://flagcdn.com/w20/br.png" alt="Brasil" className="w-5 h-4" />
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-white">
              {showBrlEur ? (
                <span className="text-sm">BRL → EUR: {rates.BRL_EUR.toFixed(4)}</span>
              ) : (
                <span className="text-sm">EUR → BRL: {rates.EUR_BRL.toFixed(2)}</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={() => setShowBrlEur(!showBrlEur)}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>

          {/* BRL > USD Section */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-md">
            <div className="flex items-center gap-2 text-white">
              {showBrlUsd ? (
                <>
                  <img src="https://flagcdn.com/w20/br.png" alt="Brasil" className="w-5 h-4" />
                  <ArrowRightLeft className="size-3" />
                  <img src="https://flagcdn.com/w20/us.png" alt="Estados Unidos" className="w-5 h-4" />
                </>
              ) : (
                <>
                  <img src="https://flagcdn.com/w20/us.png" alt="Estados Unidos" className="w-5 h-4" />
                  <ArrowRightLeft className="size-3" />
                  <img src="https://flagcdn.com/w20/br.png" alt="Brasil" className="w-5 h-4" />
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-white">
              {showBrlUsd ? (
                <span className="text-sm">BRL → USD: {rates.BRL_USD.toFixed(4)}</span>
              ) : (
                <span className="text-sm">USD → BRL: {rates.USD_BRL.toFixed(2)}</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={() => setShowBrlUsd(!showBrlUsd)}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>

          {/* Date */}
          <div className="flex items-center text-white">
            <span className="text-sm font-semibold">{formatDateTime().date}</span>
          </div>
          
          {/* Time */}
          <div className="flex items-center text-white">
            <span className="text-sm font-mono">{formatDateTime().time}</span>
          </div>
        </div>
        
        {/* Welcome Message */}
        <div className="flex items-center text-white text-base font-thin ml-auto">
          {t('header.welcome')} {user?.displayName?.split(' ').slice(0, 2).map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()).join(' ') || user?.email?.split('@')[0]} {t('header.to')} FIN
        </div>
      </div>
      
      {/* Avatar - Visual Identity Only */}
      <div className="flex items-center">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? ''} data-ai-hint="person portrait" />
          <AvatarFallback>
            {user?.displayName?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
