import { supabase } from '../../config/supabase';
import { Story } from '../../types';

export const storiesService = {
  async createStory(storyData: Omit<Story, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('stories')
      .insert([storyData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getStories(filters?: {
    status?: string;
    visibility?: string;
    userId?: string;
  }) {
    let query = supabase
      .from('stories')
      .select(`
        *,
        created_by_user:users!created_by(username, avatar_url),
        participants:story_participations(count)
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.visibility) {
      query = query.eq('visibility', filters.visibility);
    }

    if (filters?.userId) {
      const { data: participations } = await supabase
        .from('story_participations')
        .select('story_id')
        .eq('user_id', filters.userId);

      const storyIds = participations?.map(p => p.story_id) || [];
      if (storyIds.length > 0) {
        query = query.in('id', storyIds);
      } else {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getStoryById(id: string) {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        created_by_user:users!created_by(username, avatar_url),
        participants:story_participations(
          user_id,
          users(username, avatar_url)
        ),
        contributions(
          *,
          author:users(username, avatar_url),
          votes(count)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async joinStory(storyId: string, userId: string) {
    const { data, error } = await supabase
      .from('story_participations')
      .insert([{ story_id: storyId, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async leaveStory(storyId: string, userId: string) {
    const { error } = await supabase
      .from('story_participations')
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async updateStoryStatus(storyId: string, status: string) {
    const { data, error } = await supabase
      .from('stories')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', storyId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTurn(storyId: string, turnNumber: number) {
    const { data, error } = await supabase
      .from('stories')
      .update({ current_turn: turnNumber, updated_at: new Date().toISOString() })
      .eq('id', storyId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async checkParticipation(storyId: string, userId: string) {
    const { data, error } = await supabase
      .from('story_participations')
      .select('*')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async getParticipants(storyId: string) {
    const { data, error } = await supabase
      .from('story_participations')
      .select('user_id, users(username, avatar_url)')
      .eq('story_id', storyId);
    if (error) throw error;
    return data;
  },

  subscribeToStory(storyId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`story:${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${storyId}`,
        },
        callback
      )
      .subscribe();
  },
};
