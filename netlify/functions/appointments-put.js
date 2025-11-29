const { updateAppointment } = require('./apiAppointments.js');
require('dotenv').config();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }
  try {
    const body = JSON.parse(event.body);
    const { appointment_id, date, time, service_id, barber_id, client_id, status, note } = body;

    // Validação básica
    if (!appointment_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'appointment_id é obrigatório!' }),
      };
    }

    const updated = await updateAppointment(appointment_id, { date, time, service_id, barber_id, client_id, status, note });

    return {
      statusCode: 200,
      body: JSON.stringify({ data: updated }),
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
