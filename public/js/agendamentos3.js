// agendamentos3.js

function getMockTimes() {
  const times = [];
  for (let h = 9; h <= 18; h++) {
    ['00', '30'].forEach(min => {
      // Não inclui 18:30
      if (h === 18 && min === '30') return;
      times.push(`${h.toString().padStart(2, '0')}:${min}`);
    });
  }
  return times;
}

function populateTimeSelect() {
  const timeSelect = document.getElementById('time');
  timeSelect.innerHTML = '<option value="">Selecione...</option>';
  getMockTimes().forEach(time => {
    const opt = document.createElement('option');
    opt.value = time;
    opt.textContent = time;
    timeSelect.appendChild(opt);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateTimeSelect();
  const dateInput = document.getElementById('date');
  const timeSelect = document.getElementById('time');
  const btnNext2 = document.getElementById('next2');

  dateInput.addEventListener('change', () => {
    formData.date = dateInput.value;
  });
  timeSelect.addEventListener('change', () => {
    formData.time = timeSelect.value;
  });

  btnNext2.addEventListener('click', () => {
    if (formData.date) formData.date = dateInput.value;
    if (formData.time) formData.time = timeSelect.value;
    
    // console.log(formData);

    if (!formData.date) {
      alert('Escolha uma data.');
      return showStep(2);
    }
    if (!formData.time) {
      alert('Escolha um horário.');
      return showStep(2);
    }

    // Aqui você chama o showStep(3) ou a lógica para o próximo passo
    if (typeof showStep === 'function') {
        showStep(3);
    }
  });

  // (Opcional) Carregar horários disponíveis pode ser adicionado aqui!
});
