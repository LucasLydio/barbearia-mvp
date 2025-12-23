document.getElementById('next4').onclick = async function() {
  const step4 = document.querySelector('.step[data-step="4"].active');
  const telephone = step4.querySelector('input[name="telephone"]').value.trim().replace(/\D/g, '');
  const name = step4.querySelector('input[name="clientName"]').value.trim().toUpperCase();
  const email = null;

    // console.log({ telephone, name, email }); 

    if (!telephone || !name ) {
        alert('Preencha todos os campos!');
        return;
    }

    
    if (!telephone || telephone.length < 9) {
      alert('Digite um número de telefone válido!');
      step4.querySelector('input[name="telephone"]').focus();
      return;
    }


    let client = await getClientByTelephone(telephone);
    if (!client) {
        client = await storeClient({ name, telephone, email });
    }

    formData.clientId = client.id;
    formData.clientName = name;
    formData.telephone = telephone;
    formData.email = email;

    window.showStep(5);
};


async function getClientByTelephone(telephone) {
  try {
    const res = await fetch(`/.netlify/functions/clients-get-true?telephone=${telephone}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.client || null;
  } catch (err) {
    return null;
  }
}


async function storeClient({ name, telephone, email }) {
  const res = await fetch('/.netlify/functions/clients-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, telephone, email })
  });
  if (!res.ok) throw new Error("Erro ao criar cliente");
  const json = await res.json();

  return json.data;
}
