import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const useBadges = (userId: string) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    setLoading(true);
    try {
      // Récupérer les badges de l'utilisateur
      const { data, error } = await supabase
        .from('user_badges')
        .select('badges(*)')
        .eq('user_id', userId);

      if (error) throw error;
      setBadges(data?.map((item: any) => item.badges) || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour calculer les badges à débloquer
  const checkBadgeEligibility = async (stats: { stories: number; contributions: number; votes: number }) => {
 
  };

  return { badges, loading, checkBadgeEligibility };
};