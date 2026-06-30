import { useMemo, useCallback } from 'react';

export const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
  return useCallback(callback, []) as T;
};

export const useMemoizedValue = <T>(value: T, deps?: any[]): T => {
  return useMemo(() => value, deps || [value]);
};