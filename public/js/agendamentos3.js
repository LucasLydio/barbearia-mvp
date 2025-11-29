function getMockTimes() {
  const times = [];
  for (let h = 9; h <= 19; h++) {
    ['00', '30'].forEach(min => {
      if (h === 19 && min === '30') return; // Não adiciona 19:30
      // Só adiciona "09:30" para as 9h (pula "09:00")
      if (h === 9 && min === '00') return;
      times.push(`${h.toString().padStart(2, '0')}:${min}`);
    });
  }
  return times;
}


// =====================================
// BUSCA HORÁRIOS OCUPADOS DA API (REAL)
// =====================================
async function fetchBusyTimes(dateYMD) {
  if (!dateYMD) return [];

  try {
    const res = await fetch(`/.netlify/functions/appointments-get?date=${dateYMD}`);
    const { data } = await res.json();

    if (!Array.isArray(data)) return [];

    // Normaliza "HH:MM:SS" → "HH:MM"
    return data
      .map(a => a.time)
      .filter(Boolean)
      .map(t => t.slice(0, 5)); // remove segundos

  } catch (err) {
    console.error("Erro ao buscar horários ocupados:", err);
    return [];
  }
}

// =====================================
// RENDERIZA BOTÕES DE HORÁRIO (TOGGLES)
// =====================================
function renderTimeToggles(availableTimes) {
  const horariosList = document.getElementById('horarios-list');
  horariosList.innerHTML = '';

  availableTimes.forEach(time => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-outline-light btn-sm horario-toggle';
    btn.textContent = time;
    btn.dataset.value = time;

    btn.onclick = () => {
      horariosList.querySelectorAll('.horario-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      formData.time = time;
    };

    horariosList.appendChild(btn);
  });
}

// =====================================
// LÓGICA PRINCIPAL DO STEP 2
// =====================================
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  const horariosArea = document.getElementById('horarios-area');
  const horariosList = document.getElementById('horarios-list');
  const btnNext2 = document.getElementById('next2');
  const btnPrev2 = document.getElementById('prev2');

  horariosArea.style.display = 'none';

  // ------------------------------------------------------
  // QUANDO A DATA É SELECIONADA → CARREGAR HORÁRIOS
  // ------------------------------------------------------
  dateInput.addEventListener('change', async () => {
    formData.date = dateInput.value;
    formData.time = ''; // Reset

    if (!formData.date) {
      horariosArea.style.display = 'none';
      return;
    }

    console.log("📅 Data selecionada:", formData.date);

    // 1. Busca horários ocupados
    const busyTimes = await fetchBusyTimes(formData.date);
    console.log("⛔ Ocupados:", busyTimes);

    // 2. Gera horários livres
    const availableTimes = getMockTimes().filter(t => !busyTimes.includes(t));
    console.log("✅ Disponíveis:", availableTimes);

    // 3. Renderiza opções disponíveis
    renderTimeToggles(availableTimes);
    horariosArea.style.display = '';
  });

  // Próximo step
  btnNext2.addEventListener('click', () => {
    if (!formData.date) {
      alert('Escolha uma data primeiro!');
      dateInput.focus();
      return;
    }
    if (!formData.time) {
      alert('Escolha um horário disponível!');
      horariosList.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (typeof showStep === 'function') showStep(3);
  });

  // Step anterior
  btnPrev2.addEventListener('click', () => {
    if (typeof showStep === 'function') showStep(1);
  });
});
