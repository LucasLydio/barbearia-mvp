const { deleteBarber } = require('./apiBarbers.js');
require('dotenv').config();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }
  try {
    let barber_id;

    // Pode vir no body ou na query
    if (event.queryStringParameters && event.queryStringParameters.barber_id) {
      barber_id = event.queryStringParameters.barber_id;
    } else if (event.body) {
      const body = JSON.parse(event.body);
      barber_id = body.barber_id;
    }

    if (!barber_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'barber_id é obrigatório' }),
      };
    }

    const deleted = await deleteBarber(barber_id);

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
