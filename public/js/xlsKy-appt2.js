// Ref. aos elementos do modal de edição
const serviceDisplayDiv = document.getElementById('serviceDisplayDiv');
const serviceEditDiv = document.getElementById('serviceEditDiv');
const editServiceBtn = document.getElementById('editServiceBtn');
const cancelEditServiceBtn = document.getElementById('cancelEditServiceBtn');
const serviceSearchEdit = document.getElementById('serviceSearchEdit');
const servicesListEdit = document.getElementById('servicesListEdit');
const paginationEditDiv = document.getElementById('paginationEditDiv');
let selectedServiceIdsEdit = [];
let selectedServiceNamesEdit = [];
let currentPageEdit = 1;
let lastQueryEdit = '';
const pageSizeEdit = 5; // mesmo padrão

// Mostrar área de edição ao clicar no botão
editServiceBtn.onclick = () => {
  serviceDisplayDiv.style.display = "none";
  serviceEditDiv.style.display = "";
  serviceSearchEdit.value = "";
  loadServicesEdit("", 1); // Carrega todos
};

cancelEditServiceBtn.onclick = () => {
  serviceEditDiv.style.display = "none";
  serviceDisplayDiv.style.display = "";
};

// Carrega serviços no modo edição
async function loadServicesEdit(query = "", page = 1) {
  lastQueryEdit = query;
  currentPageEdit = page;

  let url = `/.netlify/functions/services-get?page=${page}&limit=${pageSizeEdit}`;
  if (query && query.trim().length > 1) {
    url += `&name=${encodeURIComponent(query.trim())}`;
  }
  servicesListEdit.innerHTML = `<div class="text-center py-3">Carregando...</div>`;
  paginationEditDiv.innerHTML = "";

  const res = await fetch(url);
  const { data, count } = await res.json();
  const totalCountEdit = count || 0;

  if (!data || !data.length) {
    servicesListEdit.innerHTML = `<div class="alert alert-warning">Nenhum serviço encontrado.</div>`;
    paginationEditDiv.innerHTML = "";
    return;
  }

  // Mostra como radio (um só pode ser selecionado)
    servicesListEdit.innerHTML = data.map(s => `
    <label class="form-check-label d-flex align-items-center border rounded px-3 py-2 bg-transparent shadow-sm mb-2 w-100">
        <input type="checkbox" 
            class="form-check-input me-2" 
            name="serviceEdit[]" 
            value="${s.id}" 
            data-name="${s.name}"
            ${selectedServiceIdsEdit.includes(s.id) ? 'checked' : ''}>
        <span class="fw-bold">${s.name}</span>
        <span class="ms-auto text-dark small">R$ ${Number(s.price).toFixed(2)}</span>
    </label>
    `).join('');


    servicesListEdit.querySelectorAll('input[name="serviceEdit[]"]').forEach(input => {
    input.addEventListener('change', () => {
        const selected = Array.from(
        document.querySelectorAll('input[name="serviceEdit[]"]:checked')
        );
        
        selectedServiceIdsEdit = selected.map(i => i.value);
        selectedServiceNamesEdit = selected.map(i => i.dataset.name);

        document.getElementById('editAppointmentService').value =
        selectedServiceNamesEdit.join(", ");
    });
    });


  // Paginação
  const totalPagesEdit = Math.ceil(totalCountEdit / pageSizeEdit);
  if (totalPagesEdit > 1) {
    let html = `<button class="btn btn-sm btn-outline-dark me-2" ${currentPageEdit===1?"disabled":""} id="prevEditPage">Anterior</button>`;
    for (let i = 1; i <= totalPagesEdit; i++) {
      html += `<button class="btn btn-sm ${i===currentPageEdit?'btn-dark text-white':'btn-outline-dark'} mx-1 editPageBtn" data-page="${i}">${i}</button>`;
    }
    html += `<button class="btn btn-sm btn-outline-dark ms-2" ${currentPageEdit===totalPagesEdit?"disabled":""} id="nextEditPage">Próximo</button>`;
    paginationEditDiv.innerHTML = html;

    document.getElementById('prevEditPage')?.addEventListener('click', () => loadServicesEdit(lastQueryEdit, currentPageEdit-1));
    document.getElementById('nextEditPage')?.addEventListener('click', () => loadServicesEdit(lastQueryEdit, currentPageEdit+1));
    document.querySelectorAll('.editPageBtn').forEach(btn => {
      btn.addEventListener('click', e => loadServicesEdit(lastQueryEdit, Number(e.target.dataset.page)));
    });
  } else {
    paginationEditDiv.innerHTML = "";
  }
}

// Pesquisa dinâmica nos serviços
serviceSearchEdit?.addEventListener('input', () => {
  const term = serviceSearchEdit.value.trim();
  if (term.length === 0 || term.length > 1) {
    loadServicesEdit(term, 1);
  }
});

