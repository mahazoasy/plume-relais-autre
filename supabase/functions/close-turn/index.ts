import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (_req) => {
  // Récupérer les histoires en cours avec tour expiré (5 min d'inactivité)
  const now = new Date();
  const expiryTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes

  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .eq('status', 'in_progress')
    .lt('updated_at', expiryTime.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let processedCount = 0;

  for (const story of stories || []) {
    // Trouver la contribution gagnante (celle avec le plus de votes)
    const { data: winner } = await supabase
      .from('contributions')
      .select('*, votes(count)')
      .eq('story_id', story.id)
      .eq('turn_number', story.current_turn)
      .eq('is_canon', false)
      .order('votes_count', { ascending: false })
      .limit(1);

    if (winner && winner.length > 0) {
      // Marquer comme canon
      await supabase
        .from('contributions')
        .update({ is_canon: true, updated_at: new Date().toISOString() })
        .eq('id', winner[0].id);

      // Passer au tour suivant
      const newTurn = story.current_turn + 1;
      await supabase
        .from('stories')
        .update({ current_turn: newTurn, updated_at: new Date().toISOString() })
        .eq('id', story.id);

      // Si le tour max est atteint, marquer comme terminée
      if (newTurn > story.max_contributions) {
        await supabase
          .from('stories')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', story.id);
      }

      processedCount++;
    }
  }

  return new Response(
    JSON.stringify({
      processed: processedCount,
      total: stories?.length || 0,
      timestamp: new Date().toISOString(),
    }),
    { status: 200 }
  );
});
