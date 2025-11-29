const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Busca todos os serviços, com paginação e filtro opcional por nome
 */
async function getAllServices({ page = 1, limit = 20, name } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('services')
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
 * Busca serviço específico pelo id (UUID)
 */
async function getServiceById(service_id) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', service_id)
    .single();
  if (error) throw error;
  return data;
}

async function createService({ name, price, duration }) {
  const { data: service, error } = await supabase
    .from('services')
    .insert([{ name, price, duration }])
    .select()
    .single();

  if (error) throw error;
  return service;
}

async function updateService(service_id, { name, price, duration }) {
  const { data: service, error } = await supabase
    .from('services')
    .update({ name, price, duration })
    .eq('id', service_id)
    .select()
    .single();

  if (error) throw error;
  return service;
}

async function deleteService(service_id) {
  const { data, error } = await supabase
    .from('services')
    .delete()
    .eq('id', service_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}


module.exports = {
  supabase,
  getAllServices,
  createService,
  getServiceById,
  updateService,
  deleteService

};
