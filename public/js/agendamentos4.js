
function updateSelectedBarber() {
  const selected = document.querySelector('input[name="barber"]:checked');
  if (selected) {
    formData.barber = selected.value;                      // UUID do barbeiro
    formData.barberName = selected.getAttribute('data-name'); // Nome do barbeiro
  } else {
    formData.barber = null;
    formData.barberName = null;
  }
}


document.addEventListener('DOMContentLoaded', () => { 

  
const barbersList = document.getElementById('barbers-list');
const paginationBarbers = document.getElementById('paginationBarbers');
const barberSearch = document.getElementById('barberSearch');

let currentPageBarber = 1;
let lastBarberQuery = "";
const pageSizeBarber = 4;
let totalCountBarber = 0;


async function loadBarbers(query = "", page = 1) {
  lastBarberQuery = query;
  currentPageBarber = page;

  let url = `/.netlify/functions/barbers-get?page=${page}&limit=${pageSizeBarber}`;
  if (query && query.trim().length > 1) {
    url += `&name=${encodeURIComponent(query.trim())}`;
  }

  // Loading...
  barbersList.innerHTML = `<div class="text-center py-3">Carregando barbeiros...</div>`;
  paginationBarbers.innerHTML = "";

  const res = await fetch(url);
  const { data, count } = await res.json();
  totalCountBarber = count || 0;

  if (!data || !data.length) {
    barbersList.innerHTML = `<div class="alert alert-warning">Nenhum barbeiro encontrado.</div>`;
    paginationBarbers.innerHTML = "";
    return;
  }

  // Radios para barbers
  barbersList.innerHTML = data.map(b => `
    <label class="form-check-label d-flex align-items-center border rounded px-3 py-2 bg-transparent shadow-sm mb-2">
      <input type="radio" class="form-check-input me-2" name="barber" value="${b.id}" data-name="${b.name}">
      <span class="fw-bold">${b.name}</span>
    </label>
  `).join('');

  barbersList.querySelectorAll('input[name="barber"]').forEach(input => {
    input.addEventListener('change', updateSelectedBarber);
  });
  updateSelectedBarber();

  renderBarberPagination();

  document.getElementById('next3').onclick = async function() {
    if (formData.barberName === null) {
      alert("Selecione o barbeiro");
      showStep(3);
    }
    else {
      return true;
    }
  }
}

window.loadBarbers = loadBarbers;

function renderBarberPagination() {
  const totalPages = Math.ceil(totalCountBarber / pageSizeBarber);
  if (totalPages <= 1) {
    paginationBarbers.innerHTML = "";
    return;
  }
  let html = `<button class="btn btn-sm btn-outline-dark me-2" ${currentPageBarber===1?"disabled":""} id="prevBarberPage">Anterior</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="btn btn-sm ${i===currentPageBarber?'btn-dark text-white':'btn-outline-dark'} mx-1 barberPageBtn" data-page="${i}">${i}</button>`;
  }
  html += `<button class="btn btn-sm btn-outline-dark ms-2" ${currentPageBarber===totalPages?"disabled":""} id="nextBarberPage">Próximo</button>`;
  paginationBarbers.innerHTML = html;

  document.getElementById('prevBarberPage')?.addEventListener('click', () => loadBarbers(lastBarberQuery, currentPageBarber-1));
  document.getElementById('nextBarberPage')?.addEventListener('click', () => loadBarbers(lastBarberQuery, currentPageBarber+1));
  document.querySelectorAll('.barberPageBtn').forEach(btn => {
    btn.addEventListener('click', e => loadBarbers(lastBarberQuery, Number(e.target.dataset.page)));
  });
}

barberSearch.addEventListener('input', () => {
  const term = barberSearch.value.trim();
  if (term.length === 0 || term.length > 1) {
    loadBarbers(term, 1);
  }
});

  loadBarbers();

});

