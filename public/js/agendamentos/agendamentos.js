document.addEventListener('DOMContentLoaded', () => {

  const formData = {};
  window.formData = {};

  const steps = Array.from(document.querySelectorAll('.step'));
  const indicators = Array.from(document.querySelectorAll('.step-indicator'));

  let currentStep = 1;
  window.showStep = function(n) {
    steps.forEach(s => s.classList.toggle('active', +s.dataset.step === n));
    indicators.forEach((ind, i) =>
      ind.classList.toggle('active', i === n - 1)
    );
    currentStep = n;
  }

  document.getElementById('prev2').addEventListener('click', () => {

    showStep(1);
  });
  document.getElementById('prev4').addEventListener('click', () => {

    showStep(2);
  });
  document.getElementById('prev5').addEventListener('click', () => {

    showStep(4);
  });

  showStep(1);
});
