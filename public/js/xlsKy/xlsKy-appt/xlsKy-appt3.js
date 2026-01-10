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
const role = barberData?.role;



const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const weekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];


let selectedDate = null;
let loading = true;

let appointments = [ ];


function formatLocalDate(dateObj) {
  return dateObj.getFullYear() + "-" + String(dateObj.getMonth()+1).padStart(2,"0") + "-" + String(dateObj.getDate()).padStart(2,"0");
}


function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function fetchAppointmentsMonth(month, year) {
  const startDate = `${year}-${String(month + 1).padStart(2,'0')}-01`;
  const endDate = ymdLocal(new Date(year, month + 1, 0));

  const limit = 300;        
  let page = 1;
  let all = [];

  while (true) {
    const url =
      `/.netlify/functions/appointments-get` +
      `?barber_id=${encodeURIComponent(barber_id)}` +   
      `&start_date=${startDate}&end_date=${endDate}` +
      `&page=${page}&limit=${limit}`;

    const res = await fetch(url);
    const { data } = await res.json();

    const batch = data || [];
    all = all.concat(batch);

    if (batch.length < limit) break; // no more pages
    page++;
    if (page > 50) break; // safety guard
  }

  return all;
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

  const appts = await fetchAppointmentsMonth(currentMonth, currentYear);

  // Set of days that have appointments
  const daysWithAppt = new Set(appts.map(a => a.date)); // expecting 'YYYY-MM-DD'

  document.getElementById('calendarTitle').textContent =
    `${monthNames[currentMonth]} ${currentYear}`;
  weeksContainer.innerHTML = '';

  const matrix = getDaysMatrix(currentMonth, currentYear);

  matrix.forEach(week => {
    const weekRow = document.createElement('div');
    weekRow.className = 'calendar-week';

    week.forEach(day => {
      const el = document.createElement('span');
      el.className = 'calendar-day';

      const ymd = ymdLocal(day.date);

      if (!day.isCurrentMonth) el.classList.add('not-current-month');
      if (day.isCurrentMonth && daysWithAppt.has(ymd)) el.classList.add('has-appointment');
      if (day.date.toDateString() === new Date().toDateString()) el.classList.add('today');

      el.textContent = day.date.getDate();
      el.title = daysWithAppt.has(ymd) ? "Ver agendamentos" : "";

      if (day.isCurrentMonth) el.onclick = () => openDayModal(day.date);

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

async function loadBarbersOptionsForOwner() {
  const select = document.getElementById('apptBarber');
  if (!select) return;

  select.innerHTML = `<option value="">Carregando barbeiros...</option>`;

  // pega muitos de uma vez (simples e bom pro MVP)
  // se quiser paginar depois, a gente troca para um picker igual ao de clientes
  const page = 1;
  const limit = 200;

  const url = `/.netlify/functions/barbers-get?page=${page}&limit=${limit}`;
  const res = await fetch(url);
  const json = await res.json();

  const barbers = json?.data || [];
  if (!barbers.length) {
    select.innerHTML = `<option value="">Nenhum barbeiro encontrado</option>`;
    return;
  }

  select.innerHTML = `<option value="">Selecione o barbeiro...</option>` + barbers
    .map(b => `<option value="${b.id}">${b.name}</option>`)
    .join('');
}

function setBarberSelectVisibility(role) {
  const barberSelect = document.getElementById('apptBarber');
  const hint = document.getElementById('apptBarberHint');
  if (!barberSelect) return;

  const isColab = String(role || '').trim().toLowerCase() === 'colaborador';

  // Colaborador: não escolhe barber, usa o do token
  barberSelect.disabled = isColab;
  barberSelect.closest('.mb-2') && (barberSelect.closest('.mb-2').style.display = isColab ? 'none' : '');
  if (hint) hint.style.display = isColab ? '' : 'none';
}



document.getElementById('openCreateForm').onclick = async () => {
  await loadServicesOptions();

  ClientPicker.init({
    searchId: "apptClientSearch",
    listId: "apptClientList",
    paginationId: "apptClientPagination",
    hiddenId: "apptClientId",
    selectedNameId: "selectedClientName",
    selectedTelId: "selectedClientTel",
    badgeId: "selectedClientBadge",
  });

  // role vem do token (você já tem no controll.js)
  setBarberSelectVisibility(role);

  // Só o dono precisa carregar lista de barbeiros
  const isOwner = String(role || '').trim().toLowerCase() === 'dono';
  if (isOwner) {
    await loadBarbersOptionsForOwner();
  }



  document.getElementById('createForm').style.display = '';
  document.getElementById('openCreateForm').style.display = 'none';
};

document.getElementById('createForm').onsubmit = async function(e) {
  e.preventDefault();

  const ymd = selectedDate.toISOString().slice(0, 10);
  const time = document.getElementById('apptTime').value;
  const note = document.getElementById('apptNote').value;
  const service_id = document.getElementById('apptService').value;
  const client_id = document.getElementById('apptClientId').value;

  const isOwner = String(role || '').trim().toLowerCase() === 'owner';

  // ✅ owner escolhe no select, colaborador usa o barber_id do token
  const selectedBarberId = isOwner
    ? document.getElementById('apptBarber')?.value
    : barber_id;

  if (!time || !client_id || !service_id) {
    alert("Preencha o horário, cliente e serviço.");
    return;
  }

  if (isOwner && !selectedBarberId) {
    alert("Selecione o barbeiro.");
    return;
  }

  const body = {
    date: ymd,
    time,
    service_id,
    barber_id: selectedBarberId,
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
    alert(result.error || "Erro ao criar agendamento.");
    return;
  }

  await renderCalendar();
  await openDayModal(selectedDate);

  this.reset();
  this.style.display = 'none';
  document.getElementById('openCreateForm').style.display = '';
};


document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();

  const role = (barberData?.role || '').trim().toLowerCase();
  console.log(role)

  // esconde tudo que está dentro de #owner
  const ownerEl = document.getElementById('owner');
  if (ownerEl && role === 'colaborador') {
    ownerEl.style.display = 'none';
  }
});