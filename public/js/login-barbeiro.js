document.addEventListener('DOMContentLoaded', () => {
  const inputTel = document.querySelector('input[name="telephone"]');
  const inputPass = document.querySelector('input[name="password"]');
  const btnEntrar = document.querySelector('.btn-dark');
  const btnCriarConta = document.querySelector('.btn-outline-dark');
  const loginForm = document.querySelector('.login form');

  // Impede refresh
  loginForm.onsubmit = e => e.preventDefault();

  btnEntrar.onclick = async () => {
    const telefone = (inputTel.value || '').replace(/\D/g, '');
    const password = (inputPass.value || '').trim();

    // ======= VALIDAÇÕES =======
    if (!telefone || telefone.length < 9) {
      alert('Digite um número de telefone válido!');
      inputTel.focus();
      return;
    }

    if (!password) {
      alert('Digite a senha!');
      inputPass.focus();
      return;
    }

    if (password.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres!');
      inputPass.focus();
      return;
    }

    btnEntrar.disabled = true;
    btnEntrar.innerHTML = 'Verificando... <i class="bi bi-clock-history ms-2"></i>';

    try {
      const url = `/.netlify/functions/barbers-get-true?telephone=${telefone}&password=${password}`;

      const res = await fetch(url);
      const { exists, barber, token } = await res.json();

      if (exists && token) {

        localStorage.setItem('valette_barber_token', token);
        sessionStorage.setItem('barber', JSON.stringify(barber));

        alert('Login realizado com sucesso!');
        
        window.location.href = '/xlsKy.html';

      } else {
        alert('Barbeiro não encontrado ou senha incorreta.');
        inputTel.focus();
      }
    } catch (err) {
      alert('Erro ao conectar. Tente novamente.');
      console.error(err);
    } finally {
      btnEntrar.disabled = false;
      btnEntrar.innerHTML = 'Entrar <i class="bi bi-door-open ms-2"></i>';
    }
  };

  btnCriarConta.onclick = () => {
    window.location.href = '/xlsKy-register.html';
  };

  inputPass.addEventListener('keypress', e => {
    if (e.key === 'Enter') btnEntrar.click();
  });
});
