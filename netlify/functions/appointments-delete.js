const { deleteAppointment } = require('../apiAppointments.js');
require('dotenv').config();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    // O id pode vir na query string ou no body
    let appointment_id;
    if (event.queryStringParameters && event.queryStringParameters.appointment_id) {
      appointment_id = event.queryStringParameters.appointment_id;
    } else if (event.body) {
      const body = JSON.parse(event.body);
      appointment_id = body.appointment_id;
    }

    if (!appointment_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'appointment_id é obrigatório!' }),
      };
    }

    const deleted = await deleteAppointment(appointment_id);

    return {
      statusCode: 200,
      body: JSON.stringify({ data: deleted }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
