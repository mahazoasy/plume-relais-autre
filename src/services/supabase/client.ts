import { supabase } from '../../config/supabase';

export const supabaseClient = supabase;

export const handleSupabaseError = (error: any): string => {
  console.error('Supabase error:', error);
  return error.message || 'Une erreur est survenue';
};
