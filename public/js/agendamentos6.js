// agendamentos6.js

document.addEventListener('DOMContentLoaded', () => {
  const summaryList = document.getElementById('summary-list');
  const whatsappBtn = document.getElementById('whatsapp-btn');

  // Exibir resumo no Passo 5
  function updateSummary() {

    // Renderiza os dados no <ul id="summary-list">
    summaryList.innerHTML = `
      <li class="list-group-item"><strong>Serviços:</strong> ${Array.isArray(formData.serviceName) ? formData.serviceName.join(', ') : formData.serviceName}</li>
      <li class="list-group-item"><strong>Data:</strong> ${formData.date}</li>
      <li class="list-group-item"><strong>Hora:</strong> ${formData.time}</li>
      <li class="list-group-item"><strong>Barbeiro:</strong> ${formData.barberName || formData.barber}</li>
      <li class="list-group-item"><strong>Nome:</strong> ${formData.clientName}</li>
      <li class="list-group-item"><strong>Telefone:</strong> ${formData.telephone}</li>
      <li class="list-group-item"><strong>Email:</strong> ${formData.email}</li>
      ${formData.note ? `<li class="list-group-item"><strong>Observações:</strong> ${formData.note}</li>` : ''}
    `;
  }



  // Configura link do WhatsApp e salva agendamento ao clicar
  whatsappBtn.onclick = async (e) => {
    // Impede múltiplos envios rápidos
    whatsappBtn.disabled = true;
    whatsappBtn.innerHTML = 'Enviando... <i class="bi bi-clock-history ms-2"></i>';

    // 1. Salva o agendamento via API
    try {
      const payload = {
        service_id: Array.isArray(formData.service)
          ? formData.service
          : [formData.service]
        , 
        date: formData.date,
        time: formData.time,
        barber_id: formData.barber,
        client_id: formData.clientId,
        note: formData.note || '',
        phone: 55 + formData.telephone || 0,
      };

      console.log('Enviando payload para salvar agendamento:', payload);

      const res = await fetch('/.netlify/functions/appointments-post', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Erro ao salvar agendamento!');

      // 2. Monta link do WhatsApp e abre (como antes)
      const waNumber = '5562991300232'; // Substitua pelo número do salão
      const waText = getWhatsappText();
      whatsappBtn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
      whatsappBtn.target = '_blank';
      whatsappBtn.rel = 'noopener';

      // Opcional: pode abrir automaticamente
      if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = whatsappBtn.href;
      } else {
        window.open(whatsappBtn.href, '_blank');
      }

      // Volta botão ao normal
      whatsappBtn.disabled = false;
      whatsappBtn.innerHTML = `<i class="bi bi-whatsapp me-2"></i>Enviar pelo WhatsApp`;
      // popup agendamento concluído

      formData = {}; // limpa formData após envio
      window.location.reload();
      showStep(1); // volta ao passo 1 ou outro comportamento desejado

    } catch (err) {
      alert(err.message || 'Erro ao salvar!');
      whatsappBtn.disabled = false;
      whatsappBtn.innerHTML = `<i class="bi bi-whatsapp me-2"></i>Enviar pelo WhatsApp`;
      e.preventDefault(); // não envia WhatsApp se erro
      return false;
    }
  };

  // Atualiza resumo ao chegar no passo 5
  if (typeof showStep === 'function') {
    const _showStep = showStep;
    window.showStep = function(n) {
      _showStep(n);
      if (n === 5) updateSummary();
    }
  } else {
    // Ou, rode updateSummary se já está no passo 5
    updateSummary();
  }
});
