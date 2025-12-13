'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faHeart,
  faStar,
  faCompass,
  faGem,
  faLightbulb,
  faEye,
  faCircle,
  faSquare,
  faHourglass,
  faMoon,
  faSun,
  faSnowflake,
  faFaceSmile,
  faFaceMeh,
  faFaceGrin,
  faBell,
  faEnvelope,
  faFlag,
  faBookmark,
} from '@fortawesome/free-regular-svg-icons';

export interface AvatarOption {
  id: string;
  icon: any;
  gradient: string;
  label: string;
}

export const avatarOptions: AvatarOption[] = [
  {
    id: 'user-1',
    icon: faUser,
    gradient: 'from-blue-500 to-cyan-500',
    label: 'Usuário',
  },
  {
    id: 'user-2',
    icon: faHeart,
    gradient: 'from-pink-500 to-rose-500',
    label: 'Coração',
  },
  {
    id: 'user-3',
    icon: faStar,
    gradient: 'from-yellow-500 to-amber-500',
    label: 'Estrela',
  },
  {
    id: 'user-4',
    icon: faCompass,
    gradient: 'from-teal-500 to-cyan-600',
    label: 'Bússola',
  },
  {
    id: 'user-5',
    icon: faGem,
    gradient: 'from-cyan-400 to-blue-500',
    label: 'Diamante',
  },
  {
    id: 'user-6',
    icon: faLightbulb,
    gradient: 'from-yellow-400 to-orange-500',
    label: 'Lâmpada',
  },
  {
    id: 'user-7',
    icon: faEye,
    gradient: 'from-indigo-500 to-purple-500',
    label: 'Olho',
  },
  {
    id: 'user-8',
    icon: faCircle,
    gradient: 'from-emerald-500 to-green-600',
    label: 'Círculo',
  },
  {
    id: 'user-9',
    icon: faSquare,
    gradient: 'from-orange-500 to-red-500',
    label: 'Quadrado',
  },
  {
    id: 'user-10',
    icon: faHourglass,
    gradient: 'from-amber-600 to-yellow-600',
    label: 'Ampulheta',
  },
  {
    id: 'user-11',
    icon: faMoon,
    gradient: 'from-slate-600 to-slate-800',
    label: 'Lua',
  },
  {
    id: 'user-12',
    icon: faSun,
    gradient: 'from-yellow-400 to-orange-400',
    label: 'Sol',
  },
  {
    id: 'user-13',
    icon: faSnowflake,
    gradient: 'from-blue-400 to-cyan-400',
    label: 'Floco de Neve',
  },
  {
    id: 'user-14',
    icon: faFaceSmile,
    gradient: 'from-green-500 to-emerald-500',
    label: 'Sorriso',
  },
  {
    id: 'user-15',
    icon: faFaceMeh,
    gradient: 'from-gray-500 to-gray-600',
    label: 'Neutro',
  },
  {
    id: 'user-16',
    icon: faFaceGrin,
    gradient: 'from-purple-500 to-pink-500',
    label: 'Gargalhada',
  },
  {
    id: 'user-17',
    icon: faBell,
    gradient: 'from-red-500 to-pink-500',
    label: 'Sino',
  },
  {
    id: 'user-18',
    icon: faEnvelope,
    gradient: 'from-blue-600 to-indigo-600',
    label: 'Envelope',
  },
  {
    id: 'user-19',
    icon: faFlag,
    gradient: 'from-red-600 to-orange-600',
    label: 'Bandeira',
  },
  {
    id: 'user-20',
    icon: faBookmark,
    gradient: 'from-violet-500 to-purple-600',
    label: 'Marcador',
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
