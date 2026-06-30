import { supabase } from '../../config/supabase';

export const commentsService = {
  async addComment(storyId: string, userId: string, content: string) {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ story_id: storyId, user_id: userId, content }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getComments(storyId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:users(username, avatar_url)')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async deleteComment(commentId: string, userId: string) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  subscribeToComments(storyId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`comments:${storyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `story_id=eq.${storyId}`,
      }, callback)
      .subscribe();
  },
};