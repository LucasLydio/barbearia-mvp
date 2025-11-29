const { deleteService } = require('./apiServices.js');
require('dotenv').config();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }
  try {
    let service_id;

    if (event.queryStringParameters && event.queryStringParameters.service_id) {
      service_id = event.queryStringParameters.service_id;
    } else if (event.body) {
      const body = JSON.parse(event.body);
      service_id = body.service_id;
    }

    if (!service_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'service_id é obrigatório' }),
      };
    }

    const deleted = await deleteService(service_id);

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
