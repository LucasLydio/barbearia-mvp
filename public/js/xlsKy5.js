document.addEventListener('DOMContentLoaded', () => {
  const servicesList = document.getElementById('servicesList');
  const searchInput = document.querySelector('.input-search input.form-control');
  const pageSize = 5;
  let currentPage = 1;
  let totalCount = 0;
  let lastQuery = "";
  const editServiceModal = document.getElementById('editServiceModal');
  const editServiceForm = document.getElementById('editServiceForm');
  const closeEditServiceModal = document.getElementById('closeEditServiceModal');
  document.querySelector('.create-services button').onclick = openCreateServiceModal;

  // Cria container para a paginação
  const paginationDiv = document.createElement('div');
  paginationDiv.className = 'd-flex justify-content-between align-items-center mt-3';
  servicesList.after(paginationDiv);

  async function loadServices(query = "", page = 1) {
    lastQuery = query;
    currentPage = page;
    let url = `/.netlify/functions/services-get?page=${page}&limit=${pageSize}`;
    if (query && query.trim().length > 1) {
      url += `&name=${encodeURIComponent(query.trim())}`;
    }
    const res = await fetch(url);
    const { data, count } = await res.json();
    totalCount = count || 0;

    if (!data || !data.length) {
      servicesList.innerHTML = `<div class="alert alert-warning">Nenhum serviço encontrado.</div>`;
      paginationDiv.innerHTML = "";
      return;
    }

    servicesList.innerHTML = data.map(s => `
      <div class="card mb-2 shadow-sm">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div class="d-flex flex-column">
            <span class="fw-bold">${s.name}</span>
            <div>
                <span class="badge bg-dark ms-2">R$ ${Number(s.price).toFixed(2)}</span>
                <span class="badge bg-secondary ms-2">${s.duration} min</span>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-dark btn-sm " data-id="${s.id}" data-action="edit">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" data-id="${s.id}" data-action="delete">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    renderPagination();
  }

  function renderPagination() {
    const totalPages = Math.ceil(totalCount / pageSize);
    if (totalPages <= 1) {
      paginationDiv.innerHTML = '';
      return;
    }

    paginationDiv.innerHTML = `
      <button class="btn btn-sm btn-outline-dark" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="bi bi-chevron-left"></i> Anterior
      </button>
      <span>Página ${currentPage} de ${totalPages}</span>
      <button class="btn btn-sm btn-outline-dark" id="nextPage" ${currentPage === totalPages ? 'disabled' : ''}>
        Próxima <i class="bi bi-chevron-right"></i>
      </button>
    `;

    document.getElementById('prevPage').onclick = () => {
      if (currentPage > 1) loadServices(lastQuery, currentPage - 1);
    };
    document.getElementById('nextPage').onclick = () => {
      if (currentPage < totalPages) loadServices(lastQuery, currentPage + 1);
    };
  }

  // Pesquisa ao digitar (debounced)
  let timer;
  searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      loadServices(searchInput.value, 1);
    }, 400);
  });

  // Função para abrir o modal e popular campos
  async function openEditServiceModal(serviceId) {
    // Busca do serviço na API
    const res = await fetch(`/.netlify/functions/services-get?service_id=${serviceId}`);
    const { data: service } = await res.json();
    if (!service) {
      alert('Serviço não encontrado!');
      return;
    }
    editServiceModal.style.display = "flex";
    document.getElementById('editServiceId').value = service.id;
    document.getElementById('editServiceName').value = service.name;
    document.getElementById('editServicePrice').value = Number(service.price).toFixed(2);
    document.getElementById('editServiceDuration').value = service.duration || 60;
  }

  function openCreateServiceModal() {
        // Limpa os campos do modal
        document.getElementById('editServiceId').value = '';
        document.getElementById('editServiceName').value = '';
        document.getElementById('editServicePrice').value = '';
        document.getElementById('editServiceDuration').value = 60; // Valor padrão

        // Troca o título do modal
        document.getElementById('editServiceTitle').textContent = 'Criar Serviço';

        // Mostra o modal
        editServiceModal.style.display = 'flex';
    }


  // Evento de clique em editar/deletar
  servicesList.onclick = function(e) {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const { id, action } = btn.dataset;
    if (action === 'edit') {
      openEditServiceModal(id);
    }
    if (action === 'delete') {
      if (confirm('Tem certeza que deseja remover este serviço?')) {
        deleteService(id);
      }
    }
  };

  // Fechar modal
  closeEditServiceModal.onclick = () => {
    editServiceModal.style.display = "none";
  };

  // Submissão do modal de edição
editServiceForm.onsubmit = async function(e) {
  e.preventDefault();
  const id = document.getElementById('editServiceId').value;
  const name = document.getElementById('editServiceName').value.trim();
  const price = document.getElementById('editServicePrice').value;
  const duration = document.getElementById('editServiceDuration').value;

  let url, method, body;
  if (id) {
    // Editar
    url = '/.netlify/functions/services-put';
    method = 'PUT';
    body = JSON.stringify({ id, name, price, duration });
  } else {
    // Criar
    url = '/.netlify/functions/services-post';
    method = 'POST';
    body = JSON.stringify({ name, price, duration });
  }

  const res = await fetch(url, {
    method,
    headers: {'Content-Type': 'application/json'},
    body
  });
  const { error } = await res.json();
  if (error) {
    alert(error || 'Erro ao salvar serviço!');
  } else {
    alert(id ? 'Serviço atualizado!' : 'Serviço criado!');
    editServiceModal.style.display = 'none';
    loadServices(lastQuery, currentPage);
  }
};


  async function deleteService(id) {
    const service_id = id;
    const res = await fetch('/.netlify/functions/services-delete', {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ service_id })
    });
    const { error } = await res.json();
    if (error) {
      alert(error);
    } else {
      alert('Serviço removido com sucesso!');
      loadServices(lastQuery, currentPage);
    }
  }

  // Carrega página inicial
  loadServices();
});
