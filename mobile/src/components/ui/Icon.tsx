import React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Edit3,
  Frown,
  Home,
  Plus,
  Settings,
  Share2,
  Smile,
  Sparkles,
  Star,
  Text as TextIcon,
  User,
  Video,
  VideoOff,
  X,
  type LucideIcon,
} from 'lucide-react-native';

const ICONS: Record<string, LucideIcon> = {
  add: Plus,
  'alert-circle-outline': AlertCircle,
  'arrow-back': ArrowLeft,
  checkmark: Check,
  close: X,
  'create-outline': Edit3,
  happy: Smile,
  home: Home,
  'home-outline': Home,
  person: User,
  sad: Frown,
  settings: Settings,
  'settings-outline': Settings,
  'share-outline': Share2,
  'sparkles-outline': Sparkles,
  star: Star,
  'star-outline': Star,
  'text-outline': TextIcon,
  videocam: Video,
  'videocam-off': VideoOff,
  'videocam-outline': Video,
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color = '#0f172a' }: IconProps) {
  const IconComponent = ICONS[name] ?? AlertCircle;
  return <IconComponent size={size} color={color} strokeWidth={2} />;
}
