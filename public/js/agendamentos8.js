  // Monta mensagem para o WhatsApp
  
function formatDateBR(dateStr) {

  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

  function getWhatsappText() {

  const waLines = ['*✉️ Pré-Agendamento Valette Barbearia*', ''];
  waLines.push(`
    Olá, sou ${formData.clientName} agendei o(s) serviço(s): ${Array.isArray(formData.serviceName) ? formData.serviceName.join(', ') : formData.serviceName} para o dia  ${formatDateBR(formData.date)} às ${formData.time}
    `);
  waLines.push('\n');
  waLines.push('*pré-agendamento (R$ 20,00)*'); 
  waLines.push('\n\nCartão 💳: https://cielolink.com.br/4htomi0');
  waLines.push('\n\n Pix ❖: 62991300232');
    if (formData.note) {
        waLines.push(`Observações: ${formData.note}`);
    }
    return `
        ${waLines.join('\n')}
          `
  }