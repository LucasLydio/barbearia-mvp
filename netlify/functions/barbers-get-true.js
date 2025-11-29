const { getBarberByTelephoneAndPass } = require('./apiBarbers.js');
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
    const { telephone, password } = event.queryStringParameters || {};
    if (!telephone || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Telefone e senha são obrigatórios' }),
      };
    }

    const barber = await getBarberByTelephoneAndPass(telephone, password);

    if (!barber) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          exists: false,
          barber: null,
          token: null
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    const token = encodeToken({
      id: barber.id,
      name: barber.name,
      telephone: barber.telephone,
      email: barber.email,
      role: barber.role
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        exists: true,
        barber,
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
      body: JSON.stringify({ error: err.message }),
    };
  }
};
