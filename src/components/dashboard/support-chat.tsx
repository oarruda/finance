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
import { MessageCircle, Send, Loader2, User, Users, CheckCircle, Bell, BellOff, Trash2 } from 'lucide-react';
import { collection, query, orderBy, addDoc, onSnapshot, where, Timestamp, getDocs, doc, updateDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
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
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // ID da conversa do usuário atual (não-master) ou conversa selecionada (master)
  const activeConversationId = isMaster ? selectedConversation : user?.uid;

  // Inicializar áudio de notificação
  React.useEffect(() => {
    // Criar elemento de áudio com som de sino
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFAhGn+DyvmwhBSF+zO/aizsIEl2x6OOPSQwPS6Xf8LRqIQQ2jdXz0n0pBSZ8x/DalEIIFFu06OynVxQHRp/g8r9vHwUfe8/v2404CBBftejgjE0MDVCn4O+0bSAENY3U89F9KgUme8jv2pRBCBRasejspVcUB0ef4PK+cR8FH3vP79qNOQgPX7Xo4I1ND')]); 
    audioRef.current.volume = 0.5;
  }, []);

  // Carregar conversas (apenas para MASTER)
  React.useEffect(() => {
    if (!firestore || !user || !isMaster) return;

    const conversationsRef = collection(firestore, 'supportConversations');
    const q = query(conversationsRef, orderBy('lastMessageTime', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos: Conversation[] = [];
      snapshot.forEach((doc) => {
        convos.push({ id: doc.id, ...doc.data() } as Conversation);
      });
      setConversations(convos);
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
        
        // Verificar se há atendimentos pendentes
        const hasPending = users.some(u => u.isWaitingSupport);
        setHasPendingSupport(hasPending);
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

  // Detectar novas mensagens e tocar som
  React.useEffect(() => {
    if (messages.length > lastMessageCount && lastMessageCount > 0) {
      const newMessage = messages[messages.length - 1];
      // Tocar som apenas se a mensagem não for do próprio usuário e o som estiver ativado
      if (newMessage.senderId !== user?.uid && soundEnabled && audioRef.current) {
        audioRef.current.play().catch(err => console.log('Erro ao tocar som:', err));
      }
    }
    setLastMessageCount(messages.length);
  }, [messages, user?.uid, soundEnabled, lastMessageCount]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !firestore) return;

    setIsSending(true);
    try {
      const conversationId = activeConversationId || user.uid;
      console.log('Enviando mensagem para conversationId:', conversationId);

      // Criar ou atualizar conversa
      const conversationRef = doc(firestore, 'supportConversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      const conversationData = {
        userId: isMaster && selectedConversation ? selectedConversation : user.uid,
        userName: user.displayName || 'Usuário',
        userEmail: user.email || '',
        lastMessage: message.trim(),
        lastMessageTime: Timestamp.now(),
        unreadCount: isMaster ? 0 : 1,
        status: 'open' as const,
      };

      if (conversationSnap.exists()) {
        await updateDoc(conversationRef, conversationData);
      } else {
        await setDoc(conversationRef, conversationData);
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

  const handleDeleteConversation = async (conversationId: string) => {
    if (!firestore || !isMaster) return;

    const confirmDelete = window.confirm('Deseja realmente apagar esta conversa? Todas as mensagens serão perdidas.');
    if (!confirmDelete) return;

    try {
      // Deletar todas as mensagens da conversa
      const messagesRef = collection(firestore, 'supportMessages');
      const q = query(messagesRef, where('conversationId', '==', conversationId));
      const messagesSnapshot = await getDocs(q);
      
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Deletar a conversa
      const conversationRef = doc(firestore, 'supportConversations', conversationId);
      await deleteDoc(conversationRef);

      // Limpar seleção se estava selecionada
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setSelectedUser(null);
      }

      toast({
        title: 'Conversa apagada',
        description: 'A conversa e todas as mensagens foram removidas com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao apagar conversa:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível apagar a conversa.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectUser = (selectedUser: UserListItem) => {
    setSelectedUser(selectedUser);
    setSelectedConversation(selectedUser.uid);
    setShowUserList(false);
  };

  const getUserStatus = (userItem: UserListItem): 'available' | 'waiting' | 'critical' => {
    if (!userItem.isWaitingSupport) return 'available';
    
    if (userItem.lastMessageTime) {
      const now = new Date();
      const messageTime = userItem.lastMessageTime.toDate();
      const hoursDiff = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 1) return 'critical';
      return 'waiting';
    }
    
    return 'available';
  };

  const getStatusColor = (status: 'available' | 'waiting' | 'critical') => {
    switch (status) {
      case 'available': return 'text-green-500';
      case 'waiting': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
    }
  };

  const getStatusText = (status: 'available' | 'waiting' | 'critical') => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'waiting': return 'Aguardando suporte';
      case 'critical': return 'URGENTE - Mais de 1h aguardando';
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
                      {convo.userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-sm">{convo.userName}</CardTitle>
                    <CardDescription className="text-xs">{convo.userEmail}</CardDescription>
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
            const isCurrentUser = msg.senderId === user?.uid;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {msg.senderName.substring(0, 2).toUpperCase()}
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
                    <p className="text-xs font-medium mb-1">{msg.senderName}</p>
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
      <SheetContent side="right" className="w-full sm:w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {isMaster ? 'Central de Suporte' : 'Suporte'}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Desativar som de notificação' : 'Ativar som de notificação'}
            >
              {soundEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <SheetDescription>
            {isMaster
              ? 'Gerencie conversas de suporte com os usuários'
              : 'Entre em contato com o suporte para obter ajuda'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isMaster && !selectedConversation && !showUserList && (
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

          {((!isMaster) || (isMaster && selectedConversation)) && (
            <>
              {isMaster && (
                <div className="flex gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedConversation(null);
                      setSelectedUser(null);
                      setShowUserList(false);
                    }}
                    className="flex-1"
                  >
                    ← Voltar para lista
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => selectedConversation && handleDeleteConversation(selectedConversation)}
                    title="Apagar conversa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {renderMessages()}

              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending}
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
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
