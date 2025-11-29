let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let currentDay = today.getDate();

let agendamentos = [];

async function fetchAppointmentsByDay(dateYMD) {
  const url = `/.netlify/functions/appointments-get?date=${dateYMD}&limit=200`;
  const res = await fetch(url);
  const { data } = await res.json();
  return data || [];
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [hh, mm] = timeStr.split(':');
  return `${hh}:${mm}`;
}

async function carregarAgendamentosDia(dateYMD) {
  agendamentos = await fetchAppointmentsByDay(dateYMD);
  renderBookings(); // <- AQUI É CERTO
}

// Filtros
const bookingsList = document.getElementById('bookingsList');
const filterName = document.getElementById('filterName');
const filterDate = document.getElementById('filterDate');

// Data padrão = hoje
filterDate.value = new Date().toISOString().slice(0,10);

function renderBookings() {
  const nameTerm = filterName.value.toLowerCase();
  const dateTerm = filterDate.value;

  // Filtra só pelo nome e data
  const filtrados = agendamentos.filter(ag =>
    (ag.clients?.name?.toLowerCase() || "").includes(nameTerm) &&
    ag.date === dateTerm
  );

  // Separa manhã, tarde e cancelados
  const manha = [];
  const tarde = [];
  const cancelados = [];

  filtrados.forEach(ag => {
    if ((ag.status || '').toLowerCase() === 'cancelado') {
      cancelados.push(ag);
    } else {
      const [h] = (ag.time || '').split(':').map(Number);
      if (h < 12) {
        manha.push(ag);
      } else {
        tarde.push(ag);
      }
    }
  });

  // Renderiza manhã
  const manhaDiv = document.getElementById('manhã');
  manhaDiv.innerHTML = manha.length
    ? manha.map(renderBookingCard).join('')
    : '<div class="text-muted py-2">Nenhum agendamento pela manhã.</div>';

  // Renderiza tarde
  const tardeDiv = document.getElementById('tarde');
  tardeDiv.innerHTML = tarde.length
    ? tarde.map(renderBookingCard).join('')
    : '<div class="text-muted py-2">Nenhum agendamento à tarde.</div>';

  // Renderiza cancelados
  const canceladosDiv = document.getElementById('cancelados');
  canceladosDiv.innerHTML = cancelados.length
    ? cancelados.map(renderBookingCard).join('')
    : '<div class="text-muted py-2">Nenhum agendamento cancelado.</div>';
}

// Função auxiliar para card de agendamento
function renderBookingCard(ag) {
  const servicos = (ag.appointment_services || [])
    .map(as => as.services?.name)
    .filter(Boolean)
    .join(", ");

  return `
    <div class="booking-card d-flex align-items-center justify-content-between mb-3 shadow-sm border rounded-3 px-3 py-3" data-id="${ag.id}">
      <div class="d-flex align-items-center gap-3">
        <div class="icon bg-secondary text-white d-flex align-items-center justify-content-center rounded-circle" 
            style="width:48px;height:48px;font-size:1.7rem;">
          <i class="bi bi-person"></i>
        </div>
        <div>
          <div class="fw-bold fs-6">${ag.clients?.name || "—"}</div>
          <div class="small text-muted">${servicos}</div>
          <span class="badge bg-${getStatusColor(ag.status)} mt-1">${ag.status || 'Aguardando'}</span>
        </div>
      </div>
      <div class="d-flex flex-column align-items-end gap-2">
        <span class="fw-semibold fs-5">${formatTime(ag.time)}</span>
        <div class="d-flex flex-wrap gap-3 justify-content-end">
          <button class="btn btn-outline-dark btn-sm " data-action="edit" data-id="${ag.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
          <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${ag.id}" title="Deletar"><i class="bi bi-trash3  "></i></button>
        </div>
      </div>
    </div>
  `;
}


function getStatusColor(status) {
  switch (status) {
    case "Confirmado": return "success";
    case "Aguardando": return "warning";
    case "Cancelado": return "danger";
    default: return "secondary";
  }
}

bookingsList.onclick = async function(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === 'edit') {
    const ag = agendamentos.find(x => x.id === id);
    if (ag) openEditAppointmentModal(ag);
  }

  if (action === 'delete') {
    if (confirm('Tem certeza que deseja deletar este agendamento?')) {
      const res = await fetch('/.netlify/functions/appointments-delete', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ appointment_id: id })
      });
      const { error } = await res.json();
      if (error) {
        alert('Erro ao deletar agendamento!');
      } else {
        alert('Agendamento removido!');
        carregarAgendamentosDia(filterDate.value); // recarrega lista
      }
    }
  }
};

function openEditAppointmentModal(ag) {
  document.getElementById('editAppointmentId').value = ag.id;
  document.getElementById('editAppointmentClient').value = ag.clients?.name || "—";
  document.getElementById('editAppointmentClientId').value = ag.clients?.id || "";
  document.getElementById('editAppointmentService').value = (ag.appointment_services || [])
    .map(as => as.services?.name).filter(Boolean).join(", "); 
  document.getElementById('editAppointmentServiceId').value = (ag.appointment_services || [])
    .map(as => as.service_id).filter(Boolean).join(", "); 
  document.getElementById('editAppointmentDate').value = ag.date;
  document.getElementById('editAppointmentTime').value = ag.time;
  document.getElementById('editAppointmentStatus').value = ag.status || "Aguardando";

  document.getElementById('editAppointmentModal').style.display = 'flex';
}

document.getElementById('closeEditAppointmentModal').onclick = () => {
  document.getElementById('editAppointmentModal').style.display = 'none';
}

document.getElementById('editAppointmentForm').onsubmit = async function(e) {
  e.preventDefault();
  const appointment_id = document.getElementById('editAppointmentId').value;
  const date = document.getElementById('editAppointmentDate').value;
  const time = document.getElementById('editAppointmentTime').value;
  const status = document.getElementById('editAppointmentStatus').value;
  const services = document.getElementById('editAppointmentServiceId')?.value;

  let service_id = [];

  const barber_id = document.getElementById('editAppointmentBarber')?.value;

  const client_id = document.getElementById('editAppointmentClientId')?.value;

  const payload = {
    appointment_id, date, time, status
  };
  if (barber_id) payload.barber_id = barber_id;
  if (client_id) payload.client_id = client_id;

  const serviceInputs = document.querySelectorAll('input[name="serviceEdit[]"]:checked');
  if(services.length === 0 && serviceInputs.length === 0) {
    alert("Nenhum serviço selecionado.");
    return false;
  }
  else if(serviceInputs.length > 0) {
    service_id = Array.from(serviceInputs).map(i => i.value);
    payload.service_id = service_id;
    console.log("Serviços selecionados:", service_id);
  }
  else {
    const previousServices = document.getElementById('editAppointmentServiceId').value;
    if (previousServices) {
      service_id = previousServices.split(',').map(s => s.trim()).filter(Boolean);
    }
    payload.service_id = service_id;
    // console.log("Serviços do input oculto:", service_id);
  }

  // console.log("Payload para atualizar agendamento:", payload);

  const res = await fetch('/.netlify/functions/appointments-put', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  const { error } = await res.json();
  if (error) {
    alert('Erro ao atualizar!');
  } else {
    alert('Agendamento atualizado!');
    document.getElementById('editAppointmentModal').style.display = 'none';
    carregarAgendamentosDia(filterDate.value); 
  }
};


// Eventos dos filtros
filterDate.addEventListener('change', () => {
  carregarAgendamentosDia(filterDate.value);
});

filterName.addEventListener('input', renderBookings);

// Render inicial SOMENTE chamando a API uma vez
carregarAgendamentosDia(filterDate.value);
