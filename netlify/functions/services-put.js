const { updateService } = require('./apiServices.js');
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
    const { service_id, name, price, duration } = body;

    if (!service_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'service_id é obrigatório' }),
      };
    }

    const fields = {};
    if (name !== undefined) fields.name = name;
    if (price !== undefined) fields.price = price;
    if (duration !== undefined) fields.duration = duration;
    if (Object.keys(fields).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Nada para atualizar' }),
      };
    }

    const updated = await updateService(service_id, fields);

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
