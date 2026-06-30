import { isValidEmail, isValidPassword } from './helpers';

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'L\'email est requis' };
  }
  if (!isValidEmail(email)) {
    return { valid: false, error: 'Email invalide' };
  }
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'Le mot de passe est requis' };
  }
  if (!isValidPassword(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
  }
  return { valid: true };
};

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username) {
    return { valid: false, error: 'Le nom d\'utilisateur est requis' };
  }
  if (username.length < 3) {
    return { valid: false, error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' };
  }
  if (username.length > 30) {
    return { valid: false, error: 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères' };
  }
  return { valid: true };
};

export const validateTitle = (title: string): { valid: boolean; error?: string } => {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Le titre est requis' };
  }
  if (title.length > 100) {
    return { valid: false, error: 'Le titre ne peut pas dépasser 100 caractères' };
  }
  return { valid: true };
};

export const validateContent = (content: string): { valid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Le contenu est requis' };
  }
  if (content.length < 10) {
    return { valid: false, error: 'Le contenu doit contenir au moins 10 caractères' };
  }
  if (content.length > 5000) {
    return { valid: false, error: 'Le contenu ne peut pas dépasser 5000 caractères' };
  }
  return { valid: true };
};

export const validateNumber = (value: string, min: number, max: number): { valid: boolean; error?: string } => {
  const num = parseInt(value);
  if (isNaN(num)) {
    return { valid: false, error: 'Veuillez entrer un nombre valide' };
  }
  if (num < min) {
    return { valid: false, error: `La valeur doit être au moins ${min}` };
  }
  if (num > max) {
    return { valid: false, error: `La valeur ne peut pas dépasser ${max}` };
  }
  return { valid: true };
};
