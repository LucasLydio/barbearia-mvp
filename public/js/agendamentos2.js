const servicesList = document.getElementById('servicesList');
const paginationDiv = document.getElementById('paginationDiv');
const serviceSearch = document.getElementById('serviceSearch');

let currentPage = 1;
let lastQuery = "";
const pageSize = 5;
let totalCount = 0;

// Carrega serviços, paginação e busca
async function loadServices(query = "", page = 1) {
  lastQuery = query;
  currentPage = page;

  let url = `/.netlify/functions/services-get?page=${page}&limit=${pageSize}`;
  if (query && query.trim().length > 1) {
    url += `&name=${encodeURIComponent(query.trim())}`;
  }
  // Mostra loading
  servicesList.innerHTML = `<div class="text-center py-3">Carregando...</div>`;
  paginationDiv.innerHTML = "";

  const res = await fetch(url);
  const { data, count } = await res.json();
  totalCount = count || 0;

  if (!data || !data.length) {
    servicesList.innerHTML = `<div class="alert alert-warning">Nenhum serviço encontrado.</div>`;
    paginationDiv.innerHTML = "";
    return;
  }

  // Exibe os serviços como radios
  servicesList.innerHTML = data.map(s => `
    <label class="form-check-label d-flex align-items-center border rounded px-3 py-2 bg-transparent shadow-sm mb-2">
      <input type="checkbox" class="form-check-input me-2" name="service" value="${s.id}" data-name="${s.name}">
      <span class="fw-bold">${s.name}</span>
      <span class="ms-auto text-white small">R$ ${Number(s.price).toFixed(2)}</span>
    </label>
  `).join('');

  // Adiciona listeners para armazenar seleção no formData
  servicesList.querySelectorAll('input[name="service"]').forEach(input => {
    input.addEventListener('change', updateSelectedServices);
  });
  updateSelectedServices();

  // Paginação
  renderPagination();
}


function renderPagination() {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) {
    paginationDiv.innerHTML = "";
    return;
  }

  let html = `<button class="btn btn-sm btn-outline-light me-2" ${currentPage===1?"disabled":""} id="prevPage">Anterior</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="btn btn-sm ${i===currentPage?'btn-dark text-white':'btn-outline-light'} mx-1 pageBtn" data-page="${i}">${i}</button>`;
  }
  html += `<button class="btn btn-sm btn-outline-light ms-2" ${currentPage===totalPages?"disabled":""} id="nextPage">Próximo</button>`;
  paginationDiv.innerHTML = html;


  document.getElementById('prevPage')?.addEventListener('click', () => loadServices(lastQuery, currentPage-1));
  document.getElementById('nextPage')?.addEventListener('click', () => loadServices(lastQuery, currentPage+1));
  document.querySelectorAll('.pageBtn').forEach(btn => {
    btn.addEventListener('click', e => loadServices(lastQuery, Number(e.target.dataset.page)));
  });
}

function updateSelectedServices() {
  // Pega todos os checkboxes marcados
  const checked = Array.from(document.querySelectorAll('input[name="service"]:checked'));
  // IDs
  formData.service = checked.map(input => input.value);
  // Nomes
  formData.serviceName = checked.map(input => input.getAttribute('data-name'));
}


serviceSearch.addEventListener('input', () => {
  const term = serviceSearch.value.trim();

  if (term.length === 0 || term.length > 1) {
    loadServices(term, 1);
  }
});

document.getElementById('next1').addEventListener('click', () => {
  if (!formData.service || formData.service.length === 0) {
    alert('Selecione pelo menos um serviço.');
    return;
  }
  showStep(2);
});

loadServices();
