//clients-get-true.js
const { getClientByTelephone } = require('./apiClients.js');
require('dotenv').config();

function encodeToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    
    const { telephone, phone, tel } = event.queryStringParameters || {};
    const telParam = telephone || phone || tel;
    console.log({ query: event.queryStringParameters, telParam });

    if (!telParam) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Telefone é obrigatório' }),
      };
    }

    const client = await getClientByTelephone(telParam);

    if (!client) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          exists: false,
          client: null,
          token: null
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    const token = encodeToken({
      id: client.id,
      name: client.name,
      telephone: client.telephone,
      email: client.email
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        exists: true,
        client,
        token
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
        stack: err.stack,
        received: event.queryStringParameters
      }),
    };
  }
};
