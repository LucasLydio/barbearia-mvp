const { storeClient } = require('./apiClients.js');
require('dotenv').config();

function encodeToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }
  try {
    const body = JSON.parse(event.body);

    // Agora email é obrigatório também!
    if (!body.name || !body.telephone || !body.email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Campos obrigatórios: name, telephone e email' }),
      };
    }

    const client = await storeClient({
      name: body.name,
      telephone: body.telephone,
      email: body.email
    });

    const token = encodeToken({
      id: client.id,
      name: client.name,
      telephone: client.telephone,
      email: client.email
    });

    return {
      statusCode: 201,
      body: JSON.stringify({ data: client, token }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };

  } catch (err) {
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

