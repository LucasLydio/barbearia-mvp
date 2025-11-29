document.addEventListener('DOMContentLoaded', () => {

  const formData = {};
  window.formData = {};

  const steps = Array.from(document.querySelectorAll('.step'));
  const indicators = Array.from(document.querySelectorAll('.step-indicator'));
  const wizardForm = document.getElementById('wizard-form');

  let currentStep = 1;
  window.showStep = function(n) {
    steps.forEach(s => s.classList.toggle('active', +s.dataset.step === n));
    indicators.forEach((ind, i) =>
      ind.classList.toggle('active', i === n - 1)
    );
    currentStep = n;
  }



  // Navegação: Passo 1 → 2

  // Passo 3 → 4
  document.getElementById('next3').addEventListener('click', () => {

    showStep(4);
  });


  ['prev2','prev3','prev4','prev5'].forEach(id => {
    document.getElementById(id).addEventListener('click', () =>
      showStep(currentStep - 1),
      console.log()
    );
  });

  // Submete
  wizardForm.addEventListener('submit', e => {
    e.preventDefault();

    wizardForm.reset();
    loadTimes();
    showStep(1);
  });


function updateSummary() {
  const ul = document.getElementById('summary-list');


  const [year, month, day] = formData.date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  // 2) Cria um array de seções com label + conteúdo
  const summarySections = [
    { label: '💈 Serviços',   value: serviceLines.join('\n') },
    { label: '💰 Total',      value: `R$ ${formData.totalPrice.toFixed(2)}` },
    { label: '🗓️ Data/Hora',  value: `${formattedDate} às ${formData.time}` },
    { label: '✂️ Barbeiro',    value: formData.barber },
    { label: '📞 Telefone',   value: formData.phone },
  ];

  // 3) Renderiza no HTML, usando <strong> e <br> para respeitar quebras de linha
  ul.innerHTML = summarySections.map(sec => `
    <li class="list-group-item">
      <strong>${sec.label}:</strong><br>
      ${sec.value.replace(/\n/g, '<br>')}
    </li>
  `).join('');

  // ==== BOTÃO WHATSAPP ====
  // 4) Monta array de linhas para o texto do WhatsApp, com markdown (*bold*)
  const waLines = ['*✉️ Pré-Agendamento Valette Barbearia*', ''];

  // 4.1) Saudação personalizada no topo

  waLines.push('Obs: Este é um pré-agendamento. Aguardo confirmação e instruções para pagamento.');

  waLines.push('Cartão 💳 ou Pix ❖ ');
  waLines.push('\n*Finalize seu pré-agendamento realizando o pagamento!*');
  waLines.push('\n Obs: O valor do *pré-agendamento (R$ 20,00)* será descontado no valor total do procedimento. ');
  waLines.push('\n\n*Em caso de imprevisto, reagendamento com a antecedência mínima de 1h*');
  waLines.push('\n*Tolerância de atraso de 15 min*');
  waLines.push('\n*Caso falte, não haverá ressarcimento do valor do agendamento.*');
  waLines.push('\n Após o pagamento via Pix ou link, envie seu comprovante via WhatsApp.');
  waLines.push('\n\nCartão 💳: https://cielolink.com.br/4htomi0');
  waLines.push('\n\n Pix ❖: 62991300232');
  waLines.push('\n*Obrigado!* 🙏');

  waLines.push('\n');
  waLines.push(`Olá, sou *${formData.clientName}* e gostaria de pré-agendar o(s) serviço(s):`);
  waLines.push(''); 

  summarySections.forEach(sec => {
    waLines.push(`*${sec.label}:*`);
    waLines.push(...sec.value.split('\n'));
    waLines.push('');
  });

  const waText = waLines.join('\n');

  // 5) Limpa o telefone e monta a URL
  const telClean = formData.phone.replace(/\D/g, '');
  const waNumber = telClean.startsWith('55') ? telClean : '55' + telClean;
  const waNumber2 = 5562991300232;
  const waNumber3 = 5521983398168;
  const waBtn = document.getElementById('whatsapp-btn');
  waBtn.href = `https://api.whatsapp.com/send?phone=${waNumber2}&text=${encodeURIComponent(waText)}`;
}





  // loadTimes();

  showStep(1);
});
