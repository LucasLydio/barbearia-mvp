const { updateClient } = require('./apiClients.js');
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
    const { client_id, name, telephone, email } = body;

    if (!client_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'client_id é obrigatório' }),
      };
    }

    // Atualiza apenas campos enviados
    const fields = {};
    if (name) fields.name = name;
    if (telephone) fields.telephone = telephone;
    if (email) fields.email = email;
    if (Object.keys(fields).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Nada para atualizar' }),
      };
    }

    const updated = await updateClient(client_id, fields);

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
