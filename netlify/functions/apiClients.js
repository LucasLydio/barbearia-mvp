const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Busca todos os clientes, com paginação e filtro opcional por nome
 */
async function getAllClients({ page = 1, limit = 20, name } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to);

  // Filtro opcional por nome (case-insensitive, parcial)
  if (name) query = query.ilike('name', `%${name}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

/**
 * Busca cliente específico pelo id (UUID)
 */
async function getClientById(client_id) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', client_id)
    .single();
  if (error) throw error;
  return data;
}


async function storeClient({ name, telephone, email }) {
  const { data: client, error } = await supabase
    .from('clients')
    .insert([{ name, telephone, email }])
    .select()
    .single();

  if (error) throw error;
  return client;
}


async function updateClient(client_id, { name, telephone, email }) {
  const { data: client, error } = await supabase
    .from('clients')
    .update({ name, telephone, email })
    .eq('id', client_id)
    .select()
    .single();

  if (error) throw error;
  return client;
}


async function deleteClient(client_id) {
  const { data, error } = await supabase
    .from('clients')
    .delete()
    .eq('id', client_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}



async function getClientByTelephone(telephone) {
  const tel = telephone.replace(/\D/g, '');
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, telephone, email')
    .eq('telephone', tel)
    .single();
  if (error || !data) return null;
  return data;
}


module.exports = {
  supabase,
  getAllClients,
  getClientById,
  storeClient,
  updateClient,
  deleteClient,
  getClientByTelephone
};
