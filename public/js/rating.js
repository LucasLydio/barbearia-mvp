document.addEventListener('DOMContentLoaded', async () => {
  const API = '/.netlify/functions/rating';
  const container = document.getElementById('testimonials-container');

  try {
    const res = await fetch(API);
    const ratings = await res.json();
    container.innerHTML = ratings.map(r => `
      <div class="col-md-6">
        <div class="card bg-dark text-white h-100 shadow">
          <div class="card-body">
            <h5 class="card-title">${r.clientName}</h5>
            <p class="card-text">${r.message}</p>
            <p class="mb-0">
              ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
            </p>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Erro ao carregar depoimentos:', err);
  }
});