document.addEventListener('DOMContentLoaded', () => {
  const services = [
    { id: 1, name: 'Corte Masculino', price: 50 },
    { id: 2, name: 'Corte Infantil',  price: 40 },
    { id: 3, name: 'Barba',           price: 30 },
    { id: 4, name: 'Combo Corte + Barba', price: 75 }
  ];
  const barbers = ['João', 'Carlos', 'Marcos', 'Rafael'];

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
    ['09:00','10:00','11:00','13:00','14:00','15:00','16:00'].forEach(t => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      timeSelect.appendChild(opt);
    });
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
    if (!phone) return alert('Informe o telefone');
    formData.phone = phone;
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
  function updateSummary() {
    const ul = document.getElementById('summary-list');
    // Serviços + total
    const items = formData.services.map(s =>
      `Serviço: ${s.name} — R$ ${s.price.toFixed(2)}`
    );
    items.push(`Total: R$ ${formData.totalPrice.toFixed(2)}`);
    // Data/hora, barbeiro e telefone
    items.push(`Data/Hora: ${formData.date} ${formData.time}`);
    items.push(`Barbeiro: ${formData.barber}`);
    items.push(`Telefone: ${formData.phone}`);

    ul.innerHTML = items
      .map(txt => `<li class="list-group-item">${txt}</li>`)
      .join('');
  }

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


  // Inicia
  loadTimes();
  renderAppointments();
  showStep(1);
});
