document.addEventListener('DOMContentLoaded', () => {
  // Dados dos barbeiros
  const barbers = [
    {
      name: 'João Silva',
      img: '../public/assets/img/barbeiro.PNG',
      description: 'Especialista em cortes clássicos e barba tradicional.',
      invite: 'Venha viver uma experiência única! Agende comigo.'
    },
    {
      name: 'Carlos Mendes',
      img: 'assets/img/barbeiro2.jpg',
      description: 'Modernidade e estilo para quem busca algo diferenciado.',
      invite: 'Estou pronto para transformar seu visual. Te espero!'
    },
    {
      name: 'Marcos Oliveira',
      img: 'assets/img/barbeiro3.jpg',
      description: 'Técnicas avançadas de fades e design de barba.',
      invite: 'Marque seu horário e confira meu trabalho!'
    }
  ];

  const container = document.getElementById('barbers-container');

  barbers.forEach((barber, idx) => {
    // Cria o card
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="barber-card">
        <div class="photo-wrapper" style="background-image:url('${barber.img}')">
          <img src="${barber.img}" alt="${barber.name}" />
        </div>
        <h3>${barber.name}</h3>
        <p class="description">${barber.description}</p>
        <div class="invitation">${barber.invite}</div>

        <div class="reviews-section">
          <h4>Avaliações</h4>
          <ul id="reviews-list-${idx}" class="review-list">
            <!-- Reviews carregados via JS -->
          </ul>

          <div id="star-rating-${idx}" class="star-rating">
            ${[1,2,3,4,5].map(n => `<i class="bi bi-star" data-value="${n}"></i>`).join('')}
          </div>
          <div class="review-input">
            <textarea id="review-text-${idx}" rows="3" placeholder="Seu comentário..."></textarea>
            <button id="submit-review-${idx}" class="btn btn-danger retro-btn d-block w-100">Enviar</button>
          </div>
        </div>
      </div>`;
    container.appendChild(col);

    // Inicializa reviews daquele barbeiro
    initReviewSection(idx);
  });

  function initReviewSection(idx) {
    const key = `barberReviews-${idx}`;
    let reviews = JSON.parse(localStorage.getItem(key) || '[]');

    const ul = document.getElementById(`reviews-list-${idx}`);
    const stars = Array.from(document.querySelectorAll(`#star-rating-${idx} .bi`));
    const textarea = document.getElementById(`review-text-${idx}`);
    const btn = document.getElementById(`submit-review-${idx}`);
    let currentRating = 0;

    // Renderiza lista de reviews
    function render() {
      reviews = JSON.parse(localStorage.getItem(key) || '[]');
      if (!reviews.length) {
        ul.innerHTML = `<li class="text-center text-muted">Seja o primeiro a avaliar!</li>`;
      } else {
        ul.innerHTML = reviews.map(r => `
          <li>
            <div class="rating-stars">
              ${'<i class="bi bi-star-fill"></i>'.repeat(r.rating)}
              ${'<i class="bi bi-star"></i>'.repeat(5 - r.rating)}
            </div>
            <p>${r.text}</p>
          </li>`).join('');
      }
    }

    // Eventos de hover e click nas estrelas
    stars.forEach(star => {
      star.addEventListener('mouseover', () => {
        const val = +star.dataset.value;
        stars.forEach(s => {
          s.classList.toggle('hover', +s.dataset.value <= val);
        });
      });
      star.addEventListener('mouseout', () => {
        stars.forEach(s => s.classList.remove('hover'));
      });
      star.addEventListener('click', () => {
        currentRating = +star.dataset.value;
        stars.forEach(s => {
          s.classList.toggle('selected', +s.dataset.value <= currentRating);
        });
      });
    });

    // Envio de novo comentário
    btn.addEventListener('click', () => {
      const text = textarea.value.trim();
      if (!currentRating || !text) {
        return alert('Selecione as estrelas e escreva seu comentário.');
      }
      reviews.push({ rating: currentRating, text });
      localStorage.setItem(key, JSON.stringify(reviews));
      textarea.value = '';
      currentRating = 0;
      stars.forEach(s => s.classList.remove('selected'));
      render();
    });

    render();
  }
});
