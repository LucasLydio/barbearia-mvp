const { createBarber } = require('./apiBarbers.js');
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
    if (!body.name || !body.telephone || !body.email || !body.role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Campos obrigatórios: name, telephone, email e role' }),
      };
    }

    const barber = await createBarber({
      name: body.name,
      telephone: body.telephone,
      email: body.email,
      role: body.role
    });

    const token = encodeToken({
      id: barber.id,
      name: barber.name,
      telephone: barber.telephone,
      email: barber.email,
      role: body.role
    });

    return {
      statusCode: 201,
      body: JSON.stringify({ data: barber, token }),
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

