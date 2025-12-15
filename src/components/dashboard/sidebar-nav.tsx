'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, PiggyBank, ArrowRightLeft, RefreshCw, Book } from 'lucide-react';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useSidebar } from '../ui/sidebar';
import { useUser, useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { Settings, HelpCircle, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import * as React from 'react';
import { useLanguage } from '@/lib/i18n';
import { transactionInsights } from '@/ai/flows/transaction-insights';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Lightbulb, Loader2 } from 'lucide-react';
import type { Transaction } from '@/types';
import { collection, query, limit } from 'firebase/firestore';
import { usePermissions } from '@/hooks/use-permissions';

// Versículos de Provérbios - NTLH (Nova Tradução na Linguagem de Hoje)
const proverbsNTLH = [
  { text: "Confie no Senhor de todo o coração e não se apoie na sua própria inteligência. Lembre do Senhor em tudo o que fizer, e ele lhe mostrará o caminho certo.", ref: "Provérbios 3:5-6" },
  { text: "O temor do Senhor é o princípio da sabedoria; conhecer o Santo é ter entendimento.", ref: "Provérbios 9:10" },
  { text: "Quem é paciente mostra grande compreensão, mas quem se irrita facilmente mostra pouca inteligência.", ref: "Provérbios 14:29" },
  { text: "A resposta calma acaba com a ira, mas a palavra áspera aumenta a raiva.", ref: "Provérbios 15:1" },
  { text: "É melhor comer pouco com o temor do Senhor do que ter muita riqueza e viver angustiado.", ref: "Provérbios 15:16" },
  { text: "O orgulho vem antes da destruição, e a vaidade, antes da queda.", ref: "Provérbios 16:18" },
  { text: "Melhor é ter bom nome do que grandes riquezas; ser respeitado vale mais do que prata e ouro.", ref: "Provérbios 22:1" },
  { text: "Ensine a criança no caminho em que deve andar, e mesmo quando for idosa não se desviará dele.", ref: "Provérbios 22:6" },
  { text: "Não inveje os maus nem queira viver com eles, pois eles só pensam em violência, e só falam de maldades.", ref: "Provérbios 24:1-2" },
  { text: "Como a cidade que tem os muros derrubados, assim é quem não sabe controlar-se.", ref: "Provérbios 25:28" },
  { text: "Assim como o ferro afia o ferro, uma pessoa afia a outra.", ref: "Provérbios 27:17" },
  { text: "Aquele que confia em si mesmo é tolo, mas quem anda no caminho da sabedoria está seguro.", ref: "Provérbios 28:26" },
  { text: "Quando não há visão, o povo se perde; mas feliz é aquele que obedece à Lei de Deus.", ref: "Provérbios 29:18" },
  { text: "Não me dês nem pobreza nem riqueza; dá-me o alimento que eu preciso.", ref: "Provérbios 30:8" },
  { text: "A mulher de valor quem a pode achar? Ela vale mais do que rubis.", ref: "Provérbios 31:10" },
  { text: "O que procura a justiça e o amor acha a vida, a justiça e a honra.", ref: "Provérbios 21:21" },
  { text: "As riquezas de nada valem no dia da ira de Deus, mas a honestidade livra da morte.", ref: "Provérbios 11:4" },
  { text: "Quem anda com os sábios será sábio, mas quem se ajunta com os tolos acabará mal.", ref: "Provérbios 13:20" },
  { text: "Há mais esperança para o tolo do que para quem se acha esperto.", ref: "Provérbios 26:12" },
  { text: "Não se vanglorie do dia de amanhã, pois você não sabe o que acontecerá.", ref: "Provérbios 27:1" },
  { text: "O rico pensa que é sábio, mas o pobre inteligente logo percebe a realidade.", ref: "Provérbios 28:11" },
  { text: "Quem encobre as suas transgressões nunca prosperará, mas quem as confessa e deixa alcançará misericórdia.", ref: "Provérbios 28:13" },
  { text: "Melhor é ser pobre e viver com honestidade do que ser rico e viver sem honestidade.", ref: "Provérbios 28:6" },
  { text: "A avareza provoca brigas, mas quem confia no Senhor prosperará.", ref: "Provérbios 28:25" },
  { text: "Quem ajuda os pobres empresta ao Senhor, e Deus lhe pagará o bem que fez.", ref: "Provérbios 19:17" },
  { text: "Quem é generoso prosperará; quem dá alívio aos outros receberá alívio.", ref: "Provérbios 11:25" },
  { text: "O plano bem pensado leva ao lucro; mas a pressa leva à pobreza.", ref: "Provérbios 21:5" },
  { text: "Os planos se confirmam com conselhos; portanto, faça a guerra com bons conselheiros.", ref: "Provérbios 20:18" },
  { text: "O filho sábio alegra o pai, mas o filho tolo é a tristeza da mãe.", ref: "Provérbios 10:1" },
  { text: "A língua que traz cura é árvore de vida, mas a língua enganosa quebra o espírito.", ref: "Provérbios 15:4" },
  { text: "O coração alegre serve de bom remédio, mas o espírito abatido faz secar os ossos.", ref: "Provérbios 17:22" }
];

// Proverbs - NIV (New International Version)
const proverbsNIV = [
  { text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", ref: "Proverbs 3:5-6" },
  { text: "The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding.", ref: "Proverbs 9:10" },
  { text: "Whoever is patient has great understanding, but one who is quick-tempered displays folly.", ref: "Proverbs 14:29" },
  { text: "A gentle answer turns away wrath, but a harsh word stirs up anger.", ref: "Proverbs 15:1" },
  { text: "Better a little with the fear of the Lord than great wealth with turmoil.", ref: "Proverbs 15:16" },
  { text: "Pride goes before destruction, a haughty spirit before a fall.", ref: "Proverbs 16:18" },
  { text: "A good name is more desirable than great riches; to be esteemed is better than silver or gold.", ref: "Proverbs 22:1" },
  { text: "Start children off on the way they should go, and even when they are old they will not turn from it.", ref: "Proverbs 22:6" },
  { text: "Do not envy the wicked, do not desire their company; for their hearts plot violence, and their lips talk about making trouble.", ref: "Proverbs 24:1-2" },
  { text: "Like a city whose walls are broken through is a person who lacks self-control.", ref: "Proverbs 25:28" },
  { text: "As iron sharpens iron, so one person sharpens another.", ref: "Proverbs 27:17" },
  { text: "Those who trust in themselves are fools, but those who walk in wisdom are kept safe.", ref: "Proverbs 28:26" },
  { text: "Where there is no revelation, people cast off restraint; but blessed is the one who heeds wisdom's instruction.", ref: "Proverbs 29:18" },
  { text: "Give me neither poverty nor riches, but give me only my daily bread.", ref: "Proverbs 30:8" },
  { text: "A wife of noble character who can find? She is worth far more than rubies.", ref: "Proverbs 31:10" },
  { text: "Whoever pursues righteousness and love finds life, prosperity and honor.", ref: "Proverbs 21:21" },
  { text: "Wealth is worthless in the day of wrath, but righteousness delivers from death.", ref: "Proverbs 11:4" },
  { text: "Walk with the wise and become wise, for a companion of fools suffers harm.", ref: "Proverbs 13:20" },
  { text: "Do you see a person wise in their own eyes? There is more hope for a fool than for them.", ref: "Proverbs 26:12" },
  { text: "Do not boast about tomorrow, for you do not know what a day may bring.", ref: "Proverbs 27:1" },
  { text: "The rich are wise in their own eyes; one who is poor and discerning sees how deluded they are.", ref: "Proverbs 28:11" },
  { text: "Whoever conceals their sins does not prosper, but the one who confesses and renounces them finds mercy.", ref: "Proverbs 28:13" },
  { text: "Better the poor whose walk is blameless than the rich whose ways are perverse.", ref: "Proverbs 28:6" },
  { text: "The greedy stir up conflict, but those who trust in the Lord will prosper.", ref: "Proverbs 28:25" },
  { text: "Whoever is kind to the poor lends to the Lord, and he will reward them for what they have done.", ref: "Proverbs 19:17" },
  { text: "A generous person will prosper; whoever refreshes others will be refreshed.", ref: "Proverbs 11:25" },
  { text: "The plans of the diligent lead to profit as surely as haste leads to poverty.", ref: "Proverbs 21:5" },
  { text: "Plans are established by seeking advice; so if you wage war, obtain guidance.", ref: "Proverbs 20:18" },
  { text: "A wise son brings joy to his father, but a foolish son brings grief to his mother.", ref: "Proverbs 10:1" },
  { text: "The soothing tongue is a tree of life, but a perverse tongue crushes the spirit.", ref: "Proverbs 15:4" },
  { text: "A cheerful heart is good medicine, but a crushed spirit dries up the bones.", ref: "Proverbs 17:22" }
];

export function SidebarNav() {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { user } = useUser();
  const { t, language } = useLanguage();
  const { auth, firestore } = useFirebase();
  const { isMaster } = usePermissions();
  
  // Selecionar provérbios baseados no idioma
  const proverbs = language === 'EN-US' ? proverbsNIV : proverbsNTLH;
  
  // AI Insights state
  const [insights, setInsights] = React.useState('');
  const [isLoadingInsights, setIsLoadingInsights] = React.useState(true);
  const [showFullInsight, setShowFullInsight] = React.useState(false);
  
  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), limit(10));
  }, [firestore, user]);

  const { data: transactions } = useCollection<Transaction>(transactionsQuery);
  
  // Links do menu - Admin só aparece para MASTER
  const links = [
    { href: '/dashboard', label: t('header.dashboard'), icon: LayoutDashboard },
    ...(isMaster ? [{ href: '/admin', label: t('header.admin'), icon: Users }] : []),
  ];
  
  const handleLogout = () => {
    signOut(auth);
  };
  
  const [showBrlEur, setShowBrlEur] = React.useState(false);
  const [showBrlUsd, setShowBrlUsd] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [timezone] = React.useState('America/Sao_Paulo');
  const [rates, setRates] = React.useState({
    BRL_EUR: 0.17,
    BRL_USD: 0.19,
    EUR_BRL: 5.88,
    USD_BRL: 5.26,
  });
  const [currentProverb, setCurrentProverb] = React.useState({ text: '', ref: '' });

  React.useEffect(() => {
    if (!isMobile) return;
    
    const fetchRates = async () => {
      const response = await fetch('/api/exchange-rates');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRates(data.rates);
        }
      }
    };
    fetchRates();
    
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isMobile]);

  React.useEffect(() => {
    if (!isMobile) return;
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isMobile]);

  // Selecionar versículo do dia
  React.useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const index = dayOfYear % proverbs.length;
    setCurrentProverb(proverbs[index]);
  }, [proverbs]);
  
  // Fetch AI Insights
  React.useEffect(() => {
    async function fetchInsights() {
      if (transactions && transactions.length > 0) {
        setIsLoadingInsights(true);
        try {
          const transactionDataString = JSON.stringify(
            transactions.map(t => ({...t, date: new Date(t.date).toISOString()})),
            null, 2
          );
          const result = await transactionInsights({
            transactionData: transactionDataString,
            language: language,
          });
          setInsights(result.insights);
        } catch (error) {
          console.error("Error fetching AI insights:", error);
          setInsights(t('dashboard.aiInsightsError'));
        } finally {
          setIsLoadingInsights(false);
        }
      } else if (transactions && transactions.length === 0) {
        setInsights(t('dashboard.aiInsightsNoData'));
        setIsLoadingInsights(false);
      }
    }

    fetchInsights();
  }, [transactions, language]);

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

  return (
    <>
      <SidebarHeader>
        <div
          className={cn(
            'flex items-center gap-2 transition-all duration-300',
            state === 'collapsed' && 'justify-center'
          )}
        >
          <PiggyBank className="size-7 flex-shrink-0 text-primary" />
          <h1
            className={cn(
              'text-xl font-semibold font-headline transition-opacity duration-200',
              state === 'collapsed' ? 'opacity-0 w-0' : 'opacity-100'
            )}
          >
            {t('sidebar.familyFinances')}
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Mobile Info Section */}
        {isMobile && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>{t('sidebar.information')}</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-3 px-2 py-2">
                  {/* Welcome Message */}
                  <div className="text-sm font-medium">
                    {t('header.welcome')} {user?.displayName?.split(' ').slice(0, 2).map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()).join(' ') || user?.email?.split('@')[0]}
                  </div>
                  
                  {/* Date and Time */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold">{formatDateTime().date}</span>
                    <span className="font-mono">{formatDateTime().time}</span>
                  </div>
                  
                  {/* Exchange Rates */}
                  <div className="space-y-2">
                    {/* EUR/BRL */}
                    <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-md">
                      <div className="flex items-center gap-2">
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
                        <span className="text-xs">
                          {showBrlEur ? `BRL → EUR: ${rates.BRL_EUR.toFixed(4)}` : `EUR → BRL: ${rates.EUR_BRL.toFixed(2)}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowBrlEur(!showBrlEur)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* USD/BRL */}
                    <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-md">
                      <div className="flex items-center gap-2">
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
                        <span className="text-xs">
                          {showBrlUsd ? `BRL → USD: ${rates.BRL_USD.toFixed(4)}` : `USD → BRL: ${rates.USD_BRL.toFixed(2)}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowBrlUsd(!showBrlUsd)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}
        
        {/* Navigation Menu */}
        <SidebarMenu>
          {links.map(link => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={link.label}
                className="justify-start transition-all duration-300 hover:scale-105 hover:translate-x-1 hover:bg-primary/10"
              >
                <Link 
                  href={link.href}
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                >
                  <link.icon className="shrink-0 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <span className="transition-all duration-300">{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          <SidebarSeparator className="my-2" />
          
          {/* System Settings - Only for MASTER */}
          {isMaster && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/system-settings'}
                tooltip="Configurações de Sistema"
                className="justify-start transition-all duration-300 hover:scale-105 hover:translate-x-1 hover:bg-primary/10"
              >
                <Link 
                  href="/system-settings"
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                >
                  <Settings className="shrink-0 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
                  <span className="transition-all duration-300">Configurações de Sistema</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>

        {/* Daily Proverb Card */}
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.dailyProverb')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <Card className="mx-2 my-2 transition-all duration-300 hover:shadow-md hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Book className="size-4 text-primary mt-1 flex-shrink-0 transition-transform duration-300 hover:scale-125" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs italic text-muted-foreground leading-relaxed mb-2">
                      "{currentProverb.text}"
                    </p>
                    <p className="text-xs font-medium text-primary">
                      {currentProverb.ref}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* AI Insights Card */}
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>{t('dashboard.aiInsights')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <Card className="mx-2 my-2 transition-all duration-300 hover:shadow-md hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="size-4 text-primary mt-1 flex-shrink-0 transition-transform duration-300 hover:scale-125 hover:rotate-12" />
                  <div className="flex-1 min-w-0">
                    {isLoadingInsights ? (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {insights}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
