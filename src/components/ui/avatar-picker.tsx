'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faCircleUser,
  faAddressCard,
  faIdCard,
  faUserCircle,
  faLightbulb,
  faHardDrive,
  faKeyboard,
  faFileCode,
  faCreditCard,
  faChartBar,
  faGem,
  faCompass,
  faStar,
  faHeart,
  faEye,
  faBell,
  faEnvelope,
  faComment,
  faMessage,
} from '@fortawesome/free-regular-svg-icons';

export interface AvatarOption {
  id: string;
  icon: any;
  gradient: string;
  label: string;
}

export const avatarOptions: AvatarOption[] = [
  // Avatares de Usuários
  {
    id: 'user-1',
    icon: faUser,
    gradient: 'from-blue-500 to-cyan-500',
    label: 'Usuário Padrão',
  },
  {
    id: 'user-2',
    icon: faCircleUser,
    gradient: 'from-indigo-500 to-blue-500',
    label: 'Usuário Círculo',
  },
  {
    id: 'user-3',
    icon: faAddressCard,
    gradient: 'from-purple-500 to-indigo-500',
    label: 'Cartão de Visita',
  },
  {
    id: 'user-4',
    icon: faIdCard,
    gradient: 'from-slate-600 to-slate-800',
    label: 'ID Card',
  },
  {
    id: 'user-5',
    icon: faUserCircle,
    gradient: 'from-teal-500 to-cyan-500',
    label: 'Perfil',
  },
  // Avatares de Tecnologia
  {
    id: 'tech-1',
    icon: faLightbulb,
    gradient: 'from-yellow-400 to-orange-500',
    label: 'Inovação',
  },
  {
    id: 'tech-2',
    icon: faHardDrive,
    gradient: 'from-gray-600 to-gray-800',
    label: 'Servidor',
  },
  {
    id: 'tech-3',
    icon: faKeyboard,
    gradient: 'from-slate-700 to-slate-900',
    label: 'Desenvolvedor',
  },
  {
    id: 'tech-4',
    icon: faFileCode,
    gradient: 'from-green-600 to-emerald-600',
    label: 'Código',
  },
  {
    id: 'tech-5',
    icon: faCreditCard,
    gradient: 'from-blue-600 to-indigo-600',
    label: 'Finanças',
  },
  {
    id: 'tech-6',
    icon: faChartBar,
    gradient: 'from-emerald-500 to-green-600',
    label: 'Análise',
  },
  // Avatares Gerais
  {
    id: 'general-1',
    icon: faGem,
    gradient: 'from-cyan-400 to-blue-500',
    label: 'Premium',
  },
  {
    id: 'general-2',
    icon: faCompass,
    gradient: 'from-orange-500 to-red-500',
    label: 'Explorador',
  },
  {
    id: 'general-3',
    icon: faStar,
    gradient: 'from-yellow-500 to-amber-500',
    label: 'Destaque',
  },
  {
    id: 'general-4',
    icon: faHeart,
    gradient: 'from-pink-500 to-rose-500',
    label: 'Favorito',
  },
  {
    id: 'general-5',
    icon: faEye,
    gradient: 'from-violet-500 to-purple-500',
    label: 'Observador',
  },
  {
    id: 'general-6',
    icon: faBell,
    gradient: 'from-red-500 to-pink-500',
    label: 'Notificações',
  },
  {
    id: 'general-7',
    icon: faEnvelope,
    gradient: 'from-blue-500 to-indigo-500',
    label: 'Mensagens',
  },
  {
    id: 'general-8',
    icon: faComment,
    gradient: 'from-green-500 to-teal-500',
    label: 'Chat',
  },
  {
    id: 'general-9',
    icon: faMessage,
    gradient: 'from-purple-600 to-pink-600',
    label: 'Comunicação',
  },
];

interface AvatarPickerProps {
  selectedAvatarId?: string;
  onSelect: (avatarId: string) => void;
  disabled?: boolean;
}

export function AvatarPicker({ selectedAvatarId, onSelect, disabled }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-3">
      {avatarOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          disabled={disabled}
          className={cn(
            'relative rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            selectedAvatarId === option.id && 'ring-2 ring-primary scale-110',
            disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
          )}
          title={option.label}
        >
          <div
            className={cn(
              'h-16 w-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-md',
              option.gradient
            )}
          >
            <FontAwesomeIcon icon={option.icon} className="h-8 w-8" />
          </div>
          {selectedAvatarId === option.id && (
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3 text-white"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export function UserAvatar({ avatarId, className }: { avatarId?: string; className?: string }) {
  const option = avatarOptions.find(opt => opt.id === avatarId) || avatarOptions[0];
  
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-lg',
        option.gradient,
        className
      )}
    >
      <FontAwesomeIcon icon={option.icon} className="h-1/2 w-1/2" />
    </div>
  );
}
