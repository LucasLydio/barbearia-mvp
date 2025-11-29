const { getAllBarbers, getBarberById } = require('./apiBarbers.js');
require('dotenv').config();

exports.handler = async function(event, context) {
  try {
    const { barber_id, page, limit, name } = event.queryStringParameters || {};

    // Se veio barber_id, busca 1 específico
    if (barber_id) {
      const data = await getBarberById(barber_id);

      return {
        statusCode: 200,
        body: JSON.stringify({ data }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Senão, lista todos (paginado e filtrado)
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 20;

    const { data, count } = await getAllBarbers({ page: pageInt, limit: limitInt, name });

    return {
      statusCode: 200,
      body: JSON.stringify({ data, count }),
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
