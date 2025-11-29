const { deleteClient } = require('./apiClients.js');
require('dotenv').config();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }
  try {
    let client_id;
    
    if (event.queryStringParameters && event.queryStringParameters.client_id) {
      client_id = event.queryStringParameters.client_id;
    } else if (event.body) {
      const body = JSON.parse(event.body);
      client_id = body.client_id;
    }

    if (!client_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'client_id é obrigatório' }),
      };
    }

    const deleted = await deleteClient(client_id);

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
