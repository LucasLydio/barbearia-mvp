const addClientBtn = document.getElementById('addClientBtn');
const addClientModal = document.getElementById('addClientModal');
const closeAddClientModal = document.getElementById('closeAddClientModal');
const addClientForm = document.getElementById('addClientForm');
const apptClientSelect = document.getElementById('apptClient');

addClientBtn.onclick = () => {
  addClientModal.style.display = 'flex';
  addClientForm.reset();
};
closeAddClientModal.onclick = () => {
  addClientModal.style.display = 'none';
};

addClientForm.onsubmit = async function(e) {
  e.preventDefault();
  const name = document.getElementById('newClientName').value.trim().toUpperCase();
  const telephone = document.getElementById('newClientTelephone').value.trim();
  const email = document.getElementById('newClientEmail').value.trim();

  if (!name || !telephone || !email) {
    alert("Preencha todos os campos.");
    return;
  }

  // Chama o endpoint para criar cliente
  const res = await fetch('/.netlify/functions/clients-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, telephone, email })
  });
  const { data, error } = await res.json();
  if (error || !data) {
    alert('Erro ao adicionar cliente!');
    return;
  }

  // Adiciona ao select (já selecionando)
  const option = document.createElement('option');
  option.value = data.id;
  option.textContent = `${data.name} (${data.telephone})`;
  option.selected = true;
  apptClientSelect.appendChild(option);

  addClientModal.style.display = 'none';
  alert('Cliente cadastrado!');
};
