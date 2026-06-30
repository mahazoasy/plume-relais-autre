import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

export const useRealtime = <T>(
  table: string,
  filter: { column: string; value: string },
  callback: (payload: any) => void
) => {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}:${filter.column}:${filter.value}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${filter.column}=eq.${filter.value}`,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter.column, filter.value]);
};