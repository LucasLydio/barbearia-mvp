
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


// Função para abrir o modal e preencher dados
async function openEditClientModal() {
  const token = localStorage.getItem('valette_token');
  const user = token ? decodeToken(token) : null;
  if (!user) return;

  // Busca dados atualizados do cliente pela API (garante frescor)
  const res = await fetch(`/.netlify/functions/clients-get?client_id=${user.id}`);
  const { data } = await res.json();
  if (!data) return alert('Erro ao buscar dados do cliente!');

  // Preenche campos
  document.getElementById('editClientName').value = data.name || '';
  document.getElementById('editClientEmail').value = data.email || '';
  document.getElementById('editClientTelephone').value = data.telephone || '';

  document.getElementById('editClientModal').style.display = 'flex';
}

// Evento no botão editar
document.querySelector('.dash-item-card .action-btn').onclick = openEditClientModal;

// Fechar modal
document.getElementById('closeEditClientModal').onclick = () => {
  document.getElementById('editClientModal').style.display = 'none';
};

// Submissão do formulário de edição
document.getElementById('editClientForm').onsubmit = async function(e) {
  e.preventDefault();
  const token = localStorage.getItem('valette_token');
  const user = token ? decodeToken(token) : null;
  if (!user) return;

  const name = document.getElementById('editClientName').value.trim().toUpperCase();
  const email = document.getElementById('editClientEmail').value.trim();
  const telephone = document.getElementById('editClientTelephone').value.trim();

  // (Opcional) Validação simples
  if (!name || !email || !telephone || user.id == null) {
    alert('Preencha todos os campos.');
    return;
  }

  // Atualiza via API
  const res = await fetch('/.netlify/functions/clients-put', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ client_id: user.id, name, email, telephone })
  });
  const result = await res.json();
  if (result.error) {
    alert('Erro ao atualizar dados!');
  } else {
    alert('Informações atualizadas!');
    document.getElementById('editClientModal').style.display = 'none';
    // Atualiza nome na tela (opcional recarregar a página)
    document.querySelector('.welcome-card h3').innerHTML = `Olá, ${name}!`;
    // Atualiza token se quiser manter em sync
    user.name = name;
    user.email = email;
    user.telephone = telephone;
    localStorage.setItem('valette_token', btoa(JSON.stringify(user)));
    window.location.reload();
  }
};
