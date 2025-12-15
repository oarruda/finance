'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirebase } from '@/firebase';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Loader2, User, Users, CheckCircle, Bell, BellOff, Trash2, XCircle, Clock, Archive } from 'lucide-react';
import { collection, query, orderBy, addDoc, onSnapshot, where, Timestamp, getDocs, doc, updateDoc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  text: string;
  timestamp: any;
  read: boolean;
}

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
  status: 'open' | 'closed';
  ticketNumber?: string;
}

interface UserListItem {
  uid: string;
  displayName: string;
  email: string;
  avatarId?: string;
  lastMessageTime?: any;
  hasUnreadMessages?: boolean;
  isWaitingSupport?: boolean;
}

export function SupportChat() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { isMaster } = usePermissions();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = React.useState<UserListItem[]>([]);
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<UserListItem | null>(null);
  const [isSending, setIsSending] = React.useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [showUserList, setShowUserList] = React.useState(false);
  const [hasPendingSupport, setHasPendingSupport] = React.useState(false);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [lastMessageCount, setLastMessageCount] = React.useState(0);
  const [showHistory, setShowHistory] = React.useState(false);
  const [closedConversations, setClosedConversations] = React.useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = React.useState<Conversation | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // ID da conversa selecionada (tanto para master quanto para cliente)
  const activeConversationId = selectedConversation;

  // Função para gerar número de ticket único
  const generateTicketNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
    return `#${year}${month}${day}-${random}`;
  };

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Tom 1: Nota alta
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      oscillator1.frequency.value = 800;
      oscillator1.type = 'sine';
      gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.2);
      
      // Tom 2: Nota mais alta (efeito de sino)
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.value = 1000;
      oscillator2.type = 'sine';
      gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator2.start(audioContext.currentTime + 0.1);
      oscillator2.stop(audioContext.currentTime + 0.4);
      
      console.log('✅ Som de notificação tocado');
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
    }
  };

  // Carregar conversas ABERTAS (apenas para MASTER)
  React.useEffect(() => {
    if (!firestore || !user || !isMaster) return;

    const conversationsRef = collection(firestore, 'supportConversations');
    // Buscar todas as conversas e filtrar no cliente
    const q = query(conversationsRef, orderBy('lastMessageTime', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('🔄 Atualizando conversas ativas - total docs:', snapshot.size);
      const convos: Conversation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const deletedBy = data.deletedBy || [];
        
        // IMPORTANTE: Incluir APENAS conversas que:
        // 1. NÃO têm status === 'closed' (excluir explicitamente fechadas)
        // 2. Não foram deletadas pelo usuário
        const isClosed = data.status === 'closed';
        const isDeleted = deletedBy.includes(user.uid);
        const shouldInclude = !isClosed && !isDeleted;
        
        console.log('📋 Conversa:', doc.id.substring(0, 8), {
          status: data.status,
          isClosed,
          isDeleted,
          shouldInclude,
          userName: data.userName
        });
        
        if (shouldInclude) {
          convos.push({ id: doc.id, ...data, status: data.status || 'open' } as Conversation);
        }
      });
      
      console.log('✅ Conversas ativas finais:', convos.length, convos.map(c => ({ id: c.id.substring(0, 8), status: c.status, user: c.userName })));
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [firestore, user, isMaster]);

  // Carregar conversas encerradas (histórico) - MASTER vê todos, CLIENTE vê apenas os seus
  React.useEffect(() => {
    console.log('🔍 UseEffect histórico - Estado:', { 
      hasFirestore: !!firestore, 
      hasUser: !!user, 
      isMaster,
      showHistory 
    });
    
    if (!firestore || !user) {
      console.log('⚠️ Histórico não carregado - faltam requisitos');
      return;
    }

    console.log('📚 Carregando histórico de chamados encerrados...');

    const conversationsRef = collection(firestore, 'supportConversations');
    
    // MASTER vê todos os chamados encerrados
    // CLIENTE vê apenas seus próprios chamados encerrados
    const q = isMaster 
      ? query(conversationsRef, where('status', '==', 'closed'))
      : query(conversationsRef, where('status', '==', 'closed'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('📚 Snapshot do histórico recebido - docs:', snapshot.size);
        const convos: Conversation[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📄 Doc encontrado:', doc.id, data);
          convos.push({ id: doc.id, ...data } as Conversation);
        });
        
        // Ordenar por closedAt (mais recentes primeiro)
        convos.sort((a, b) => {
          const timeA = (a as any).closedAt?.toMillis() || 0;
          const timeB = (b as any).closedAt?.toMillis() || 0;
          return timeB - timeA;
        });
        
        console.log('📚 Chamados encerrados encontrados:', convos.length, convos);
        setClosedConversations(convos);
      },
      (error) => {
        console.error('❌ Erro ao carregar histórico:', error);
      }
    );

    return () => unsubscribe();
  }, [firestore, user, isMaster, showHistory]);

  // Carregar conversa atual para verificar status
  React.useEffect(() => {
    if (!firestore || !activeConversationId) {
      setCurrentConversation(null);
      return;
    }

    const conversationRef = doc(firestore, 'supportConversations', activeConversationId);
    const unsubscribe = onSnapshot(conversationRef, (snapshot) => {
      if (snapshot.exists()) {
        setCurrentConversation({ id: snapshot.id, ...snapshot.data() } as Conversation);
      } else {
        setCurrentConversation(null);
      }
    });

    return () => unsubscribe();
  }, [firestore, activeConversationId]);

  // Monitorar mensagens não lidas em tempo real (apenas para MASTER)
  React.useEffect(() => {
    if (!firestore || !user || !isMaster) return;

    console.log('🔍 MASTER: Monitorando mensagens não lidas em tempo real...');
    
    // Monitorar todas as mensagens não lidas de outros usuários
    const messagesRef = collection(firestore, 'supportMessages');
    const q = query(
      messagesRef,
      where('read', '==', false),
      where('senderId', '!=', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hasUnread = !snapshot.empty;
      console.log('📬 MASTER: Mensagens não lidas:', snapshot.size, '| hasPendingSupport:', hasUnread);
      setHasPendingSupport(hasUnread);
      
      if (hasUnread) {
        console.log('🔔 MASTER: Há mensagens aguardando resposta!');
      }
    });

    return () => unsubscribe();
  }, [firestore, user, isMaster]);

  // Carregar todos os usuários com status de suporte (apenas para MASTER)
  React.useEffect(() => {
    if (!firestore || !user || !isMaster) return;

    const loadUsers = async () => {
      try {
        const usersRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const users: UserListItem[] = [];
        
        // Carregar conversas para verificar status
        const conversationsRef = collection(firestore, 'supportConversations');
        const conversationsSnapshot = await getDocs(conversationsRef);
        const conversationsMap = new Map();
        
        conversationsSnapshot.forEach((doc) => {
          conversationsMap.set(doc.id, doc.data());
        });

        // Carregar última mensagem de cada conversa
        for (const doc of usersSnapshot.docs) {
          const userData = doc.data();
          // Não adicionar o próprio MASTER na lista
          if (doc.id !== user.uid) {
            const conversation = conversationsMap.get(doc.id);
            let lastMessageTime = null;
            let isWaitingSupport = false;

            if (conversation) {
              // Verificar se há mensagens não lidas do usuário
              const messagesRef = collection(firestore, 'supportMessages');
              const q = query(
                messagesRef,
                where('conversationId', '==', doc.id),
                where('senderId', '==', doc.id),
                where('read', '==', false),
                orderBy('timestamp', 'desc')
              );
              
              const messagesSnapshot = await getDocs(q);
              if (!messagesSnapshot.empty) {
                isWaitingSupport = true;
                lastMessageTime = messagesSnapshot.docs[0].data().timestamp;
              }
            }

            users.push({
              uid: doc.id,
              displayName: userData.displayName || userData.email || 'Usuário',
              email: userData.email || '',
              avatarId: userData.avatarId,
              lastMessageTime,
              isWaitingSupport,
            });
          }
        }

        // Ordenar: primeiro os que estão esperando, depois por nome
        users.sort((a, b) => {
          if (a.isWaitingSupport && !b.isWaitingSupport) return -1;
          if (!a.isWaitingSupport && b.isWaitingSupport) return 1;
          return a.displayName.localeCompare(b.displayName);
        });

        setAllUsers(users);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };

    loadUsers();
    
    // Recarregar a cada 30 segundos para atualizar status
    const interval = setInterval(loadUsers, 30000);
    return () => clearInterval(interval);
  }, [firestore, user, isMaster]);

  // Carregar mensagens da conversa ativa
  React.useEffect(() => {
    if (!firestore || !activeConversationId) {
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    console.log('Carregando mensagens para conversationId:', activeConversationId);
    
    const messagesRef = collection(firestore, 'supportMessages');
    const q = query(
      messagesRef,
      where('conversationId', '==', activeConversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        console.log('Mensagens carregadas:', msgs.length);
        setMessages(msgs);
        setIsLoadingMessages(false);

        // Marcar mensagens como lidas se for master
        if (isMaster) {
          msgs.forEach(async (msg) => {
            if (!msg.read && msg.senderId !== user?.uid) {
              const msgRef = doc(firestore, 'supportMessages', msg.id);
              await updateDoc(msgRef, { read: true });
            }
          });
        }
      },
      (error) => {
        console.error('Erro ao carregar mensagens:', error);
        setIsLoadingMessages(false);
        
        if (error.code === 'failed-precondition') {
          toast({
            title: 'Índice necessário',
            description: 'O sistema precisa criar um índice no banco de dados. Clique no link no console do navegador.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro ao carregar mensagens',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    );

    return () => unsubscribe();
  }, [firestore, activeConversationId, user, isMaster, toast]);

  // Auto-scroll para última mensagem
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Detectar novas mensagens e tocar som (funciona para TODOS os usuários)
  React.useEffect(() => {
    console.log('🔍 [NOTIFICATION DEBUG]:', {
      messagesLength: messages.length,
      lastMessageCount,
      soundEnabled,
      isMaster,
      userId: user?.uid,
      userName: user?.displayName
    });
    
    if (messages.length > lastMessageCount && lastMessageCount > 0) {
      const newMessage = messages[messages.length - 1];
      console.log('📨 [NOVA MENSAGEM DETECTADA]:', {
        from: newMessage.senderName,
        senderId: newMessage.senderId,
        currentUserId: user?.uid,
        isDifferent: newMessage.senderId !== user?.uid,
        soundEnabled,
        willPlaySound: newMessage.senderId !== user?.uid && soundEnabled
      });
      
      // Tocar som apenas se a mensagem não for do próprio usuário e o som estiver ativado
      if (newMessage.senderId !== user?.uid && soundEnabled) {
        console.log('🔔 TOCANDO SOM para:', user?.displayName, '(isMaster:', isMaster + ')');
        playNotificationSound();
      } else {
        console.log('⚠️ SOM NÃO TOCADO:', {
          reason: newMessage.senderId === user?.uid ? 'mensagem própria' : 'som desativado',
          soundEnabled
        });
      }
    }
    setLastMessageCount(messages.length);
  }, [messages, user?.uid, soundEnabled, lastMessageCount, isMaster, user?.displayName]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !firestore) return;

    // Verificar se há uma conversa selecionada
    if (!selectedConversation) {
      toast({
        title: 'Nenhuma conversa selecionada',
        description: 'Por favor, abra um novo chamado primeiro.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se a conversa está encerrada
    if (currentConversation?.status === 'closed' && !isMaster) {
      toast({
        title: 'Chamado encerrado',
        description: 'Este chamado foi encerrado. Por favor, abra um novo chat.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const conversationId = selectedConversation;
      console.log('Enviando mensagem para conversationId:', conversationId);

      // Criar ou atualizar conversa
      const conversationRef = doc(firestore, 'supportConversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      // Verificar se a conversa estava fechada e está sendo reaberta
      const wasClosedConversation = conversationSnap.exists() && conversationSnap.data()?.status === 'closed';
      const isNewConversation = !conversationSnap.exists();
      
      // Gerar novo número de ticket se for conversa nova ou reaberta
      let ticketNumber = conversationSnap.exists() ? conversationSnap.data()?.ticketNumber : undefined;
      if (isNewConversation || wasClosedConversation) {
        ticketNumber = generateTicketNumber();
      }

      // Determinar o userId do cliente (quem está pedindo suporte)
      const clientUserId = isMaster && selectedConversation ? selectedConversation : user.uid;
      
      // Se é nova conversa, definir userName e userEmail do cliente
      // Se já existe, manter os dados originais do cliente
      let conversationData: any = {
        lastMessage: message.trim(),
        lastMessageTime: Timestamp.now(),
        unreadCount: isMaster ? 0 : 1,
        status: 'open' as const,
        deletedBy: [], // Limpar deletedBy quando nova mensagem for enviada
        ticketNumber, // Adicionar número do ticket
      };

      if (isNewConversation) {
        // Nova conversa: definir userId, userName e userEmail do cliente
        conversationData.userId = clientUserId;
        conversationData.userName = isMaster ? (selectedUser?.displayName || 'Usuário') : (user.displayName || 'Usuário');
        conversationData.userEmail = isMaster ? (selectedUser?.email || '') : (user.email || '');
      }
      // Se já existe, não atualizar userId, userName e userEmail - manter os originais

      if (conversationSnap.exists()) {
        await updateDoc(conversationRef, conversationData);
      } else {
        await setDoc(conversationRef, conversationData);
      }

      // Se estava fechado ou é nova, adicionar marcador de "Novo chamado"
      if (wasClosedConversation || isNewConversation) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const markerData = {
          conversationId,
          senderId: 'system',
          senderName: 'Sistema',
          senderEmail: '',
          text: `Novo chamado ${ticketNumber} - ${dateStr} às ${timeStr}`,
          timestamp: Timestamp.now(),
          read: true,
          isSystemMessage: true,
        };
        
        await addDoc(collection(firestore, 'supportMessages'), markerData);
        console.log('Marcador de novo chamado adicionado:', ticketNumber);
      }

      // Adicionar mensagem
      const messageData = {
        conversationId,
        senderId: user.uid,
        senderName: user.displayName || 'Usuário',
        senderEmail: user.email || '',
        text: message.trim(),
        timestamp: Timestamp.now(),
        read: false,
      };
      console.log('Dados da mensagem:', messageData);
      
      await addDoc(collection(firestore, 'supportMessages'), messageData);
      console.log('Mensagem adicionada com sucesso');

      setMessage('');
      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!firestore || !isMaster || !selectedConversation) return;

    const confirmClose = window.confirm('Deseja encerrar este chamado? O cliente precisará abrir um novo chat para continuar.');
    if (!confirmClose) return;

    try {
      console.log('🔒 Encerrando chamado:', selectedConversation);
      
      const conversationRef = doc(firestore, 'supportConversations', selectedConversation);
      const updateData = {
        status: 'closed',
        closedAt: Timestamp.now(),
        closedBy: user?.uid,
      };
      
      console.log('🔒 Dados de encerramento:', updateData);
      await updateDoc(conversationRef, updateData);
      
      console.log('✅ Chamado encerrado com sucesso');
      
      // Verificar se foi salvo corretamente
      const verifySnap = await getDoc(conversationRef);
      const verifyData = verifySnap.data();
      console.log('🔍 Verificando status salvo:', verifyData?.status);

      // FORÇAR REDIRECIONAMENTO PARA HISTÓRICO
      console.log('🔄 Forçando redirecionamento para histórico...');
      
      // Limpar TODAS as seleções IMEDIATAMENTE
      setSelectedConversation(null);
      setSelectedUser(null);
      setShowUserList(false);
      setShowHistory(true);
      
      console.log('✅ Estados definidos: showHistory=true, showUserList=false, selectedConversation=null');

      toast({
        title: 'Chamado encerrado',
        description: 'Redirecionado para o histórico.',
      });
    } catch (error: any) {
      console.error('❌ Erro ao encerrar chamado:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível encerrar o chamado.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenNewTicket = async () => {
    if (!user || !firestore) return;
    
    try {
      // Gerar novo ticket
      const ticketNumber = generateTicketNumber();
      
      // Criar nova conversa
      const newConversationRef = doc(collection(firestore, 'supportConversations'));
      await setDoc(newConversationRef, {
        userId: user.uid,
        userName: user.displayName || 'Usuário',
        userEmail: user.email || '',
        status: 'open',
        ticketNumber,
        lastMessage: `Novo chamado ${ticketNumber}`,
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        deletedBy: []
      });
      
      // Criar mensagem de sistema
      const now = new Date();
      const formattedDate = format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      
      await addDoc(collection(firestore, 'supportMessages'), {
        conversationId: newConversationRef.id,
        senderId: 'system',
        senderName: 'Sistema',
        text: `Novo chamado ${ticketNumber} - ${formattedDate}`,
        timestamp: serverTimestamp(),
        read: false,
        isSystemMessage: true
      });
      
      // Selecionar a nova conversa
      setSelectedConversation(newConversationRef.id);
      setShowHistory(false);
      
      toast({
        title: 'Novo chamado criado',
        description: `Ticket ${ticketNumber} aberto com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao criar novo chamado:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o novo chamado.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!firestore || !user) return;

    const confirmDelete = window.confirm('Deseja realmente ocultar esta conversa? Ela deixará de aparecer na sua lista.');
    if (!confirmDelete) return;

    try {
      // Soft delete: adicionar o UID do usuário atual ao array deletedBy
      const conversationRef = doc(firestore, 'supportConversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      if (conversationSnap.exists()) {
        const data = conversationSnap.data();
        const deletedBy = data.deletedBy || [];
        
        // Adicionar usuário atual ao array de quem deletou
        if (!deletedBy.includes(user.uid)) {
          await updateDoc(conversationRef, {
            deletedBy: [...deletedBy, user.uid]
          });
        }
      }

      // Limpar seleção se estava selecionada
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setSelectedUser(null);
      }

      toast({
        title: 'Conversa ocultada',
        description: 'A conversa foi removida da sua lista. As mensagens foram preservadas para o outro usuário.',
      });
    } catch (error: any) {
      console.error('Erro ao ocultar conversa:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível ocultar a conversa.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectUser = (selectedUser: UserListItem) => {
    setSelectedUser(selectedUser);
    setSelectedConversation(selectedUser.uid);
    setShowUserList(false);
  };

  const getUserStatus = (userItem: UserListItem): 'available' | 'waiting' | 'critical' | 'offline' => {
    // Se tem mensagens esperando suporte
    if (userItem.isWaitingSupport) {
      if (userItem.lastMessageTime) {
        const now = new Date();
        const messageTime = userItem.lastMessageTime.toDate();
        const hoursDiff = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 1) return 'critical';
        return 'waiting';
      }
      return 'waiting';
    }
    
    // Se tem lastMessageTime recente (menos de 24h), está disponível
    if (userItem.lastMessageTime) {
      const now = new Date();
      const messageTime = userItem.lastMessageTime.toDate();
      const daysDiff = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 1) return 'available';
    }
    
    // Caso contrário, está offline (sem atividade recente)
    return 'offline';
  };

  const getStatusColor = (status: 'available' | 'waiting' | 'critical' | 'offline') => {
    switch (status) {
      case 'available': return 'text-green-500';
      case 'waiting': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      case 'offline': return 'text-gray-400';
    }
  };

  const getStatusText = (status: 'available' | 'waiting' | 'critical' | 'offline') => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'waiting': return 'Aguardando suporte';
      case 'critical': return 'URGENTE - Mais de 1h aguardando';
      case 'offline': return 'Usuário não disponível';
    }
  };

  const renderUserList = () => (
    <div className="space-y-2">
      {allUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum usuário encontrado
        </p>
      ) : (
        allUsers.map((userItem) => {
          const status = getUserStatus(userItem);
          const statusColor = getStatusColor(status);
          const statusText = getStatusText(status);
          
          return (
            <Card
              key={userItem.uid}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                status === 'critical' ? 'border-red-500 border-2' : 
                status === 'waiting' ? 'border-yellow-500 border-2' : ''
              }`}
              onClick={() => handleSelectUser(userItem)}
            >
              <CardHeader className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {userItem.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm">{userItem.displayName}</CardTitle>
                      <CardDescription className="text-xs">{userItem.email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <CheckCircle className={`h-5 w-5 ${statusColor}`} />
                    <span className={`text-xs ${statusColor} font-medium`}>
                      {statusText}
                    </span>
                  </div>
                </div>
                {userItem.lastMessageTime && status !== 'available' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Última mensagem: {formatDistanceToNow(userItem.lastMessageTime.toDate(), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                )}
              </CardHeader>
            </Card>
          );
        })
      )}
    </div>
  );

  const renderHistoryList = () => (
    <div className="space-y-2">
      {closedConversations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum chamado encerrado
        </p>
      ) : (
        closedConversations.map((convo) => (
          <Card
            key={convo.id}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => {
              setSelectedConversation(convo.id);
              setShowHistory(false);
            }}
          >
            <CardHeader className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {isMaster ? convo.userName.substring(0, 2).toUpperCase() : 'SU'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{isMaster ? convo.userName : 'Suporte'}</CardTitle>
                      {convo.ticketNumber && (
                        <Badge variant="outline" className="text-xs">
                          {convo.ticketNumber}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">{isMaster ? convo.userEmail : 'Equipe de suporte'}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Encerrado
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {convo.lastMessage}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {convo.lastMessageTime &&
                  formatDistanceToNow(convo.lastMessageTime.toDate(), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
              </p>
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );

  const renderConversationList = () => (
    <div className="space-y-2">
      {conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma conversa ativa
        </p>
      ) : (
        conversations.map((convo) => (
          <Card
            key={convo.id}
            className={`transition-colors hover:bg-accent ${
              selectedConversation === convo.id ? 'border-primary' : ''
            }`}
          >
            <CardHeader className="p-4">
              <div className="flex items-start justify-between">
                <div 
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                  onClick={() => setSelectedConversation(convo.id)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {isMaster ? convo.userName.substring(0, 2).toUpperCase() : 'SU'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-sm">{isMaster ? convo.userName : 'Suporte'}</CardTitle>
                    <CardDescription className="text-xs">{isMaster ? convo.userEmail : 'Equipe de suporte'}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {convo.unreadCount > 0 && (
                    <Badge variant="destructive">
                      {convo.unreadCount}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(convo.id);
                    }}
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Apagar conversa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div 
                className="cursor-pointer"
                onClick={() => setSelectedConversation(convo.id)}
              >
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {convo.lastMessage}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {convo.lastMessageTime &&
                    formatDistanceToNow(convo.lastMessageTime.toDate(), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                </p>
              </div>
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );

  const renderMessages = () => (
    <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
      {isLoadingMessages ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
          <p className="text-xs text-muted-foreground mt-1">
            Envie uma mensagem para começar
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            // Mensagem do sistema (marcador de novo chamado)
            if ((msg as any).isSystemMessage || msg.senderId === 'system') {
              return (
                <div key={msg.id} className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <div className="px-3 py-1 bg-muted rounded-full">
                    <p className="text-xs font-medium text-muted-foreground">
                      {msg.text}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                </div>
              );
            }

            const isCurrentUser = msg.senderId === user?.uid;
            
            // Para MASTER: SEMPRE mostrar nome do USUÁRIO DO CHAT (cliente), não do remetente
            // activeConversationId = ID do usuário cliente (dono do chat)
            let displayName = msg.senderName;
            
            if (isMaster) {
              if (isCurrentUser) {
                // Se for mensagem do MASTER, mostrar "Você" ou nome do MASTER
                displayName = user?.displayName || 'MASTER';
              } else {
                // Se for mensagem do cliente, SEMPRE mostrar nome do DONO DO CHAT
                // Buscar pelo activeConversationId (que é o userId do cliente)
                const chatOwner = selectedUser || 
                                 allUsers.find(u => u.uid === activeConversationId) ||
                                 conversations.find(c => c.id === activeConversationId);
                
                if (chatOwner) {
                  displayName = chatOwner.displayName || (chatOwner as any).userName || 'Usuário';
                  console.log('💬 Nome do chat:', displayName, '| activeConversationId:', activeConversationId);
                } else {
                  displayName = 'Usuário';
                  console.warn('⚠️ Não encontrou dono do chat para:', activeConversationId);
                }
              }
            }
            
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[70%] ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-xs font-medium mb-1">{displayName}</p>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {msg.timestamp &&
                      formatDistanceToNow(msg.timestamp.toDate(), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );

  return (
    <>
      {/* Botão flutuante fixo */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {isMaster && hasPendingSupport && (
          <div className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg animate-pulse">
            Você tem atendimento pendente
          </div>
        )}
        <Button 
          onClick={() => setIsOpen(true)}
          size="lg"
          className={`h-14 w-14 rounded-full shadow-2xl hover:shadow-xl transition-all ${
            isMaster && hasPendingSupport 
              ? 'bg-yellow-500 hover:bg-yellow-600 animate-pulse' 
              : ''
          }`}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <span className="hidden" />
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[500px] sm:max-w-[500px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {isMaster ? 'Central de Suporte' : 'Suporte'}
          </SheetTitle>
          <SheetDescription>
            {isMaster
              ? 'Gerencie conversas de suporte com os usuários'
              : 'Entre em contato com o suporte para obter ajuda'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 flex flex-col overflow-hidden">
          {isMaster && !selectedConversation && !showUserList && !showHistory && (
            <>
              <div className="flex gap-2 mb-4">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowUserList(true)}
                  className="flex-1"
                >
                  <User className="h-4 w-4 mr-2" />
                  Nova Conversa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(true)}
                  className="flex-1"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Histórico ({closedConversations.length})
                </Button>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Conversas Ativas
                </h3>
                {renderConversationList()}
              </div>
            </>
          )}

          {(() => {
            const shouldShowHistory = showHistory && !selectedConversation;
            console.log('🎯 Verificando exibição do histórico:', {
              isMaster,
              showHistory,
              selectedConversation,
              shouldShowHistory
            });
            return shouldShowHistory;
          })() && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(false)}
                className="mb-2"
              >
                ← Voltar
              </Button>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Archive className="h-4 w-4" />
                {isMaster ? 'Histórico de Chamados Encerrados' : 'Meus Chamados Encerrados'} ({closedConversations.length})
              </h3>
              {renderHistoryList()}
            </>
          )}

          {isMaster && showUserList && !selectedConversation && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserList(false)}
                className="mb-2"
              >
                ← Voltar
              </Button>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Selecione um Usuário
              </h3>
              {renderUserList()}
            </>
          )}

          {/* Botões para CLIENTES (não-MASTER) quando não tem conversa selecionada */}
          {!isMaster && !selectedConversation && !showHistory && (
            <div className="flex gap-2 mb-2 flex-shrink-0">
              <Button
                variant="default"
                size="sm"
                onClick={handleOpenNewTicket}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Abrir Novo Chamado
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="flex-1"
              >
                <Archive className="h-4 w-4 mr-2" />
                Histórico ({closedConversations.length})
              </Button>
            </div>
          )}

          {/* Área de conversa - mostra quando não-MASTER tem conversa OU quando MASTER tem conversa */}
          {(((!isMaster && selectedConversation) && !showHistory) || (isMaster && selectedConversation)) && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0">
                {isMaster && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedConversation(null);
                      setSelectedUser(null);
                      setShowUserList(false);
                    }}
                    className="mb-2 w-full"
                  >
                    ← Voltar para lista
                  </Button>
                )}

                {/* Exibir número do ticket */}
                {currentConversation?.ticketNumber && (
                  <div className="mb-2 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-xs font-medium text-primary text-center">
                      Chamado {currentConversation.ticketNumber}
                    </p>
                  </div>
                )}

                {currentConversation?.status === 'closed' && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-700">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Chamado Encerrado</span>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">
                      {isMaster ? 'Este chamado foi encerrado. Você pode visualizar o histórico.' : 'Este chamado foi encerrado. Abra um novo chat para continuar.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Área de mensagens com scroll */}
              <div className="flex-1 overflow-y-auto mb-4">
                {renderMessages()}
              </div>

              {/* Campo de mensagem FIXO NA BASE */}
              <div className="flex-shrink-0 space-y-2 border-t pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={currentConversation?.status === 'closed' && !isMaster ? 'Chamado encerrado - Abra um novo chat' : 'Digite sua mensagem...'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending || (currentConversation?.status === 'closed' && !isMaster)}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isSending}
                    size="icon"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Botões de controle */}
                <div className="flex gap-2 justify-center">
                  {/* Botão Som - para todos */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    title={soundEnabled ? 'Desativar som de notificação' : 'Ativar som de notificação'}
                    className="border border-border hover:bg-accent"
                  >
                    {soundEnabled ? (
                      <Bell className="h-4 w-4 mr-2" />
                    ) : (
                      <BellOff className="h-4 w-4 mr-2" />
                    )}
                    {soundEnabled ? 'Som ativado' : 'Som desativado'}
                  </Button>

                  {/* Botão Encerrar - só MASTER em conversas abertas */}
                  {isMaster && (!currentConversation || currentConversation?.status !== 'closed') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseTicket}
                      title="Encerrar chamado"
                      className="border border-orange-300 text-orange-600 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Encerrar
                    </Button>
                  )}

                  {/* Botão Deletar - só MASTER */}
                  {isMaster && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => selectedConversation && handleDeleteConversation(selectedConversation)}
                      title="Ocultar conversa"
                      className="border border-red-300 text-destructive hover:border-red-500 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
