import { supabase } from '../../config/supabase';
import { Contribution } from '../../types';

export const contributionsService = {
  async addContribution(contributionData: Omit<Contribution, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('contributions')
      .insert([contributionData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getStoryContributions(storyId: string, turnNumber?: number) {
    let query = supabase
      .from('contributions')
      .select(`
        *,
        author:users(username, avatar_url),
        votes(count)
      `)
      .eq('story_id', storyId);

    if (turnNumber) {
      query = query.eq('turn_number', turnNumber);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getCanonContributions(storyId: string) {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        *,
        author:users(username, avatar_url),
        votes(count)
      `)
      .eq('story_id', storyId)
      .eq('is_canon', true)
      .order('turn_number', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getPendingContributions(storyId: string, turnNumber: number) {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        *,
        author:users(username, avatar_url),
        votes(count)
      `)
      .eq('story_id', storyId)
      .eq('turn_number', turnNumber)
      .eq('is_canon', false);
    if (error) throw error;
    return data;
  },

  async markAsCanon(contributionId: string) {
    const { data, error } = await supabase
      .from('contributions')
      .update({ is_canon: true, updated_at: new Date().toISOString() })
      .eq('id', contributionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getUserContribution(storyId: string, userId: string, turnNumber: number) {
    const { data, error } = await supabase
      .from('contributions')
      .select('*')
      .eq('story_id', storyId)
      .eq('author_id', userId)
      .eq('turn_number', turnNumber)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getContributionWithVotes(contributionId: string) {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        *,
        author:users(username, avatar_url),
        votes(count)
      `)
      .eq('id', contributionId)
      .single();
    if (error) throw error;
    return data;
  },

  subscribeToContributions(storyId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`contributions:${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contributions',
          filter: `story_id=eq.${storyId}`,
        },
        callback
      )
      .subscribe();
  },
};
