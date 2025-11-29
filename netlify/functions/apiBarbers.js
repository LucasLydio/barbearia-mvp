const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Busca todos os barbeiros, com paginação e filtro opcional por nome
 */
async function getAllBarbers({ page = 1, limit = 20, name } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('barbers')
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
 * Busca barbeiro específico pelo id (UUID)
 */
async function getBarberById(barber_id) {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('id', barber_id)
    .single();
  if (error) throw error;
  return data;
}


async function createBarber({ name, role, email, telephone }) {
  const { data: barber, error } = await supabase
    .from('barbers')
    .insert([{ name, role, email, telephone }])
    .select()
    .single();

  if (error) throw error;
  return barber;
}


async function updateBarber(barber_id, { name, role }) {
  const { data: barber, error } = await supabase
    .from('barbers')
    .update({ name, role })
    .eq('id', barber_id)
    .select()
    .single();

  if (error) throw error;
  return barber;
}


async function deleteBarber(barber_id) {
  const { data, error } = await supabase
    .from('barbers')
    .delete()
    .eq('id', barber_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}


async function getBarberByTelephoneAndPass(telephone, password) {
  const tel = telephone.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('barbers')
    .select('id, name, telephone, email, role')
    .eq('telephone', tel)
    .single();
  if (error || !data) return null;


  if (password !== "123456") return null;

  return data;
}


module.exports = {
  supabase,
  getAllBarbers,
  getBarberById,
  createBarber,
  updateBarber,
  deleteBarber,
  getBarberByTelephoneAndPass
};
