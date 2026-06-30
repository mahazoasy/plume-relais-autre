import { Alert } from 'react-native';

type ErrorType = 'network' | 'auth' | 'validation' | 'server' | 'unknown';

export class AppError extends Error {
  type: ErrorType;
  userMessage: string;

  constructor(message: string, type: ErrorType = 'unknown', userMessage?: string) {
    super(message);
    this.type = type;
    this.userMessage = userMessage || message;
  }
}

export const handleError = (error: any, context?: string) => {
  console.error(`Error in ${context || 'app'}:`, error);

  if (error instanceof AppError) {
    Alert.alert('Erreur', error.userMessage);
    return;
  }

  // Erreurs réseau
  if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
    Alert.alert('Erreur réseau', 'Vérifiez votre connexion internet');
    return;
  }

  // Erreurs d'authentification
  if (error.message?.includes('auth') || error.message?.includes('session')) {
    Alert.alert('Erreur', 'Veuillez vous reconnecter');
    return;
  }

  // Erreur par défaut
  Alert.alert('Erreur', error.message || 'Une erreur est survenue');
};