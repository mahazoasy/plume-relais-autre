import { supabase } from '../../config/supabase';

export const reportsService = {
  async reportContent(
    contentId: string,
    contentType: 'story' | 'contribution' | 'comment',
    reason: string,
    userId: string
  ) {
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        content_id: contentId,
        content_type: contentType,
        reason,
        user_id: userId,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReports(contentId: string, contentType: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType);

    if (error) throw error;
    return data;
  },

  async resolveReport(reportId: string) {
    const { data, error } = await supabase
      .from('reports')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};