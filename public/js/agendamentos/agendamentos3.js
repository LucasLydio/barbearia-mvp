function getMockTimes(dateInput) {
  const times = [];
  const now = new Date();

  if (!dateInput?.value) return times; 

  const [y, m, d] = dateInput.value.split('-').map(Number);
  const selectedDate = new Date(y, m - 1, d);

  const isToday = selectedDate.toDateString() === now.toDateString();


  const nowMinutes = now.getHours() * 60 + now.getMinutes() + 30;

  for (let h = 9; h <= 19; h++) {
    ['00', '30'].forEach(min => {
      if (h === 19 && min === '30') return;
      if (h === 9 && min === '00') return;

      const timeMinutes = h * 60 + Number(min);

      if (!isToday || timeMinutes >= nowMinutes) {
        times.push(`${h.toString().padStart(2, '0')}:${min}`);
      }
    });
  }

  return times;
}




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


function renderTimeToggles(availableTimes) {
  const horariosList = document.getElementById('horarios-list');
  const msg = document.createElement('div');
  const span = document.createElement('span');

  span.className = 'fw-bold my-2';
  span.textContent = 'Não há horários disponíveis!';

  msg.appendChild(span);
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

  if (availableTimes.length === 0) horariosList.appendChild(msg);
}

document.addEventListener('DOMContentLoaded', () => {


  const horariosArea = document.getElementById('horarios-area');
  const horariosList = document.getElementById('horarios-list');
  const btnNext2 = document.getElementById('next2');
  const btnPrev2 = document.getElementById('prev2');

  horariosArea.style.display = 'none';


  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);

  dateInput.addEventListener('change', async () => {
    formData.date = dateInput.value;
    formData.time = '';

    if (!formData.date) {
      horariosArea.style.display = 'none';
      return;
    }

    const busyTimes = await fetchBusyTimes(formData.date);
    const availableTimes = getMockTimes(dateInput).filter(t => !busyTimes.includes(t));

    renderTimeToggles(availableTimes);
    horariosArea.style.display = '';
  });


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


  btnPrev2.addEventListener('click', () => {
    if (typeof showStep === 'function') showStep(1);
  });
});
