document.addEventListener('DOMContentLoaded', () => {
  const services = [
    { id: 1, name: 'Penteado', price: 30 },
    { id: 2, name: 'Luzes', price: 80 },
    { id: 3, name: 'Platinado', price: 120 },
    { id: 4, name: 'Progressiva (A partir de)', price: 80 },
    { id: 5, name: 'Selagem', price: 80 },
    { id: 6, name: 'Hidratação', price: 20 },
    { id: 7, name: 'Contorno (Pezinho)', price: 20 },
    { id: 8, name: 'Sobrancelhas', price: 20 },
    { id: 9, name: 'Cabelo', price: 40 },
    { id: 10, name: 'Barba + Barboterapia', price: 40 }
  ];
  const barbers = ['Weberton'];

  let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
  const formData = {};

  const steps = Array.from(document.querySelectorAll('.step'));
  const indicators = Array.from(document.querySelectorAll('.step-indicator'));
  const wizardForm = document.getElementById('wizard-form');

  let currentStep = 1;
  function showStep(n) {
    steps.forEach(s => s.classList.toggle('active', +s.dataset.step === n));
    indicators.forEach((ind, i) =>
      ind.classList.toggle('active', i === n - 1)
    );
    currentStep = n;
  }

  // 1) Popula lista de serviços como checkboxes
  const servicesList = document.getElementById('services-list');
  services.forEach(s => {
    const div = document.createElement('div');
    div.innerHTML = `
      <label class="btn btn-outline-light text-start d-block p-3 rounded-3">
        <input type="checkbox" name="services" value="${s.id}" /> 
        <strong>${s.name}</strong> — R$ ${s.price.toFixed(2)}
      </label>`;
    servicesList.appendChild(div);
  });

  // 2) Popula barbeiros igual antes
  const barbersList = document.getElementById('barbers-list');
  barbers.forEach(b => {
    const div = document.createElement('div');
    div.innerHTML = `
      <label class="btn btn-outline-light text-start d-block p-3 rounded-3">
        <input type="radio" name="barber" value="${b}" /> ${b}
      </label>`;
    barbersList.appendChild(div);
  });

  // Data mínima
  const dateInput = document.getElementById('date');
  dateInput.min = new Date().toISOString().split('T')[0];

  // Preenche horários
  const timeSelect = document.getElementById('time');
function loadTimes() {
  timeSelect.innerHTML = '<option value="">Selecione...</option>';
  // Gera horários de 09:00 até 18:00 com intervalos de 30min
  for (let hour = 9; hour <= 18; hour++) {
    ['00', '30'].forEach(min => {
      const t = `${hour.toString().padStart(2, '0')}:${min}`;
      // Não inclui 18:30 (passaria das 18h)
      if (hour === 18 && min === '30') return;
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      timeSelect.appendChild(opt);
    });
  }
}

  // Navegação: Passo 1 → 2
  document.getElementById('next1').addEventListener('click', () => {
    const checked = Array.from(
      wizardForm.querySelectorAll('input[name="services"]:checked')
    ).map(i => i.value);

    if (!checked.length) {
      return alert('Selecione ao menos um serviço');
    }

    // Armazena array de serviços e calcula total
    formData.services = services.filter(s => checked.includes(s.id.toString()));
    formData.totalPrice = formData.services
      .reduce((sum, s) => sum + s.price, 0);

    showStep(2);
  });

  // Passo 2 → 3
  document.getElementById('next2').addEventListener('click', () => {
    if (!dateInput.value || !timeSelect.value) {
      return alert('Preencha data e hora');
    }
    formData.date = dateInput.value;
    formData.time = timeSelect.value;
    showStep(3);
  });

  // Passo 3 → 4
  document.getElementById('next3').addEventListener('click', () => {
    const sel = wizardForm.barber.value;
    if (!sel) return alert('Escolha um barbeiro');
    formData.barber = sel;
    showStep(4);
  });

  // Passo 4 → 5
  document.getElementById('next4').addEventListener('click', () => {
    const phone = document.getElementById('phone').value.trim();
    const clientName = document.getElementById('clientName').value.trim();
    if (!phone) return alert('Informe o telefone');
    formData.phone = phone;
    if(!clientName) return alert('Informe o seu nome');
    formData.clientName = clientName; 
    updateSummary();
    showStep(5);
  });

  // Botões “Anterior”
  ['prev2','prev3','prev4','prev5'].forEach(id => {
    document.getElementById(id).addEventListener('click', () =>
      showStep(currentStep - 1)
    );
  });

  // Atualiza o resumo no passo 5
  // function updateSummary() {
  //   const ul = document.getElementById('summary-list');
  //   // Serviços + total
  //   const items = formData.services.map(s =>
  //     `Serviço: ${s.name} — R$ ${s.price.toFixed(2)}`
  //   );
  //   items.push(`Total: R$ ${formData.totalPrice.toFixed(2)}`);
  //   // Data/hora, barbeiro e telefone
  //   items.push(`Data/Hora: ${formData.date} ${formData.time}`);
  //   items.push(`Barbeiro: ${formData.barber}`);
  //   items.push(`Telefone: ${formData.phone}`);

  //   ul.innerHTML = items
  //     .map(txt => `<li class="list-group-item">${txt}</li>`)
  //     .join('');
  // }

  // Submete e salva no localStorage
  wizardForm.addEventListener('submit', e => {
    e.preventDefault();
    appointments.push({ ...formData });
    localStorage.setItem('appointments', JSON.stringify(appointments));
    renderAppointments();
    // Reset e volta ao passo 1
    wizardForm.reset();
    loadTimes();
    showStep(1);
  });

// Renderiza lista de agendamentos com múltiplos serviços (compatível com versões antigas)
function renderAppointments() {
  const list = document.getElementById('appointment-list');
  if (!appointments.length) {
    list.innerHTML = `
      <li class="list-group-item text-center text-white-50">
        Nenhum agendamento
      </li>`;
    return;
  }

  list.innerHTML = appointments.map(a => {
    // Se veio de versão antiga, transformamos service em array services
    const servicesArr = a.services || (a.service ? [a.service] : []);
    // Calcula nome dos serviços
    const names = servicesArr.map(s => s.name).join(', ');
    // Calcula total: se já tiver totalPrice, usa; senão soma
    const total = a.totalPrice != null
      ? a.totalPrice
      : servicesArr.reduce((sum, s) => sum + (s.price || 0), 0);

    return `
      <li class="list-group-item bg-transparent text-white-50">
        <strong>${names}</strong><br/>
        Total: R$ ${total.toFixed(2)}<br/>
        ${a.date} ${a.time}<br/>
        Barbeiro: ${a.barber} — Tel: ${a.phone}
      </li>`;
  }).join('');
}

function updateSummary() {
  const ul = document.getElementById('summary-list');

  // 1) Prepara as linhas de serviço
  const serviceLines = formData.services.map(s =>
    `• ${s.name} — R$ ${s.price.toFixed(2)}`
  );

  const [year, month, day] = formData.date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  // 2) Cria um array de seções com label + conteúdo
  const summarySections = [
    { label: '💈 Serviços',   value: serviceLines.join('\n') },
    { label: '💰 Total',      value: `R$ ${formData.totalPrice.toFixed(2)}` },
    { label: '🗓️ Data/Hora',  value: `${formattedDate} às ${formData.time}` },
    { label: '✂️ Barbeiro',    value: formData.barber },
    { label: '📞 Telefone',   value: formData.phone },
  ];

  // 3) Renderiza no HTML, usando <strong> e <br> para respeitar quebras de linha
  ul.innerHTML = summarySections.map(sec => `
    <li class="list-group-item">
      <strong>${sec.label}:</strong><br>
      ${sec.value.replace(/\n/g, '<br>')}
    </li>
  `).join('');

  // ==== BOTÃO WHATSAPP ====
  // 4) Monta array de linhas para o texto do WhatsApp, com markdown (*bold*)
  const waLines = ['*✉️ Pré-Agendamento Valette Barbearia*', ''];

  // 4.1) Saudação personalizada no topo

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
  waLines.push(`Olá, sou *${formData.clientName}* e gostaria de pré-agendar o(s) serviço(s):`);
  waLines.push(''); 

  summarySections.forEach(sec => {
    waLines.push(`*${sec.label}:*`);
    waLines.push(...sec.value.split('\n'));
    waLines.push('');
  });

  const waText = waLines.join('\n');

  // 5) Limpa o telefone e monta a URL
  const telClean = formData.phone.replace(/\D/g, '');
  const waNumber = telClean.startsWith('55') ? telClean : '55' + telClean;
  const waNumber2 = 5562991300232;
  const waNumber3 = 5521983398168;
  const waBtn = document.getElementById('whatsapp-btn');
  waBtn.href = `https://api.whatsapp.com/send?phone=${waNumber2}&text=${encodeURIComponent(waText)}`;
}





  // Inicia
  loadTimes();
  renderAppointments();
  showStep(1);
});
