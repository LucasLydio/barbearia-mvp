// agendamentos6.js

document.addEventListener('DOMContentLoaded', () => {
  const summaryList = document.getElementById('summary-list');

  
  const whatsappBtn = document.getElementById("confirmBooking");
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", async (e) => {
          
        e.preventDefault(); 

        whatsappBtn.innerHTML = 'Enviando... <i class="bi bi-clock-history ms-2"></i>';
        whatsappBtn.disabled = true;

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

          if (!res.ok) {
            throw new Error('Erro ao finalizar agendamento!');
          } 

          showStep(6);

        } catch (err) {
          alert(err.message || 'Erro ao salvar!');
          whatsappBtn.disabled = false;
          whatsappBtn.innerHTML = `Confirmar <i class="bi bi-check2-circle ms-2"></i>`;
          return false;
        }
    });
  }

  function formatDateBR(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  function updateSummary() {

    // Renderiza os dados no <ul id="summary-list">
    summaryList.innerHTML = `
      <li class="list-group-item"><strong>Serviços:</strong> ${Array.isArray(formData.serviceName) ? formData.serviceName.join(', ') : formData.serviceName}</li>
      <li class="list-group-item"><strong>Data:</strong> ${formatDateBR(formData.date)}</li>
      <li class="list-group-item"><strong>Hora:</strong> ${formData.time}</li>
      <li class="list-group-item"><strong>Barbeiro:</strong> ${formData.barberName || formData.barber}</li>
      <li class="list-group-item"><strong>Nome:</strong> ${formData.clientName}</li>
      <li class="list-group-item"><strong>Telefone:</strong> ${formData.telephone}</li>
      ${formData.note ? `<li class="list-group-item"><strong>Observações:</strong> ${formData.note}</li>` : ''}
    `;
  }


  // Atualiza resumo ao chegar no passo 5
  if (typeof showStep === 'function') {
    const _showStep = showStep;
    window.showStep = function(n) {
      _showStep(n);
      if (n === 5) updateSummary();
    }
  } else {
    updateSummary();
  }
});
