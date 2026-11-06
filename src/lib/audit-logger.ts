import { supabase } from './supabase';

export type AuditAction = 
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'TELEMETRY_INSERTED'
  | 'TELEMETRY_UPDATED'
  | 'POOL_CREATED'
  | 'ALERT_SENT'
  | 'SYSTEM_CONFIG_CHANGED';

export interface AuditLogData {
  user_id?: string;
  user_email?: string;
  action: AuditAction;
  details: string;
  ip_address?: string;
  user_agent?: string;
  payload?: any;
}

export async function logAudit(data: AuditLogData) {
  try {
    const { error } = await supabase.from('audit_logs').insert([
      {
        user_id: data.user_id || null,
        user_email: data.user_email || 'anonymous',
        action: data.action,
        details: data.details,
        ip_address: data.ip_address || 'unknown',
        user_agent: data.user_agent || 'unknown',
        payload: data.payload || {},
      }
    ]);

    if (error) {
      console.error('Failed to write audit log:', error.message);
    }
  } catch (err) {
    console.error('Exception writing audit log:', err);
  }
}
