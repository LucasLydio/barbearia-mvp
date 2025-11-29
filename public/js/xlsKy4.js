// Utilitário para decodificar o token Base64 salvo no localStorage
function decodeToken(token) {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {

  const token = localStorage.getItem('valette_barber_token');
  const barber = token ? decodeToken(token) : null;

  if (!barber) {
    window.location.href = '/xlsKy-login.html';
    return;
  }

  const h3 = document.querySelector('.welcome-card h3');
  if (h3) {
    h3.innerHTML = `Olá, ${barber.name || 'Barbeiro'}!`;
  }

  sessionStorage.setItem('client', JSON.stringify(barber));

});

// Exemplo de logout simples
function logout() {
  localStorage.removeItem('valette_barber_token');
  sessionStorage.removeItem('barber');
  window.location.href = '/xlsKy-login.html';
}
