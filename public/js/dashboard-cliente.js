// Utilitário para decodificar o token Base64 salvo no localStorage
function decodeToken(token) {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

function formatDateBR(dateStr) {
  // Suporta formato "2025-11-28"
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [hh, mm] = timeStr.split(':');
  return `${hh}:${mm}`;
}

async function loadClientAppointments(clientId) {
  let url = `/.netlify/functions/appointments-get?client_id=${clientId}&limit=30`;
  const res = await fetch(url);
  const { data } = await res.json();
  return data || [];
}


document.addEventListener('DOMContentLoaded', async () => {
  // ... (seu código de token)
  const token = localStorage.getItem('valette_token');
  const user = token ? decodeToken(token) : null;

  // Se não estiver logado, redireciona
  if (!user) {
    window.location.href = '/area-do-cliente.html';
    return;
  }

  // Atualiza nome na tela
  const h3 = document.querySelector('.welcome-card h3');
  if (h3) h3.innerHTML = `Olá, ${user.name || 'Cliente'}!`;

  // Carrega agendamentos
  const bookingsDiv = document.getElementById('clientBookings');
  bookingsDiv.innerHTML = `<div class="text-center py-4">Carregando...</div>`;
  const agendamentos = await loadClientAppointments(user.id);

  if (!agendamentos.length) {
    bookingsDiv.innerHTML = `<div class="text-muted text-center">Nenhum agendamento encontrado.</div>`;
    return;
  }

  // Renderiza agendamentos em cards
  bookingsDiv.innerHTML = agendamentos.map(ag => {
    // Lista de serviços
    const servicos = (ag.appointment_services || [])
      .map(as => as.services?.name)
      .filter(Boolean)
      .join(", ");
      console.log(servicos)
    return `
      <div class="card mb-3 shadow-sm border-0">
        <div class="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <div>
            <div class="fw-bold">${formatDateBR(ag.date)} ${ag.time ? `<span class="badge bg-dark ms-2">${formatTime(ag.time)}</span>` : ""}</div>
            <div class="small text-muted mb-1">${servicos || "—"}</div>
            <div class="small">Barbeiro: <b>${ag.barbers?.name || "—"}</b></div>
            <div class="small text-muted fs-6">${ag.status ? `<span class="badge bg-${getStatusColor(ag.status)}">${ag.status}</span>` : ""}</div>
          </div>
          <div class="mt-2 mt-md-0">
            <!-- Botões de ação, ex: cancelar, reagendar, etc -->
          </div>
        </div>
      </div>
    `;
  }).join('');
});


// Utilitário de cor do status
function getStatusColor(status) {
  switch(status) {
    case "Confirmado": return "success";
    case "Aguardando": return "warning";
    case "Cancelado": return "danger";
    default: return "secondary";
  }
}

// A função loadClientAppointments já está logo acima!


// Exemplo de logout simples
function logout() {
  localStorage.removeItem('valette_token');
  sessionStorage.removeItem('client');
  window.location.href = '/area-do-cliente.html';
}
