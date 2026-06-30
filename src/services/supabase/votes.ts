import { supabase } from '../../config/supabase';
import { Vote } from '../../types';

export const votesService = {
  async castVote(voteData: Omit<Vote, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('votes')
      .insert([voteData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getUserVoteForTurn(storyId: string, userId: string, turnNumber: number) {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .eq('turn_number', turnNumber)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getVotesForContribution(contributionId: string) {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('contribution_id', contributionId);
    if (error) throw error;
    return data;
  },

  async getVoteCount(contributionId: string) {
    const { count, error } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('contribution_id', contributionId);
    if (error) throw error;
    return count || 0;
  },

  async getVotesForTurn(storyId: string, turnNumber: number) {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('story_id', storyId)
      .eq('turn_number', turnNumber);
    if (error) throw error;
    return data;
  },

  async getWinningContribution(storyId: string, turnNumber: number) {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        *,
        author:users(username, avatar_url),
        votes(count)
      `)
      .eq('story_id', storyId)
      .eq('turn_number', turnNumber)
      .eq('is_canon', false)
      .order('votes_count', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  },

  subscribeToVotes(storyId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`votes:${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `story_id=eq.${storyId}`,
        },
        callback
      )
      .subscribe();
  },
};
