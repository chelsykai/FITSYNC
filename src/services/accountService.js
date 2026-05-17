import { supabase } from '../lib/supabaseClient';

const logAuditTrail = async (action, userId, accountName, details = {}) => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const actorName = currentUser?.name || currentUser?.username || 'system';

    // Format the affected_data more precisely
    const affectedData = {
      accountId: userId,
      accountName: accountName,
      ...details,
    };

    // Try new schema first
    let result = await supabase.from('audit_trail').insert([{
      user_name: actorName,
      action_performed: action,
      affected_module: 'Accounts',
      affected_data: affectedData,
      created_at: new Date().toISOString(),
    }]);

    // If new schema fails, fallback to legacy schema
    if (result.error) {
      console.log('New schema failed, trying legacy schema...', result.error);
      result = await supabase.from('audit_trail').insert([{
        user_id: actorName,
        action: action,
        detail: JSON.stringify(affectedData),
        time: new Date().toISOString(),
        status: 'success',
      }]);
    }

    if (result.error) {
      throw result.error;
    }
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

const normalizeAccountInput = (accountData) => {
  const firstName = (accountData.firstName || '').trim();
  const lastName = (accountData.lastName || '').trim();
  const username = (accountData.username || accountData.email || '').trim();
  const userIdRaw = accountData.id ?? accountData.user_id;
  const normalizedUserId = userIdRaw === undefined || userIdRaw === null || userIdRaw === ''
    ? null
    : String(userIdRaw).trim();

  return {
    userId: normalizedUserId,
    firstName,
    lastName,
    username,
    role: accountData.role || 'Staff',
    status: accountData.status || 'active',
    password: accountData.password || ''
  };
};

const generateYearRandomUserId = () => {
  const year = String(new Date().getFullYear());
  const digitLength = Math.random() < 0.5 ? 3 : 4;
  const min = digitLength === 3 ? 100 : 1000;
  const max = digitLength === 3 ? 999 : 9999;
  const randomDigits = Math.floor(Math.random() * (max - min + 1)) + min;
  return `${year}${randomDigits}`;
};

const isUserIdAvailable = async (userId) => {
  const { data, error } = await supabase
    .from('system_user')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return !data;
};

const resolveUniqueUserId = async (preferredId) => {
  if (preferredId && (await isUserIdAvailable(preferredId))) {
    return preferredId;
  }

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = generateYearRandomUserId();
    if (await isUserIdAvailable(candidate)) {
      return candidate;
    }
  }

  throw new Error('Failed to generate a unique Staff ID. Please try again.');
};

/**
 * Fetch all user accounts from the system_user table
 */
export const fetchAccounts = async () => {
  try {
    const { data, error } = await supabase
      .from('system_user')
      .select('user_id, first_name, last_name, username, password, status, role')
      .order('user_id', { ascending: true });

    if (error) throw error;

    // Transform the data to match the component's expected structure
    return (data || []).map(user => ({
      id: user.user_id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'N/A',
      email: user.username || 'N/A', // Use username as identifier in UI
      role: user.role || 'Staff',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || '',
      status: user.status || 'active'
    }));
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

/**
 * Add a new user account to the system_user table
 */
export const addAccount = async (accountData) => {
  try {
    const normalized = normalizeAccountInput(accountData);
    const userId = await resolveUniqueUserId(normalized.userId);

    const { data, error } = await supabase
      .from('system_user')
      .insert([
        {
          user_id: userId,
          first_name: normalized.firstName,
          last_name: normalized.lastName,
          username: normalized.username,
          password: normalized.password, // Password should be hashed on backend ideally
          role: normalized.role,
          status: normalized.status
        }
      ])
      .select();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Staff ID already exists. Please try again.');
      }
      throw error;
    }

    // Transform the returned data
    const user = data[0];
    const result = {
      id: user.user_id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'N/A',
      email: user.username,
      role: user.role,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || '',
      status: user.status || 'active'
    };

    await logAuditTrail('Created account', user.user_id, result.name, {
      username: user.username,
      role: user.role,
    });

    return result;
  } catch (error) {
    console.error('Error adding account:', error);
    throw error;
  }
};

/**
 * Update an existing user account in the system_user table
 */
export const updateAccount = async (accountId, accountData) => {
  try {
    // Fetch old data first to capture changes
    const { data: oldData, error: fetchError } = await supabase
      .from('system_user')
      .select('first_name, last_name, username, role, status')
      .eq('user_id', accountId)
      .single();

    if (fetchError) throw fetchError;

    const normalized = normalizeAccountInput(accountData);
    const updateData = {
      first_name: normalized.firstName,
      last_name: normalized.lastName,
      username: normalized.username,
      role: normalized.role,
      status: normalized.status
    };

    // Only include password if it's provided and not empty
    if (normalized.password) {
      updateData.password = normalized.password;
    }

    const { data, error } = await supabase
      .from('system_user')
      .update(updateData)
      .eq('user_id', accountId)
      .select();

    if (error) throw error;

    // Transform the returned data
    const user = data[0];
    const result = {
      id: user.user_id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'N/A',
      email: user.username,
      role: user.role,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || '',
      status: user.status || 'active'
    };

    // Capture what changed
    const changes = {};
    const oldFullName = `${oldData.first_name || ''} ${oldData.last_name || ''}`.trim();
    const newFullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    
    if (oldFullName !== newFullName) {
      changes.name = { old: oldFullName, new: newFullName };
    }
    if (oldData.username !== normalized.username) {
      changes.username = { old: oldData.username, new: normalized.username };
    }
    if (oldData.role !== normalized.role) {
      changes.role = { old: oldData.role, new: normalized.role };
    }

    await logAuditTrail('Updated account', user.user_id, result.name, changes);

    return result;
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
};

/**
 * Delete a user account from the system_user table
 */
export const deleteAccount = async (accountId, accountData = {}) => {
  try {
    const { error } = await supabase
      .from('system_user')
      .delete()
      .eq('user_id', accountId);

    if (error) throw error;
    await logAuditTrail('Deleted account', accountId, accountData.name || '', {
      username: accountData.email || accountData.username || '',
      role: accountData.role || '',
    });  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};
