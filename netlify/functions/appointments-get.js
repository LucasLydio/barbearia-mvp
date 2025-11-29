const { getAllAppointments, getAppointmentsByBarber, getAppointmentsByClient } = require('./apiAppointments.js');
require('dotenv').config();

exports.handler = async function(event, context) {
  try {
    // Adicione os novos parâmetros aqui
    const {
      barber_id,
      client_id,
      page,
      limit,
      date,
      client_name, 
      barber_name,
      start_date,   // <-- novo
      end_date      // <-- novo
    } = event.queryStringParameters || {};

    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 100;

    let result;
    if (barber_id) {
      console.log('Filtrando por barber_id:', barber_id);
      result = await getAppointmentsByBarber(barber_id, {
        page: pageInt,
        limit: limitInt,
        date,
        client_name,
        start_date,
        end_date
      });
    } else if (client_id) {
      console.log('Filtrando por client_id:', client_id);
      result = await getAppointmentsByClient(client_id, {
        page: pageInt,
        limit: limitInt,
        date,
        barber_name,
        start_date,
        end_date
      });
    } else {
      console.log('Buscando todos os agendamentos');
      result = await getAllAppointments({
        page: pageInt,
        limit: limitInt,
        start_date,
        end_date,
        date
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.data,
        count: result.count,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (err) {
    console.log({
        error: err.message || 'Erro desconhecido',
        name: err.name,
        stack: err.stack,
        details: err.details || undefined, // alguns libs como supabase retornam err.details
        received: event.body || event.queryStringParameters || null
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || 'Erro desconhecido',
        name: err.name,
        stack: err.stack,
        details: err.details || undefined, // alguns libs como supabase retornam err.details
        received: event.body || event.queryStringParameters || null
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    };
  }
};
