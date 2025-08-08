// js/rating.js
document.addEventListener('DOMContentLoaded', () => {
  const API       = '/.netlify/functions/rating';
  const container = document.getElementById('testimonials-container'); // ou #ratings-list, se preferir
  const form      = document.getElementById('rating-form');

  // 1) Função para buscar e renderizar os ratings
  async function loadRatings() {
    try {
      const res     = await fetch(API);
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
  }

  // 2) Envio do formulário
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const payload = {
      clientName: form.clientName.value.trim(),
      message:    form.message.value.trim(),
      rating:     parseInt(
        document.querySelector('input[name="rating"]:checked').value,
        10
      )
    };

    try {
      const res = await fetch(API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Falha ao salvar avaliação');

      alert('Avaliação enviada com sucesso!');
      form.reset();
      await loadRatings();  // atualiza a lista
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // 3) Inicializa na carga da página
  loadRatings();
});
