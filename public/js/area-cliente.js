document.addEventListener('DOMContentLoaded', () => {
  const inputTel = document.querySelector('input[name="telephone"]');
  const btnEntrar = document.querySelector('.btn-dark');
  const btnCriarConta = document.querySelector('.btn-outline-dark');
  const loginForm = document.querySelector('.login form');

  // Evitar submit padrão
  loginForm.onsubmit = e => e.preventDefault();

  // Ao clicar em "Entrar"
  btnEntrar.onclick = async () => {
    const telefone = (inputTel.value || '').replace(/\D/g, '');

    if (!telefone || telefone.length < 9) {
      alert('Digite um número de telefone válido!');
      inputTel.focus();
      return;
    }

    btnEntrar.disabled = true;
    btnEntrar.innerHTML = 'Verificando... <i class="bi bi-clock-history ms-2"></i>';

    try {
      // Chama o backend!
      const url = `/.netlify/functions/clients-get-true?telephone=${telefone}`;
      const res = await fetch(url);
      const { exists, client, token } = await res.json();

      if (exists && token) {
        // Salva dados na session/localStorage e redireciona
        localStorage.setItem('valette_token', token);
        sessionStorage.setItem('client', JSON.stringify(client));
        // sessionStorage.setItem('client', JSON.stringify(client));
        alert('Login realizado com sucesso!');
        window.location.href = '/dashboard-cliente.html'; // coloque sua dashboard real aqui
      } else {
        alert('Telefone não cadastrado. Clique em "Criar Conta".');
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

  // Criar conta: leve para uma página de cadastro (ou abre modal)
  btnCriarConta.onclick = () => {
    window.location.href = '/criar-conta.html'; // ajuste para sua rota real de cadastro
  };

  // (opcional) permite "enter" no input para login
  inputTel.addEventListener('keypress', e => {
    if (e.key === 'Enter') btnEntrar.click();
  });
});
