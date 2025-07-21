// js/include.js
async function includeHTML() {
  const includeEls = document.querySelectorAll('#header, #footer');
  for (const el of includeEls) {
    // monta o path relativo: 'partials/header.html' ou 'partials/footer.html'
    const file = `partials/${el.id}.html`;
    try {
      const resp = await fetch(file);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      el.innerHTML = await resp.text();
    } catch (e) {
      console.error('Não foi possível carregar', file, e);
    }
  }
}

document.addEventListener('DOMContentLoaded', includeHTML);
