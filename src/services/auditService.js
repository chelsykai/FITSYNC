import { supabase } from '../lib/supabaseClient';

export const getAuditActorRole = async () => {
  try {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const userId = currentUser?.user_id ? String(currentUser.user_id).trim() : '';
    const username = currentUser?.username ? String(currentUser.username).trim().toLowerCase() : '';

    if (!userId && !username) return 'Staff';

    const { data, error } = await supabase
      .from('system_user')
      .select('user_id, username, first_name, last_name, role')
      .limit(1000);

    if (error) throw error;

    const match = (data || []).find((user) => {
      const rowUserId = user?.user_id === null || user?.user_id === undefined ? '' : String(user.user_id).trim();
      const rowUsername = user?.username ? String(user.username).trim().toLowerCase() : '';
      return (userId && rowUserId === userId) || (username && rowUsername === username);
    });

    return match?.role || 'Staff';
  } catch (error) {
    console.warn('Failed to resolve actor role from system_user', error);
    return 'Staff';
  }
};

/**
 * Fetch all audit logs from the audit_trail table with schema fallback
 */
export const fetchAuditLogs = async () => {
  try {
    // Try new schema first
    let result = await supabase
      .from('audit_trail')
      .select('log_id, user_name, user_role, action_performed, affected_module, affected_data, created_at')
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
    const mapped = (data || []).map(log => {
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

        const timeISO = log.created_at ? new Date(log.created_at).toISOString() : null;
          return {
          id: log.log_id,
          time: timeISO ? new Date(timeISO).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : '',
          timeISO,
          user: log.user_name || 'system',
          user_id: log.user_name,
            role: log.user_role || 'N/A',
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

        // For legacy rows, attempt to preserve an ISO timestamp if available in `time`.
        let timeISO = null;
        if (log.time) {
          try {
            timeISO = new Date(log.time).toISOString();
          } catch (e) {
            timeISO = null;
          }
        }

        // For legacy, try extracting user_role from parsed detail
        const legacyRole = parsedDetail?.user_role || parsedDetail?.role || null;

        return {
          id: log.log_id,
          time: log.time || '',
          timeISO,
          user: log.user_id?.toString() || 'system',
          user_id: log.user_id?.toString() || 'system',
          role: legacyRole || 'N/A',
          action: log.action || 'unknown_action',
          changes: parsedDetail,
          statusType: statusType,
          status: log.status
        };
      }
    });

    // Attempt to enrich logs with the user's role from `system_user` when possible.
    try {
        // Fetch system users (expected to be small); build maps for username, id, and full name
        const { data: allUsers } = await supabase
          .from('system_user')
          .select('id, username, first_name, last_name, role')
          .order('user_id', { ascending: true });

        const roleByUsername = new Map();
        const roleById = new Map();
        const roleByFullName = new Map();

        (allUsers || []).forEach(u => {
          const uname = (u.username || '').toString().trim().toLowerCase();
          if (uname) roleByUsername.set(uname, (u.role || 'Staff'));
          if (u.id !== undefined && u.id !== null) roleById.set(String(u.id), (u.role || 'Staff'));
          const full = `${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase();
          if (full) roleByFullName.set(full, (u.role || 'Staff'));
        });

        mapped.forEach(l => {
          // Keep the role already stored on the audit row if present.
          if (l.role && l.role !== 'N/A') return;

          const rawKey = (l.user || '').toString();
          if (!rawKey) { l.role = l.role || 'N/A'; return; }

          const key = rawKey.trim().toLowerCase();

          // Try username match (case-insensitive)
          if (roleByUsername.has(key)) {
            l.role = roleByUsername.get(key);
            return;
          }

          // If the key looks like an email, try the part before @ as username
          if (key.includes('@')) {
            const beforeAt = key.split('@')[0];
            if (roleByUsername.has(beforeAt)) {
              l.role = roleByUsername.get(beforeAt);
              return;
            }
          }

          // Try id match (exact string match)
          if (roleById.has(rawKey) || roleById.has(String(Number(rawKey)))) {
            l.role = roleById.get(rawKey) || roleById.get(String(Number(rawKey)));
            return;
          }

          // Try full name match
          if (roleByFullName.has(key)) {
            l.role = roleByFullName.get(key);
            return;
          }

          // No match found — if user exists in any map by partial token, pick Staff
          // Check if username map contains any key that includes this key as substring
          for (const [uname, roleVal] of roleByUsername) {
            if (uname.includes(key) || key.includes(uname)) {
              l.role = roleVal;
              return;
            }
          }

          l.role = l.role || 'N/A';
        });
    } catch (err) {
      // If enrichment fails, silently continue with logs without roles
      // eslint-disable-next-line no-console
      console.warn('Failed to enrich audit logs with user roles', err);
    }

    return mapped;
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

    // Fetch audit logs to get actor usernames or ids
    const auditResult = await supabase
      .from('audit_trail')
      .select('user_name, user_id')
      .order('user_name', { ascending: true });

    if (auditResult.data) {
      (auditResult.data || []).forEach(log => {
        const userName = (log.user_name || log.user_id || '').trim();
        if (userName && userName.toLowerCase() !== 'system') uniqueUsers.add(userName);
      });
    }

    // Also include all staff usernames from system_user
    const usersResult = await supabase
      .from('system_user')
      .select('username')
      .order('username', { ascending: true });

    if (usersResult.data) {
      (usersResult.data || []).forEach(u => {
        if (u.username) uniqueUsers.add(u.username);
      });
    }

    return ['all users', ...Array.from(uniqueUsers).sort((a, b) => a.localeCompare(b))];
  } catch (error) {
    console.error('Error fetching audit users:', error);
    return ['all admins'];
  }
};
