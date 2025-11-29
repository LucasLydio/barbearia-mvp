// netlify/functions/appointments/apiAppointments.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Index geral, com paginação (page, limit)
async function getAllAppointments({ page = 1, limit = 10, date }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('appointments')
    .select(`
      *,
      barbers(name),
      clients(name, telephone),
      appointment_services (
        id,
        service_id,
        services (
          name,
          price,
          duration
        )
      )
    `, { count: 'exact' })
    .order('date', { ascending: true })
    .order('time', { ascending: true })
    .range(from, to);

  if (date) query = query.eq('date', date);

  const { data, error, count } = await query;

  if (error) throw error;
  return { data, count };
}


// Index filtrando por barbeiro, com paginação
async function getAppointmentsByBarber(barber_id, { page = 1, limit = 10, date, client_name }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('appointments')
    .select(`
      *,
      barbers(name),
      clients(name, telephone),
      appointment_services (
        id,
        service_id,
        services (
          name,
          price,
          duration
        )
      )
    `, { count: 'exact' })
    .eq('barber_id', barber_id)
    .order('date', { ascending: true })
    .range(from, to);

  if (date) query = query.eq('date', date);

  console.log('datate filter:', date);

  if (client_name) query = query.ilike('clients.name', `%${client_name}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}



// Index filtrando por cliente, com paginação
async function getAppointmentsByClient(client_id, { page = 1, limit = 10, date, barber_name }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  console.log('Filtering appointments for client_id:', client_id);

  let query = supabase
    .from('appointments')
    .select(`
      *,
      barbers(name),
      clients(name, telephone),
      appointment_services (
        id,
        service_id,
        services (
          name,
          price,
          duration
        )
      )
    `, { count: 'exact' })
    .eq('client_id', client_id)
    .order('date', { ascending: false })   // Ordem decrescente (mais recente primeiro)
    .order('time', { ascending: true })   // (Opcional) Mais recente no dia primeiro
    .range(from, to);

  if (date) query = query.eq('date', date);

  // Filtrar por nome do barbeiro (case-insensitive, parcial)
  if (barber_name) query = query.ilike('barbers.name', `%${barber_name}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

async function createAppointment({ date, time, service_id, barber_id, client_id, note = "" }) {
  // 1. Cria o appointment (sem service_id)
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert([{
      date,
      time,
      barber_id,
      client_id,
      note
    }])
    .select()
    .single();

  if (error) throw error;

  // 2. Registra cada serviço selecionado na tabela N:N
  if (Array.isArray(service_id)) {
    const serviceRecords = service_id.map(sId => ({
      appointment_id: appointment.id,
      service_id: sId
    }));

    const { error: errorServices } = await supabase
      .from('appointment_services')
      .insert(serviceRecords);

    if (errorServices) throw errorServices;
  }

  // 3. Cria vínculo em appointment_barber
  const { error: errorBarber } = await supabase
    .from('appointment_barber')
    .insert([{ appointment_id: appointment.id, barber_id }]);
  if (errorBarber) throw errorBarber;

  // 4. Cria vínculo em appointment_client
  const { error: errorClient } = await supabase
    .from('appointment_client')
    .insert([{ appointment_id: appointment.id, client_id }]);
  if (errorClient) throw errorClient;

  // 5. Cria (se não existir) vínculo em client_barber
  const { data: existing, error: errorExisting } = await supabase
    .from('client_barber')
    .select('id')
    .eq('barber_id', barber_id)
    .eq('client_id', client_id)
    .maybeSingle();

  if (!existing) {
    const { error: errorCB } = await supabase
      .from('client_barber')
      .insert([{ barber_id, client_id }]);

    if (errorCB) throw errorCB;
  }

  return appointment;
}


async function updateAppointment(appointment_id, { date, time, service_id, barber_id, client_id, status, note }) {
  // Atualiza os dados do appointment
  const { error: errorUpdate } = await supabase
    .from('appointments')
    .update({
      date,
      time,
      barber_id,
      client_id,
      status,
      note
    })
    .eq('id', appointment_id);

  if (errorUpdate) throw errorUpdate;

  // Atualiza os serviços do agendamento
  // 1. Remove os vínculos antigos
  const { error: errorDelete } = await supabase
    .from('appointment_services')
    .delete()
    .eq('appointment_id', appointment_id);

  if (errorDelete) throw errorDelete;

  // 2. Adiciona os novos vínculos
  if (Array.isArray(service_id) && service_id.length > 0) {
    const servicesToInsert = service_id.map(sid => ({
      appointment_id,
      service_id: sid,
    }));
    const { error: errorInsert } = await supabase
      .from('appointment_services')
      .insert(servicesToInsert);

    if (errorInsert) throw errorInsert;
  }

  return { success: true };
}


async function deleteAppointment(appointment_id) {
  // 1. Remove vínculos em appointment_barber
  await supabase
    .from('appointment_barber')
    .delete()
    .eq('appointment_id', appointment_id);

  // 2. Remove vínculos em appointment_client
  await supabase
    .from('appointment_client')
    .delete()
    .eq('appointment_id', appointment_id);

  // 3. Remove o appointment principal
  const { data, error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointment_id)
    .select()
    .single();
  if (error) throw error;

  // Não remove client_barber (pois pode haver outros vínculos)
  return data;
}




// Exporta funções para possíveis testes/unitários
module.exports = {
  supabase,
  getAllAppointments,
  getAppointmentsByBarber,
  getAppointmentsByClient,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
