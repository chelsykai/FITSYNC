import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all audit logs from the audit_trail table
 */
export const fetchAuditLogs = async () => {
  try {
    const { data, error } = await supabase
      .from('audit_trail')
      .select('log_id, user_id, action, detail, time, status')
      .order('log_id', { ascending: false });

    if (error) throw error;

    // Transform the data to match the component's expected structure
    return (data || []).map(log => {
      // Determine status type based on status field
      let statusType = 'info';
      if (log.status === 'success' || log.status?.includes('added') || log.status?.includes('created')) {
        statusType = 'success';
      } else if (log.status === 'error' || log.status === 'failed') {
        statusType = 'error';
      }

      return {
        id: log.log_id,
        time: log.time || '',
        user: log.user_id?.toString() || 'system',
        action: log.action || 'unknown_action',
        changes: {
          ...(log.detail && { detail: log.detail })
        },
        statusType: statusType,
        status: log.status
      };
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

/**
 * Get unique user IDs from audit logs for filtering
 */
export const getAuditUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('audit_trail')
      .select('user_id')
      .order('user_id', { ascending: true });

    if (error) throw error;

    // Get unique users
    const uniqueUsers = new Set();
    (data || []).forEach(log => {
      if (log.user_id) uniqueUsers.add(log.user_id.toString());
    });

    return ['all admins', ...Array.from(uniqueUsers)];
  } catch (error) {
    console.error('Error fetching audit users:', error);
    throw error;
  }
};
