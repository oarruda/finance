'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos
const WARNING_TIMEOUT = 30 * 1000; // 30 segundos para responder

export function SessionTimeout() {
  const [showWarning, setShowWarning] = React.useState(false);
  const [countdown, setCountdown] = React.useState(30);
  const { user } = useUser();
  const { auth } = useFirebase();
  const router = useRouter();
  
  const inactivityTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await auth.signOut();
        router.push('/');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    }
  };

  const startWarning = () => {
    setShowWarning(true);
    setCountdown(30);

    // Iniciar contagem regressiva
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Timer para logout automático após 30 segundos
    warningTimerRef.current = setTimeout(() => {
      handleLogout();
    }, WARNING_TIMEOUT);
  };

  const resetInactivityTimer = () => {
    clearAllTimers();
    setShowWarning(false);

    // Só inicia o timer se o usuário estiver logado
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        startWarning();
      }, INACTIVITY_TIMEOUT);
    }
  };

  const handleStillHere = () => {
    resetInactivityTimer();
  };

  React.useEffect(() => {
    if (!user) {
      clearAllTimers();
      return;
    }

    // Eventos que indicam atividade do usuário
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Iniciar timer ao montar
    resetInactivityTimer();

    // Adicionar listeners para todos os eventos
    events.forEach((event) => {
      document.addEventListener(event, resetInactivityTimer);
    });

    // Cleanup
    return () => {
      clearAllTimers();
      events.forEach((event) => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [user]);

  if (!user) return null;

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sessão Inativa</AlertDialogTitle>
          <AlertDialogDescription>
            Você ainda está aí? Sua sessão está inativa há 5 minutos.
            <br />
            <br />
            <span className="text-lg font-semibold text-foreground">
              Você será desconectado em {countdown} segundo{countdown !== 1 ? 's' : ''}.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout}>
            Desconectar
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleStillHere}>
            Sim, estou aqui
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
