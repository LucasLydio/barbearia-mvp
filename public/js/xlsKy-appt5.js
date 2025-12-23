// js/components/client-picker.js
(function () {
  const ClientPicker = (() => {
    const state = {
      page: 1,
      limit: 5,
      total: 0,
      query: "",
    };

    let els = null;

    function debounce(fn, wait = 300) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    }

    async function fetchClients({ page, limit, query }) {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (query && query.trim().length > 1) {
        params.set("name", query.trim());
      }

      const url = `/.netlify/functions/clients-get?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao buscar clientes");
      return await res.json(); // { data, count }
    }

    function setSelectedClient(client) {
      if (!els) return;

      els.hiddenId.value = client.id || "";

      els.selectedName.textContent = client.name || "—";
      els.selectedTel.textContent = client.telephone ? `Tel: ${client.telephone}` : "—";

      els.badge.style.display = client.id ? "inline-block" : "none";
    }

    function renderList(clients) {
      if (!clients?.length) {
        els.list.innerHTML = `<div class="text-muted py-2">Nenhum cliente encontrado.</div>`;
        return;
      }

      els.list.innerHTML = clients
        .map((c) => {
          const tel = c.telephone ? `(${c.telephone})` : "";
          const safeName = String(c.name || "—").replace(/"/g, "&quot;");
          const safeTel = String(c.telephone || "").replace(/"/g, "&quot;");

          return `
            <button
              type="button"
              class="btn w-100 text-start border rounded px-3 py-2 mb-2 d-flex justify-content-between align-items-center"
              data-client-id="${c.id}"
              data-client-name="${safeName}"
              data-client-tel="${safeTel}"
            >
              <span class="fw-semibold">${c.name || "—"} <span class="text-muted fw-normal">${tel}</span></span>
              <i class="bi bi-check2"></i>
            </button>
          `;
        })
        .join("");

      els.list.querySelectorAll("button[data-client-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          setSelectedClient({
            id: btn.dataset.clientId,
            name: btn.dataset.clientName,
            telephone: btn.dataset.clientTel,
          });
        });
      });
    }

    function renderPagination() {
      const totalPages = Math.max(1, Math.ceil(state.total / state.limit));

      if (totalPages <= 1) {
        els.pagination.innerHTML = "";
        return;
      }

      els.pagination.innerHTML = `
        <button class="btn btn-sm btn-outline-dark" id="clientPrev" ${state.page === 1 ? "disabled" : ""}>
          <i class="bi bi-chevron-left"></i> Anterior
        </button>

        <small class="text-muted">Página ${state.page} de ${totalPages}</small>

        <button class="btn btn-sm btn-outline-dark" id="clientNext" ${state.page === totalPages ? "disabled" : ""}>
          Próxima <i class="bi bi-chevron-right"></i>
        </button>
      `;

      els.pagination.querySelector("#clientPrev")?.addEventListener("click", () => load(state.query, state.page - 1));
      els.pagination.querySelector("#clientNext")?.addEventListener("click", () => load(state.query, state.page + 1));
    }

    async function load(query = "", page = 1) {
      if (!els) return;

      state.query = query;
      state.page = page;

      els.list.innerHTML = `<div class="text-center py-2">Carregando...</div>`;
      els.pagination.innerHTML = "";

      try {
        const { data, count } = await fetchClients({
          page: state.page,
          limit: state.limit,
          query: state.query,
        });

        state.total = count || 0;

        renderList(data || []);
        renderPagination();
      } catch (err) {
        els.list.innerHTML = `<div class="alert alert-danger">Falha ao carregar clientes.</div>`;
        console.error(err);
      }
    }

    /**
     * init({
     *   searchId, listId, paginationId,
     *   hiddenId, selectedNameId, selectedTelId, badgeId,
     *   limit? (optional)
     * })
     */
    function init(config) {
      els = {
        search: document.getElementById(config.searchId),
        list: document.getElementById(config.listId),
        pagination: document.getElementById(config.paginationId),
        hiddenId: document.getElementById(config.hiddenId),
        selectedName: document.getElementById(config.selectedNameId),
        selectedTel: document.getElementById(config.selectedTelId),
        badge: document.getElementById(config.badgeId),
      };

      if (!els.search || !els.list || !els.pagination || !els.hiddenId) {
        console.warn("[ClientPicker] Missing required elements. Check your IDs.", config);
        return;
      }

      if (config.limit && Number.isFinite(config.limit)) {
        state.limit = config.limit;
      }

      // reset selection UI each time init is called (optional)
      setSelectedClient({ id: "", name: "", telephone: "" });

      const onSearch = debounce(() => load(els.search.value, 1), 250);
      els.search.addEventListener("input", onSearch);

      load("", 1);
    }

    function getSelectedClientId() {
      return els?.hiddenId?.value || "";
    }

    return { init, load, getSelectedClientId };
  })();

  // Expose globally
  window.ClientPicker = ClientPicker;
})();
