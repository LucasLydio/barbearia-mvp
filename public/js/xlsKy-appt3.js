// js/xlsKy.js

function decodeToken(token) {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

const barberToken = localStorage.getItem('valette_barber_token');
const barberData = barberToken ? decodeToken(barberToken) : null;
const barber_id = barberData?.id;



const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const weekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];


let selectedDate = null;
let loading = true;

let appointments = [ ];

async function fetchAppointmentsMonth(month, year) {

  const startDate = `${year}-${String(month+1).padStart(2,'0')}-01`;
  const endDate = new Date(year, month+1, 0).toISOString().slice(0,10);
// appointments/handler/
  const url = '/.netlify/functions/appointments-get';
  const res = await fetch(url+`?start_date=${startDate}&end_date=${endDate}&limit=200`);
  const { data } = await res.json();
  loading = false;
  return data || [];
}

async function fetchAppointmentsByDay(dateYMD) {
  const url = `/.netlify/functions/appointments-get?date=${dateYMD}&limit=200`;
  const res = await fetch(url);
  const { data } = await res.json();
  return data || [];
}

// Carrega os serviços

async function loadServicesOptions() {
  const url = '/.netlify/functions/services-get?limit=100';
  const res = await fetch(url);
  const { data: services } = await res.json();
  const select = document.getElementById('apptService');
  select.innerHTML = '<option value="">Selecione...</option>';
  (services || []).forEach(s => {
    select.innerHTML += `<option value="${s.id}">${s.name} (${s.price ? `R$ ${Number(s.price).toFixed(2)}` : ''})</option>`;
  });
}

async function loadClientsOptions() {
  const res = await fetch('/.netlify/functions/clients-get?limit=100'); // pode ajustar limite
  const { data: clients } = await res.json();
  const select = document.getElementById('apptClient');
  select.innerHTML = '<option value="">Selecione o cliente...</option>';
  (clients || []).forEach(c => {
    select.innerHTML += `<option value="${c.id}">${c.name} (${c.telephone})</option>`;
  });
}


function getDaysMatrix(month, year) {
  const matrix = [];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  let date = 1 - firstDay;
  for (let i = 0; i < 6; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      let d = new Date(year, month, date);
      week.push({
        date: d,
        isCurrentMonth: d.getMonth() === month
      });
      date++;
    }
    matrix.push(week);
  }
  return matrix;
}

function hasAppointment(d) {
  const ymd = d.toISOString().slice(0,10);
  return appointments.some(a => a.date === ymd);
}

function showLoading(containerId, text = "Carregando...") {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="card border-0  text-center my-4 py-5" style="background: transparent;">
        <div class="fw-bold">
          ${text} 
          <div class="spinner-border text-danger " role="status"></div>
        </div>
      </div>
    `;
  }
}

function hideLoading(containerId) {
  // Esvaziar, ou será preenchido logo em seguida pelo conteúdo real
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}


async function renderCalendar() {

  const weeksContainer = document.getElementById('calendar-weeks');

  showLoading('calendar-weeks', 'Carregando calendário...');

  appointments = await fetchAppointmentsMonth(currentMonth, currentYear);

  document.getElementById('calendarTitle').textContent = `${monthNames[currentMonth]} ${currentYear}`;
  weeksContainer.innerHTML = '';
  const matrix = getDaysMatrix(currentMonth, currentYear);

  matrix.forEach(week => {
    const weekRow = document.createElement('div');
    weekRow.className = 'calendar-week';
    week.forEach(day => {
      const el = document.createElement('span');
      el.className = 'calendar-day';
      if (!day.isCurrentMonth) el.classList.add('not-current-month');
      if (hasAppointment(day.date) && day.isCurrentMonth) el.classList.add('has-appointment');
      if (day.date.toDateString() === today.toDateString()) el.classList.add('today');
      el.textContent = day.date.getDate();
      el.title = hasAppointment(day.date) ? "Ver agendamentos" : "";
      if (day.isCurrentMonth) {
        el.onclick = () => openDayModal(day.date);
      }
      weekRow.appendChild(el);
    });
    weeksContainer.appendChild(weekRow);
  });
}

document.getElementById('prevMonth').onclick = async () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  await renderCalendar();
};

document.getElementById('nextMonth').onclick = async () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  await renderCalendar();
};

async function openDayModal(date) {
  selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const ymd = selectedDate.toISOString().slice(0,10);
  const modal = document.getElementById('dayModal');

  document.getElementById('modalDate').textContent =
    `Agendamentos de ${selectedDate.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}`;

  const appts = await fetchAppointmentsByDay(ymd);
  const ul = document.getElementById('appointmentsList');
  ul.innerHTML = '';



  if (appts.length) {
    appts.forEach(a => {
        
      const serviceNames = (a.appointment_services || [])
        .map(s => s.services?.name)
        .filter(Boolean)
        .join(", ");
        
      ul.innerHTML += `
        <li class="list-group-item">
          <b>${formatTime(a.time)}</b><br>
          Serviço: ${serviceNames || "—"}<br>
          Cliente: ${a.clients?.name || "—"}<br>
          Telefone: ${a.clients?.telephone || "—"}<br>
          Barbeiro: ${a.barbers?.name || "—"}
        </li>
      `;
    });
    document.getElementById('noAppointments').style.display = 'none';
  } else {
    document.getElementById('noAppointments').style.display = '';
  }

  document.getElementById('createForm').style.display = 'none';
  document.getElementById('openCreateForm').style.display = '';
  modal.style.display = 'flex';
}

document.getElementById('closeModal').onclick = () => {
  document.getElementById('dayModal').style.display = 'none';
};

document.getElementById('openCreateForm').onclick = async () => {
  await loadServicesOptions();
  await loadClientsOptions();  
  document.getElementById('createForm').style.display = '';
  document.getElementById('openCreateForm').style.display = 'none';
};


document.getElementById('createForm').onsubmit = async function(e) {
  e.preventDefault();

  tokenBarberId = localStorage.getItem('valette_barber_id') || "";
  
  const ymd = selectedDate.toISOString().slice(0, 10);
  const time = document.getElementById('apptTime').value;
  const clientName = document.getElementById('apptClient').value;
  const note = document.getElementById('apptNote').value;
  const service_id = document.getElementById('apptService').value;
  const client_id = document.getElementById('apptClient').value;



  if (!time || !clientName || !service_id) {
    alert("Preencha o horário, cliente e serviço.");
    return;
  }

  const body = {
    date: ymd,
    time,
    service_id,
    barber_id, 
    client_id,
    note
  };

  const res = await fetch('/.netlify/functions/appointments-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const result = await res.json();

  if (result.error) {
    alert("Erro ao criar agendamento.");
    return;
  }

  await renderCalendar();
  await openDayModal(selectedDate);

  this.reset();
  this.style.display = 'none';
  document.getElementById('openCreateForm').style.display = '';
};



renderCalendar();

document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
});