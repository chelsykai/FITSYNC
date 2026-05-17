import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all audit logs from the audit_trail table with schema fallback
 */
export const fetchAuditLogs = async () => {
  try {
    // Try new schema first
    let result = await supabase
      .from('audit_trail')
      .select('log_id, user_name, action_performed, affected_module, affected_data, created_at')
      .order('created_at', { ascending: false });

    let data = result.data;
    let error = result.error;
    let isNewSchema = !error && data && data.length > 0;

    // Fallback to legacy schema if new schema fails
    if (error || !data || data.length === 0) {
      const legacyResult = await supabase
        .from('audit_trail')
        .select('log_id, user_id, action, detail, time, status')
        .order('log_id', { ascending: false });
      data = legacyResult.data;
      error = legacyResult.error;
      isNewSchema = false;
    }

    if (error) throw error;

    // Transform the data based on schema
    return (data || []).map(log => {
      if (isNewSchema) {
        // Parse affected_data to be more readable
        let parsedData = {};
        if (log.affected_data) {
          if (typeof log.affected_data === 'string') {
            try {
              parsedData = JSON.parse(log.affected_data);
            } catch (e) {
              parsedData = { data: log.affected_data };
            }
          } else {
            parsedData = log.affected_data;
          }
        }

        return {
          id: log.log_id,
          time: log.created_at ? new Date(log.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : '',
          user: log.user_name || 'system',
          user_id: log.user_name,
          action: log.action_performed || 'unknown_action',
          changes: parsedData,
          statusType: 'success',
          status: 'success'
        };
      } else {
        // Legacy schema
        let statusType = 'info';
        if (log.status === 'success' || log.status?.includes('added') || log.status?.includes('created')) {
          statusType = 'success';
        } else if (log.status === 'error' || log.status === 'failed') {
          statusType = 'error';
        }

        let parsedDetail = {};
        if (log.detail) {
          try {
            parsedDetail = JSON.parse(log.detail);
          } catch (e) {
            parsedDetail = { detail: log.detail };
          }
        }

        return {
          id: log.log_id,
          time: log.time || '',
          user: log.user_id?.toString() || 'system',
          user_id: log.user_id?.toString() || 'system',
          action: log.action || 'unknown_action',
          changes: parsedDetail,
          statusType: statusType,
          status: log.status
        };
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

/**
 * Get unique user IDs from audit logs and all admin accounts for filtering
 */
export const getAuditUsers = async () => {
  try {
    const uniqueUsers = new Set();

    // Fetch audit logs to get actors who have performed actions
    const auditResult = await supabase
      .from('audit_trail')
      .select('user_name, user_id')
      .order('user_name', { ascending: true });

    if (auditResult.data) {
      (auditResult.data || []).forEach(log => {
        const userName = (log.user_name || log.user_id || '').trim();
        if (userName) uniqueUsers.add(userName);
      });
    }

    // Fetch all admin accounts from system_user
    const adminsResult = await supabase
      .from('system_user')
      .select('first_name, last_name, username')
      .eq('role', 'Admin')
      .order('first_name', { ascending: true });

    if (adminsResult.data) {
      (adminsResult.data || []).forEach(admin => {
        // Construct full name the same way as in accountService logAuditTrail
        const adminName = `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username;
        if (adminName) uniqueUsers.add(adminName);
      });
    }

    return ['all admins', ...Array.from(uniqueUsers)];
  } catch (error) {
    console.error('Error fetching audit users:', error);
    return ['all admins'];
  }
};
