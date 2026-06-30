import { STORY_STATUS } from './constants';

export const formatDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case STORY_STATUS.OPEN:
      return '🔓 Ouverte';
    case STORY_STATUS.IN_PROGRESS:
      return '🔄 En cours';
    case STORY_STATUS.COMPLETED:
      return '✅ Terminée';
    default:
      return status;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case STORY_STATUS.OPEN:
      return '#4CAF50';
    case STORY_STATUS.IN_PROGRESS:
      return '#FF9800';
    case STORY_STATUS.COMPLETED:
      return '#9E9E9E';
    default:
      return '#6C63FF';
  }
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const getRandomColor = (): string => {
  const colors = [
    '#6C63FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const getTimeRemaining = (createdAt: string, durationMinutes: number): number => {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const durationMs = durationMinutes * 60 * 1000;
  const remaining = durationMs - (now - created);
  return Math.max(0, Math.floor(remaining / 1000));
};

export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return '0s';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};
