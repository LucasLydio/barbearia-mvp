document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.login form');
  const btnCriarConta = document.querySelector('.btn-outline-dark');

  form.onsubmit = e => e.preventDefault();

  btnCriarConta.onclick = async () => {
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const telephone = (form.telephone.value || '').replace(/\D/g, '');

    // Validação simples
    if (!name || name.length < 3) {
      alert('Digite um nome válido.');
      form.name.focus();
      return;
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      alert('Digite um e-mail válido.');
      form.email.focus();
      return;
    }
    if (!telephone || telephone.length < 9) {
      alert('Digite um telefone válido.');
      form.telephone.focus();
      return;
    }

    btnCriarConta.disabled = true;
    btnCriarConta.innerHTML = 'Enviando... <i class="bi bi-clock-history ms-2"></i>';

    try {
      // Chama a API para criar o cliente
      const res = await fetch('/.netlify/functions/clients-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, telephone })
      });
      const { data, error } = await res.json();

      if (error || !data) {
        alert(error || 'Erro ao criar conta. Tente outro telefone/email.');
        return;
      }

      // Salva dados do cliente para sessão logada
      sessionStorage.setItem('client', JSON.stringify(data));
      alert('Conta criada com sucesso!');
      window.location.href = '/dashboard-cliente.html';

    } catch (err) {
      alert('Erro ao conectar. Tente novamente.');
      console.error(err);
    } finally {
      btnCriarConta.disabled = false;
      btnCriarConta.innerHTML = 'Criar Conta <i class="bi bi-person-circle ms-2"></i>';
    }
  };

  // (opcional) permite "Enter" para enviar o form
  form.addEventListener('keypress', e => {
    if (e.key === 'Enter') btnCriarConta.click();
  });
});
