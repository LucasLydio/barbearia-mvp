  // Monta mensagem para o WhatsApp
  
function formatDateBR(dateStr) {
  // Suporta formato "2025-11-28"
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

  function getWhatsappText() {

  const waLines = ['*✉️ Pré-Agendamento Valette Barbearia*', ''];
  
  waLines.push('Obs: Este é um pré-agendamento. Aguardo confirmação e instruções para pagamento.');

  waLines.push('Cartão 💳 ou Pix ❖ ');
  waLines.push('\n*Finalize seu pré-agendamento realizando o pagamento!*');
  waLines.push('\n Obs: O valor do *pré-agendamento (R$ 20,00)* será descontado no valor total do procedimento. ');
  waLines.push('\n\n*Em caso de imprevisto, reagendamento com a antecedência mínima de 1h*');
  waLines.push('\n*Tolerância de atraso de 15 min*');
  waLines.push('\n*Caso falte, não haverá ressarcimento do valor do agendamento.*');
  waLines.push('\n Após o pagamento via Pix ou link, envie seu comprovante via WhatsApp.');
  waLines.push('\n\nCartão 💳: https://cielolink.com.br/4htomi0');
  waLines.push('\n\n Pix ❖: 62991300232');
  waLines.push('\n*Obrigado!* 🙏');

  waLines.push('\n');
  waLines.push(`Olá, sou ${formData.clientName} e gostaria de pré-agendar o(s) serviço(s):`);
  waLines.push(''); 
  waLines.push(`Serviços: ${Array.isArray(formData.serviceName) ? formData.serviceName.join(', ') : formData.serviceName}`);
    waLines.push(`Data: ${formatDateBR(formData.date)}`);
    waLines.push(`Hora: ${formData.time}`);
    waLines.push(`Barbeiro: ${formData.barberName || formData.barber}`);
    waLines.push(`Nome: ${formData.clientName}`);
    waLines.push(`Telefone: ${formData.telephone}`);
    waLines.push(`Email: ${formData.email}`);
    if (formData.note) {
        waLines.push(`Observações: ${formData.note}`);
    }
    return `
        ${waLines.join('\n')}
          `
  }