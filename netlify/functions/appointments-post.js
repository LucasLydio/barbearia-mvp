const { createAppointment } = require('./apiAppointments.js');
require('dotenv').config();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const body = JSON.parse(event.body);

      if (body.service_id && !Array.isArray(body.service_id)) {
        body.service_id = [body.service_id];
      }

    // Validação simples (pode melhorar!)
    if (!body.date || !body.time || !Array.isArray(body.service_id)|| !body.barber_id || !body.client_id) {
      console.log('Campos obrigatórios faltando:', body);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Campos obrigatórios faltando!' }),
      };
    }

    const appointment = await createAppointment(body);

    return {
      statusCode: 201,
      body: JSON.stringify({ data: appointment }),
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
