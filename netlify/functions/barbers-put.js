const { updateBarber } = require('./apiBarbers.js');
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
    const { barber_id, name, role } = body;

    if (!barber_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'barber_id é obrigatório' }),
      };
    }
    // Só atualiza campos enviados
    const fields = {};
    if (name) fields.name = name;
    if (role) fields.role = role;
    if (Object.keys(fields).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Nada para atualizar' }),
      };
    }

    const updated = await updateBarber(barber_id, fields);

    return {
      statusCode: 200,
      body: JSON.stringify({ data: updated }),
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
