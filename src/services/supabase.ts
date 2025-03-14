import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

// Define types for our data
export interface Group {
  id: number;
  name: string;
  group_id: number;
  chouse: boolean;
}

// Functions to interact with Supabase
export const fetchGroups = async (): Promise<Group[]> => {
  const { data, error } = await supabase
    .from('groups')
    .select('*');
  
  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
  
  return data || [];
};

export const updateGroupChouse = async (id: number, chouse: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('groups')
    .update({ chouse })
    .eq('id', id);
  
  if (error) {
    console.error('Error updating group:', error);
    return false;
  }
  
  return true;
};

export const updateAllGroupsChouse = async (chouse: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('groups')
    .update({ chouse })
    .neq('id', 0); // Update all records
  
  if (error) {
    console.error('Error updating all groups:', error);
    return false;
  }
  
  return true;
};

// Function to delete one or multiple groups by ID
export const deleteGroups = async (ids: number[]): Promise<boolean> => {
  const { error } = await supabase
    .from('groups')
    .delete()
    .in('id', ids);
  
  if (error) {
    console.error('Error deleting groups:', error);
    return false;
  }
  
  return true;
};
