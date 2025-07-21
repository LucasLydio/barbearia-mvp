document.addEventListener('DOMContentLoaded', () => {
  const scheduleList = document.getElementById('schedule-list');

  // Dados estáticos de exemplo; substitua por fetch('/.netlify/functions/getHorarios')
  const horarios = [
    { dia: 'Segunda-feira', abertura: '09:00', fechamento: '18:00' },
    { dia: 'Terça-feira',   abertura: '09:00', fechamento: '18:00' },
    { dia: 'Quarta-feira', abertura: '09:00', fechamento: '18:00' },
    { dia: 'Quinta-feira', abertura: '09:00', fechamento: '18:00' },
    { dia: 'Sexta-feira', abertura: '09:00', fechamento: '18:00' },
    { dia: 'Sábado',      abertura: '10:00', fechamento: '16:00' },
    { dia: 'Domingo',     abertura: 'Fechado', fechamento: '' }
  ];

  // Renderiza os cards
  scheduleList.innerHTML = horarios.map(h => {
    const horarioTexto = h.abertura === 'Fechado'
      ? 'Fechado'
      : `${h.abertura} – ${h.fechamento}`;
    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card schedule-card p-4 text-center shadow-sm">
          <h5>${h.dia}</h5>
          <p>${horarioTexto}</p>
        </div>
      </div>
    `;
  }).join('');
});
