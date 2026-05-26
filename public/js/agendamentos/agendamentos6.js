// agendamentos6.js

document.addEventListener('DOMContentLoaded', () => {
  const summaryList = document.getElementById('summary-list');

  function timeToMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== 'string') return NaN;
    const [hStr, mStr] = hhmm.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
    return h * 60 + m;
  }

  function sortTimes(times) {
    return [...times].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  }

  function isConsecutivePair(times) {
    if (!Array.isArray(times) || times.length !== 2) return false;
    const [t1, t2] = sortTimes(times);
    const m1 = timeToMinutes(t1);
    const m2 = timeToMinutes(t2);
    return Number.isFinite(m1) && Number.isFinite(m2) && (m2 - m1 === 30);
  }

  function getArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value === null || value === undefined || value === '') return [];
    return [value];
  }

  
  const whatsappBtn = document.getElementById("confirmBooking");
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", async (e) => {
          
        e.preventDefault(); 

        whatsappBtn.innerHTML = 'Enviando... <i class="bi bi-clock-history ms-2"></i>';
        whatsappBtn.disabled = true;

        try {
          const services = getArray(formData.service);
          const times = getArray(formData.time);
          const isMultiService = services.length > 1;

          const basePayload = {
            service_id: services,
            date: formData.date,
            barber_id: formData.barber,
            client_id: formData.clientId,
            note: formData.note || '',
            phone: formData.telephone ? `55${formData.telephone}` : 0,
          };

          let payloads = [];
          if (isMultiService) {
            if (times.length !== 2 || !isConsecutivePair(times)) {
              throw new Error('Escolha dois horarios consecutivos (ex: 10:00 e 10:30).');
            }
            payloads = sortTimes(times).map((t) => ({ ...basePayload, time: t }));
          } else {
            if (times.length !== 1) {
              throw new Error('Escolha um horario disponivel.');
            }
            payloads = [{ ...basePayload, time: times[0] }];
          }

          console.log('Enviando payload(s) para salvar agendamento:', payloads);

          for (let i = 0; i < payloads.length; i++) {
            const payload = payloads[i];
            const res = await fetch('/.netlify/functions/appointments-post', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (!res.ok) {
              const suffix = payloads.length > 1 ? ` (parte ${i + 1}/${payloads.length})` : '';
              throw new Error(`Erro ao finalizar agendamento${suffix}!`);
            }
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
      <li class="list-group-item"><strong>Hora:</strong> ${Array.isArray(formData.time) ? formData.time.join(' e ') : formData.time}</li>
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
