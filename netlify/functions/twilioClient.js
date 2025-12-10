const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendWhatsAppMessage(to, message) {
  const clean = to.replace(/\D/g, ""); 

  console.log('número', clean, process.env.TWILIO_WHATSAPP_NUMBER);
  return client.messages.create({
    from: `whatsapp:+14155238886`, 
    to: `whatsapp:+${clean}`,                
    body: message
  });
}

async function sendSMS(to, message) {
  return client.messages.create({
    from: process.env.TWILIO_SMS_NUMBER,
    to,
    body: message
  });
}

module.exports = {
  sendWhatsAppMessage,
  sendSMS
};
