const { getAllServices, getServiceById } = require('./apiServices.js');
require('dotenv').config();

exports.handler = async function(event, context) {
  try {
    const { service_id, page, limit, name } = event.queryStringParameters || {};

    // Busca por ID
    if (service_id) {
      const data = await getServiceById(service_id);
      return {
        statusCode: 200,
        body: JSON.stringify({ data }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Listagem paginada/filtrada
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 20;

    const { data, count } = await getAllServices({ page: pageInt, limit: limitInt, name });

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
