const { createService } = require('./apiServices.js');
require('dotenv').config();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }
  try {
    const body = JSON.parse(event.body);


    if (!body.name || body.price == null) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Campos obrigatórios: name e price' }),
      };
    }

    const service = await createService({
      name: body.name,
      price: body.price,
      duration: body.duration || null 
    });

    return {
      statusCode: 201,
      body: JSON.stringify({ data: service }),
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
