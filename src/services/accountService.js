import { supabase } from '../lib/supabaseClient';

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
    const { data, error } = await supabase
      .from('system_user')
      .insert([
        {
          first_name: accountData.firstName || '',
          last_name: accountData.lastName || '',
          username: accountData.username || '',
          password: accountData.password || '', // Password should be hashed on backend ideally
          role: accountData.role || 'Staff',
          status: accountData.status || 'active'
        }
      ])
      .select();

    if (error) throw error;

    // Transform the returned data
    const user = data[0];
    return {
      id: user.user_id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'N/A',
      email: user.username,
      role: user.role,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || '',
      status: user.status || 'active'
    };
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
    const updateData = {
      first_name: accountData.firstName || '',
      last_name: accountData.lastName || '',
      username: accountData.username || '',
      role: accountData.role,
      status: accountData.status || 'active'
    };

    // Only include password if it's provided and not empty
    if (accountData.password) {
      updateData.password = accountData.password;
    }

    const { data, error } = await supabase
      .from('system_user')
      .update(updateData)
      .eq('user_id', accountId)
      .select();

    if (error) throw error;

    // Transform the returned data
    const user = data[0];
    return {
      id: user.user_id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'N/A',
      email: user.username,
      role: user.role,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || '',
      status: user.status || 'active'
    };
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
};

/**
 * Delete a user account from the system_user table
 */
export const deleteAccount = async (accountId) => {
  try {
    const { error } = await supabase
      .from('system_user')
      .delete()
      .eq('user_id', accountId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};
