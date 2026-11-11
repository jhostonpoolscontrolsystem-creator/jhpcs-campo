'use client';

import { TargetSector } from '@/types/profiles';

export interface CachedSessionMetadata {
  operator_id: string;
  operator_name: string;
  operator_email?: string;
  tenant_name: string;
  target_sector: TargetSector;
  sector_badge: string;
  cached_session_token: string;
  last_sync_at: string;
  cpf?: string;
}

const CACHED_SESSION_KEY = 'jhpcs_cached_session_v1';

export function saveCachedSession(session: CachedSessionMetadata): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHED_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('Falha ao salvar sessão em cache local:', err);
  }
}

export function getCachedSession(): CachedSessionMetadata | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHED_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedSessionMetadata;
  } catch {
    return null;
  }
}

export function clearCachedSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHED_SESSION_KEY);
  } catch {
    // noop
  }
}

