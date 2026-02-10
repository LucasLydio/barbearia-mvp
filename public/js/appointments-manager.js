/* js/appointments-manager.js
   AppointmentsManager: friendly component + modals
   Requires:
   - Bootstrap icons in page
   - Your modal CSS .modal-bg/.modal-card (same you already use)
   - Endpoints:
     /barbers-get?page&limit&name
     /services-get?page&limit&name (or limit=100)
     /appointments-get?date&barber_id&page&limit&client_name
     /appointments-put  (PUT)
     /appointments-post (POST)
     /appointments-delete (DELETE) { appointment_id }
     /clients-get?page&limit&name
     /clients-post (optional; used to create INDISPONIVEL if missing)
*/

window.AppointmentsManager = (function () {
  const state = {
    role: null,
    loggedBarberId: null,

    dateYMD: "",
    clientFilter: "",
    selectedBarberId: "", // for filtering and default scope

    // appointments pagination
    apPage: 1,
    apLimit: 10,
    apCount: 0,
    apData: [],

    // barber pickers
    barberPage: 1,
    barberLimit: 6,
    barberCount: 0,
    barberQuery: "",
    barbersCache: [],

    // edit modal pickers
    editBarberPage: 1,
    editBarberLimit: 6,
    editBarberCount: 0,
    editBarberQuery: "",
    editSelectedServiceIds: new Set(),
    editServiceQuery: "",
    editServicePage: 1,
    editServiceLimit: 6,
    editServiceCount: 0,
    servicesCache: [],

    // availability
    availSelectedTimes: new Set(),
    availBlockedByTime: new Map(), // time -> appointment object (only "INDISPONIVEL" blocks we created)
    unavailableClientId: null,
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function safeText(v) {
    return (v ?? "").toString();
  }

  function formatTimeHHMM(t) {
    if (!t) return "—";
    return safeText(t).slice(0, 5);
  }

  // Avoid timezone shifting: keep date string YYYY-MM-DD and display as DD/MM/YYYY
  function formatDateBR(ymd) {
    if (!ymd || typeof ymd !== "string") return "—";
    const [y, m, d] = ymd.split("-");
    if (!y || !m || !d) return "—";
    return `${d}/${m}/${y}`;
  }

  function show(el, visible) {
    if (!el) return;
    el.style.display = visible ? "flex" : "none";
  }

  function setLoading(container, msg) {
    if (!container) return;
    container.innerHTML = `
      <div class="text-center py-4">
        <div class="fw-bold">${msg || "Carregando..."}</div>
        <div class="spinner-border text-danger mt-2" role="status"></div>
      </div>
    `;
  }

  function debounce(fn, ms = 350) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function decodeToken(token) {
    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  }

  // ---------------------------
  // API helpers
  // ---------------------------
  async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET failed: ${res.status}`);
    return res.json();
  }

  async function apiPost(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.error) throw new Error(json?.error || `POST failed: ${res.status}`);
    return json;
  }

  async function apiPut(url, payload) {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.error) throw new Error(json?.error || `PUT failed: ${res.status}`);
    return json;
  }

  async function apiDelete(url, payload) {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.error) throw new Error(json?.error || `DELETE failed: ${res.status}`);
    return json;
  }

  // ---------------------------
  // Load barbers (paginated)
  // ---------------------------
  async function loadBarbersInto(container, pagination, opts) {
    const { query, page, limit, onSelect, selectedId, scope } = opts;

    let url = `/.netlify/functions/barbers-get?page=${page}&limit=${limit}`;
    if (query && query.trim().length > 1) url += `&name=${encodeURIComponent(query.trim())}`;

    setLoading(container, "Carregando barbeiros...");
    if (pagination) pagination.innerHTML = "";

    const { data, count } = await apiGet(url);
    const list = Array.isArray(data) ? data : [];
    const total = count || 0;

    if (!list.length) {
      container.innerHTML = `<div class="text-muted py-2">Nenhum barbeiro encontrado.</div>`;
      if (pagination) pagination.innerHTML = "";
      return { list: [], count: 0 };
    }

    container.innerHTML = list
      .map(
        (b) => `
      <label class="form-check-label d-flex align-items-center border rounded px-3 py-2 bg-transparent shadow-sm mb-2">
        <input
          type="radio"
          class="form-check-input me-2"
          name="${scope}"
          value="${b.id}"
          data-name="${safeText(b.name)}"
          ${b.id === selectedId ? "checked" : ""}
        />
        <span class="fw-bold">${safeText(b.name)}</span>
      </label>`
      )
      .join("");

    container.querySelectorAll(`input[name="${scope}"]`).forEach((input) => {
      input.addEventListener("change", () => {
        const id = input.value;
        const name = input.getAttribute("data-name") || "";
        onSelect({ id, name });
      });
    });

    renderPager(pagination, page, limit, total, (nextPage) => {
      opts.onPage(nextPage);
    });

    return { list, count: total };
  }

  function renderPager(container, page, limit, total, onPage) {
    if (!container) return;
    const totalPages = Math.ceil((total || 0) / (limit || 1));
    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <button class="btn btn-sm btn-outline-dark" ${page <= 1 ? "disabled" : ""} data-p="prev">
        <i class="bi bi-chevron-left"></i> Anterior
      </button>
      <small class="text-muted">Página ${page} de ${totalPages}</small>
      <button class="btn btn-sm btn-outline-dark" ${page >= totalPages ? "disabled" : ""} data-p="next">
        Próxima <i class="bi bi-chevron-right"></i>
      </button>
    `;

    container.querySelector('[data-p="prev"]')?.addEventListener("click", () => onPage(page - 1));
    container.querySelector('[data-p="next"]')?.addEventListener("click", () => onPage(page + 1));
  }

  // ---------------------------
  // Services picker (paginated, multi)
  // ---------------------------
  async function loadServicesList(container, pagination) {
    let url = `/.netlify/functions/services-get?page=${state.editServicePage}&limit=${state.editServiceLimit}`;
    if (state.editServiceQuery && state.editServiceQuery.trim().length > 1) {
      url += `&name=${encodeURIComponent(state.editServiceQuery.trim())}`;
    }

    setLoading(container, "Carregando serviços...");
    if (pagination) pagination.innerHTML = "";

    const { data, count } = await apiGet(url);
    const services = Array.isArray(data) ? data : [];
    state.editServiceCount = count || 0;

    if (!services.length) {
      container.innerHTML = `<div class="text-muted py-2">Nenhum serviço encontrado.</div>`;
      return;
    }

    container.innerHTML = services
      .map((s) => {
        const checked = state.editSelectedServiceIds.has(s.id);
        return `
          <label class="form-check-label d-flex align-items-center border rounded px-3 py-2 bg-transparent shadow-sm mb-2">
            <input
              type="checkbox"
              class="form-check-input me-2"
              value="${s.id}"
              data-name="${safeText(s.name)}"
              ${checked ? "checked" : ""}
            />
            <span class="fw-bold">${safeText(s.name)}</span>
            <span class="ms-auto text-muted small">
              ${s.price != null ? `R$ ${Number(s.price).toFixed(2)}` : ""}
            </span>
          </label>
        `;
      })
      .join("");

    container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.value;
        if (cb.checked) state.editSelectedServiceIds.add(id);
        else state.editSelectedServiceIds.delete(id);
      });
    });

    renderPager(pagination, state.editServicePage, state.editServiceLimit, state.editServiceCount, (p) => {
      state.editServicePage = p;
      loadServicesList(container, pagination);
    });
  }

  // ---------------------------
  // Appointments load + render
  // ---------------------------
  async function loadAppointments() {
    if (!state.dateYMD) return;

    let url = `/.netlify/functions/appointments-get?page=${state.apPage}&limit=${state.apLimit}&date=${encodeURIComponent(
      state.dateYMD
    )}`;

    // IMPORTANT: collaborator should only see their own
    const effectiveBarberId =
      state.role?.toLowerCase() === "colaborador" ? state.loggedBarberId : state.selectedBarberId;

    if (effectiveBarberId) url += `&barber_id=${encodeURIComponent(effectiveBarberId)}`;

    if (state.clientFilter && state.clientFilter.trim().length > 1) {
      url += `&client_name=${encodeURIComponent(state.clientFilter.trim())}`;
    }

    setLoading(els.list, "Carregando agendamentos...");
    els.pagination.innerHTML = "";

    const { data, count } = await apiGet(url);
    state.apData = Array.isArray(data) ? data : [];
    state.apCount = count || 0;

    renderAppointments();
  }

  function appointmentServiceNames(appt) {
    const arr = Array.isArray(appt?.appointment_services) ? appt.appointment_services : [];
    return arr
      .map((x) => x?.services?.name)
      .filter(Boolean)
      .join(", ");
  }

function renderAppointments() {
  const list = Array.isArray(state.apData) ? [...state.apData] : [];

  if (!list.length) {
    els.list.innerHTML = `<div class="text-center text-muted py-4">Nenhum agendamento nesta data.</div>`;
    els.pagination.innerHTML = "";
    return;
  }

  // Helper: pega hora em minutos (HH:MM:SS -> HH:MM)
  const toMinutes = (t) => {
    const hhmm = safeText(t).slice(0, 5); // "HH:MM"
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
  };

  // Divide manhã/tarde
  const manha = [];
  const tarde = [];

  list.forEach((ag) => {
    const mins = toMinutes(ag?.time);
    if (mins < 12 * 60) manha.push(ag);
    else tarde.push(ag);
  });

const sortByTimeAsc = (a, b) => safeText(a.time).localeCompare(safeText(b.time));

manha.sort(sortByTimeAsc);
tarde.sort(sortByTimeAsc);

  const renderCard = (ag) => {
    const servicos = appointmentServiceNames(ag) || "—";
    const clientName = ag?.clients?.name || "—";
    const barberName = ag?.barbers?.name || "—";
    const status = ag?.status || "Aguardando";
    const isUnavailable = (clientName || "").toLowerCase() === "indisponivel";

    return `
      <div class="booking-card d-flex flex-wrap align-items-center justify-content-between mb-3 shadow-sm border rounded-3 px-3 py-3"
           data-id="${ag.id}">
        <div class="d-flex align-items-center gap-3">
          <div class="icon bg-secondary text-white d-flex align-items-center justify-content-center rounded-circle"
               style="width:48px;height:48px;font-size:1.7rem;">
            <i class="bi ${isUnavailable ? "bi-slash-circle" : "bi-person"}"></i>
          </div>
          <div>
            <div class="fw-bold fs-6">${safeText(clientName)}</div>
            <div class="small text-muted">${safeText(servicos)}</div>
            <div class="small text-muted">Barbeiro: <b>${safeText(barberName)}</b></div>
            <span class="badge bg-${getStatusColor(status)} mt-1">${safeText(status)}</span>
          </div>
        </div>

        <div class="d-flex flex-column align-items-end gap-2">
          <span class="fw-semibold fs-5">${formatTimeHHMM(ag.time)}</span>
          <div class="d-flex flex-wrap gap-3">
            <button class="btn btn-outline-dark btn-sm" data-action="edit" data-id="${ag.id}" title="Editar">
              Editar <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${ag.id}" title="Deletar">
              Deletar <i class="bi bi-trash"></i>
            </button>
            <button class="btn btn-outline-secondary btn-sm" data-action="toggleUnavailable" data-id="${ag.id}" title="Bloquear/Desbloquear horário">
              Bloquear/Desbloquear horário <i class="bi bi-slash-circle"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  };

  const section = (title, arr, emptyText) => `
    <div class="mt-3 mb-2"><strong>${title}</strong></div>
    <div class="mt-3 mb-2 section-time">
    ${
      arr.length
        ? arr.map(renderCard).join("")
        : `<div class="text-muted py-2">${emptyText}</div>`
    }
    </div>
  `;

  els.list.innerHTML = `
    ${section("Manhã", manha, "Nenhum agendamento pela manhã.")}
    ${section("Tarde", tarde, "Nenhum agendamento à tarde.")}
  `;

  // Paginação (continua igual)
  renderPager(els.pagination, state.apPage, state.apLimit, state.apCount, (p) => {
    state.apPage = p;
    loadAppointments();
  });
}


  function getStatusColor(status) {
    switch ((status || "").toLowerCase()) {
      case "confirmado":
        return "success";
      case "aguardando":
        return "warning";
      case "cancelado":
        return "danger";
      default:
        return "secondary";
    }
  }

  // ---------------------------
  // Edit modal
  // ---------------------------
  function openEditModal(appt) {
    if (!appt) return;

    show(els.editModal, true);

    $("amEditId").value = appt.id;
    $("amEditDate").value = appt.date || state.dateYMD;
    $("amEditTime").value = formatTimeHHMM(appt.time) !== "—" ? formatTimeHHMM(appt.time) : "";
    $("amEditNote").value = appt.note || "";

    const clientName = appt?.clients?.name || "—";
    const barberName = appt?.barbers?.name || "—";
    const serviceNames = appointmentServiceNames(appt) || "—";
    $("amEditTitle").textContent = `${clientName} • ${formatDateBR(appt.date || state.dateYMD)} • ${formatTimeHHMM(appt.time)}`;
    $("amEditSubtitle").textContent = `Barbeiro: ${barberName} • Serviços: ${serviceNames}`;

    // barber selection inside modal
    $("amEditBarberId").value = appt.barber_id || state.selectedBarberId || state.loggedBarberId || "";
    state.editBarberQuery = "";
    state.editBarberPage = 1;

    // services selection inside modal (multi)
    state.editSelectedServiceIds.clear();
    (appt?.appointment_services || []).forEach((x) => {
      if (x?.service_id) state.editSelectedServiceIds.add(x.service_id);
    });
    state.editServiceQuery = "";
    state.editServicePage = 1;

    // load pickers
    loadBarbersInto(els.editBarberList, els.editBarberPagination, {
      query: state.editBarberQuery,
      page: state.editBarberPage,
      limit: state.editBarberLimit,
      selectedId: $("amEditBarberId").value,
      scope: "amEditBarberRadio",
      onSelect: ({ id }) => {
        $("amEditBarberId").value = id;
      },
      onPage: (p) => {
        state.editBarberPage = p;
        loadBarbersInto(els.editBarberList, els.editBarberPagination, {
          query: state.editBarberQuery,
          page: state.editBarberPage,
          limit: state.editBarberLimit,
          selectedId: $("amEditBarberId").value,
          scope: "amEditBarberRadio",
          onSelect: ({ id }) => {
            $("amEditBarberId").value = id;
          },
          onPage: () => {},
        });
      },
    });

    loadServicesList(els.editServiceList, els.editServicePagination);
  }

  async function saveEdit(e) {
    e.preventDefault();

    const id = $("amEditId").value;
    const date = $("amEditDate").value;
    const time = $("amEditTime").value;
    const barber_id = $("amEditBarberId").value;
    const note = $("amEditNote").value;

    const service_id = Array.from(state.editSelectedServiceIds);

    if (!id || !date || !time || !barber_id || service_id.length === 0) {
      alert("Preencha data, hora, barbeiro e selecione pelo menos 1 serviço.");
      return;
    }

    const btn = $("amEditSaveBtn");
    btn.disabled = true;
    btn.innerHTML = `Salvando... <i class="bi bi-clock-history ms-1"></i>`;

    try {
      const payload = { appointment_id: id, date, time, barber_id, service_id, note };
      await apiPut("/.netlify/functions/appointments-put", payload);

      show(els.editModal, false);
      await loadAppointments();
    } catch (err) {
      alert(err.message || "Erro ao salvar.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `Salvar alterações <i class="bi bi-check2-circle ms-1"></i>`;
    }
  }

  // ---------------------------
  // Availability modal (block/unblock)
  // ---------------------------
  function buildDayTimes() {
    // 09:00 -> 19:00 (every 30min), excluding 09:00 and 19:30 like your pattern
    const times = [];
    for (let h = 9; h <= 19; h++) {
      ["00", "30"].forEach((min) => {
        if (h === 19 && min === "30") return;
        if (h === 9 && min === "00") return;
        times.push(`${String(h).padStart(2, "0")}:${min}`);
      });
    }
    return times;
  }

  async function ensureUnavailableClient() {
    if (state.unavailableClientId) return state.unavailableClientId;

    // Try find
    try {
      const q = encodeURIComponent("INDISPONIVEL");
      const { data } = await apiGet(`/.netlify/functions/clients-get?page=1&limit=5&name=${q}`);
      const list = Array.isArray(data) ? data : [];
      const found = list.find((c) => (c?.name || "").toLowerCase() === "indisponivel");
      if (found?.id) {
        state.unavailableClientId = found.id;
        return found.id;
      }
    } catch {
      // ignore; we'll try create
    }

    // If you have clients-post, create it (recommended).
    // If you don't, create it manually once in DB and this will still work.
    try {
      const created = await apiPost("/.netlify/functions/clients-post", {
        name: "INDISPONIVEL",
        telephone: "0000000000",
        email: "indisponivel@valette.local",
      });
      const id = created?.data?.id;
      if (id) {
        state.unavailableClientId = id;
        return id;
      }
    } catch (err) {
      alert(
        "Não encontrei o cliente INDISPONIVEL. Crie 1 cliente com nome exatamente 'INDISPONIVEL' (uma vez) e tente novamente."
      );
      throw err;
    }

    throw new Error("Não foi possível obter o cliente INDISPONIVEL.");
  }

  async function openAvailabilityModal() {
    // date defaults to current selected component date
    $("amAvailDate").value = state.dateYMD;
    state.availSelectedTimes.clear();
    state.availBlockedByTime.clear();

    // scope default: if no barber selected, force all
    const canScopeOne = !!getEffectiveSelectedBarber();
    $("amAvailScope").value = canScopeOne ? "one" : "all";

    show(els.availModal, true);

    // preload blocked times (for selected barber only, because unblock needs appointment ids)
    await loadBlockedTimesForScope();
    renderAvailabilityGrid();
  }

  function getEffectiveSelectedBarber() {
    // collaborator: must use own
    if (state.role?.toLowerCase() === "colaborador") return state.loggedBarberId;
    return state.selectedBarberId || "";
  }

  async function fetchDayAppointmentsForBarber(dateYMD, barberId) {
    let url = `/.netlify/functions/appointments-get?date=${encodeURIComponent(dateYMD)}&limit=200`;
    if (barberId) url += `&barber_id=${encodeURIComponent(barberId)}`;
    const { data } = await apiGet(url);
    return Array.isArray(data) ? data : [];
  }

  async function loadBlockedTimesForScope() {
    const dateYMD = $("amAvailDate").value || state.dateYMD;
    const scope = $("amAvailScope").value;

    state.availBlockedByTime.clear();

    if (scope === "one") {
      const barberId = getEffectiveSelectedBarber();
      if (!barberId) return;

      const appts = await fetchDayAppointmentsForBarber(dateYMD, barberId);
      appts.forEach((a) => {
        const clientName = (a?.clients?.name || "").toLowerCase();
        if (clientName === "indisponivel" && a?.time) {
          state.availBlockedByTime.set(formatTimeHHMM(a.time), a);
        }
      });
    } else {
      // all: we still render grid, but "unblock" needs knowing appointment per barber.
      // We'll load all barbers later in apply step (safe).
    }
  }

  function renderAvailabilityGrid() {
    const grid = els.availGrid;
    grid.innerHTML = "";

    const times = buildDayTimes();

    times.forEach((t) => {
      const isBlocked = state.availBlockedByTime.has(t);
      const isSelected = state.availSelectedTimes.has(t);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `btn btn-sm ${isBlocked ? "btn-outline-danger" : "btn-outline-dark"} ${
        isSelected ? "active" : ""
      }`;
      btn.textContent = isBlocked ? `${t} (bloqueado)` : t;
      btn.dataset.time = t;

      btn.addEventListener("click", () => {
        if (state.availSelectedTimes.has(t)) state.availSelectedTimes.delete(t);
        else state.availSelectedTimes.add(t);
        renderAvailabilityGrid();
      });

      grid.appendChild(btn);
    });
  }

  async function applyAvailability() {
    const btn = $("amAvailApply");
    btn.disabled = true;
    btn.innerHTML = `Aplicando... <i class="bi bi-clock-history ms-1"></i>`;

    try {
      const dateYMD = $("amAvailDate").value || state.dateYMD;
      const scope = $("amAvailScope").value;

      if (!dateYMD) throw new Error("Selecione uma data.");
      if (state.availSelectedTimes.size === 0) throw new Error("Selecione pelo menos 1 horário.");

      const unavailableClientId = await ensureUnavailableClient();

      // We need a service_id even for unavailable blocks.
      // We'll pick the first service from services-get?limit=100 (or create a service "Bloqueio" if you prefer).
      const servicesJson = await apiGet("/.netlify/functions/services-get?limit=100");
      const services = Array.isArray(servicesJson?.data) ? servicesJson.data : [];
      if (!services.length) throw new Error("Cadastre ao menos 1 serviço para permitir bloqueios.");
      const defaultServiceId = services[0].id;

      const timesToProcess = Array.from(state.availSelectedTimes);

      if (scope === "one") {
        const barberId = getEffectiveSelectedBarber();
        if (!barberId) throw new Error("Selecione um barbeiro no componente antes.");

        // toggle: if blocked -> delete; else -> create
        for (const time of timesToProcess) {
          const blocked = state.availBlockedByTime.get(time);
          if (blocked?.id) {
            await apiDelete("/.netlify/functions/appointments-delete", { appointment_id: blocked.id });
          } else {
            await apiPost("/.netlify/functions/appointments-post", {
              date: dateYMD,
              time,
              barber_id: barberId,
              client_id: unavailableClientId,
              service_id: [defaultServiceId],
              note: "Horário indisponível",
            });
          }
        }
      } else {
        // all barbers: load barbers list (paginate through by requesting big limit or paging)
        const allBarbers = [];
        let p = 1;
        const limit = 50;

        while (true) {
          const { data, count } = await apiGet(`/.netlify/functions/barbers-get?page=${p}&limit=${limit}`);
          const chunk = Array.isArray(data) ? data : [];
          allBarbers.push(...chunk);
          if (allBarbers.length >= (count || 0) || chunk.length === 0) break;
          p++;
          if (p > 10) break; // safety
        }

        if (!allBarbers.length) throw new Error("Nenhum barbeiro encontrado.");

        // For each barber + time: try find existing unavailable appt and toggle
        for (const b of allBarbers) {
          const appts = await fetchDayAppointmentsForBarber(dateYMD, b.id);

          const blockedMap = new Map();
          appts.forEach((a) => {
            const clientName = (a?.clients?.name || "").toLowerCase();
            if (clientName === "indisponivel" && a?.time) blockedMap.set(formatTimeHHMM(a.time), a);
          });

          for (const time of timesToProcess) {
            const blocked = blockedMap.get(time);
            if (blocked?.id) {
              await apiDelete("/.netlify/functions/appointments-delete", { appointment_id: blocked.id });
            } else {
              await apiPost("/.netlify/functions/appointments-post", {
                date: dateYMD,
                time,
                barber_id: b.id,
                client_id: unavailableClientId,
                service_id: [defaultServiceId],
                note: "Horário indisponível (todos)",
              });
            }
          }
        }
      }

      // refresh
      show(els.availModal, false);
      await loadAppointments();
    } catch (err) {
      alert(err.message || "Erro ao aplicar indisponibilidade.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `Aplicar <i class="bi bi-check2 ms-1"></i>`;
    }
  }

  // ---------------------------
  // List actions (edit/delete/toggle unavailable)
  // ---------------------------
  async function handleListClick(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    const appt = (state.apData || []).find((x) => x.id === id);
    if (!appt) return;

    if (action === "edit") {
      openEditModal(appt);
      return;
    }

    if (action === "delete") {
      if (!confirm("Tem certeza que deseja deletar este agendamento?")) return;
      try {
        await apiDelete("/.netlify/functions/appointments-delete", { appointment_id: id });
        await loadAppointments();
      } catch (err) {
        alert(err.message || "Erro ao deletar.");
      }
      return;
    }

    if (action === "toggleUnavailable") {
      // Quick toggle for THIS appointment time + barber:
      // If this appointment is already INDISPONIVEL -> delete it
      // Else create an INDISPONIVEL at same time+date for same barber (only if time free)
      try {
        const clientName = (appt?.clients?.name || "").toLowerCase();
        if (clientName === "indisponivel") {
          if (!confirm("Desbloquear este horário (remover INDISPONIVEL)?")) return;
          await apiDelete("/.netlify/functions/appointments-delete", { appointment_id: appt.id });
        } else {
          if (!confirm("Bloquear este horário para este barbeiro (criar INDISPONIVEL)?")) return;

          const unavailableClientId = await ensureUnavailableClient();

          const servicesJson = await apiGet("/.netlify/functions/services-get?limit=100");
          const services = Array.isArray(servicesJson?.data) ? servicesJson.data : [];
          if (!services.length) throw new Error("Cadastre ao menos 1 serviço para permitir bloqueios.");
          const defaultServiceId = services[0].id;

          await apiPost("/.netlify/functions/appointments-post", {
            date: appt.date,
            time: formatTimeHHMM(appt.time),
            barber_id: appt.barber_id,
            client_id: unavailableClientId,
            service_id: [defaultServiceId],
            note: "Horário indisponível",
          });
        }

        await loadAppointments();
      } catch (err) {
        alert(err.message || "Erro ao alternar indisponível.");
      }
    }
  }

  // ---------------------------
  // Main barber picker (search + pagination)
  // ---------------------------
  async function loadMainBarbers() {
    await loadBarbersInto(els.barberList, els.barberPagination, {
      query: state.barberQuery,
      page: state.barberPage,
      limit: state.barberLimit,
      selectedId: state.selectedBarberId,
      scope: "amBarberRadio",
      onSelect: ({ id, name }) => {
        state.selectedBarberId = id;
        $("amBarberId").value = id;
        $("amBarberSelectedLabel").textContent = `Selecionado: ${name}`;
        state.apPage = 1;
        loadAppointments();
      },
      onPage: (p) => {
        state.barberPage = p;
        loadMainBarbers();
      },
    });
  }

  // ---------------------------
  // Init
  // ---------------------------
  function init(opts = {}) {
    // token from barber login
    const tokenKey = opts.tokenKey || "valette_barber_token";
    const token = localStorage.getItem(tokenKey);
    const barber = token ? decodeToken(token) : null;

    state.loggedBarberId = barber?.id || null;
    state.role = barber?.role || null;

    // bind elements (guarded)
    els.date = $("amDate");
    els.clientFilter = $("amClientFilter");
    els.list = $("amList");
    els.pagination = $("amPagination");

    els.barberSearch = $("amBarberSearch");
    els.barberList = $("amBarberList");
    els.barberPagination = $("amBarberPagination");
    els.clearBarber = $("amClearBarber");

    els.editModal = $("amEditModal");
    els.editClose = $("amEditClose");
    els.editForm = $("amEditForm");
    els.editBarberSearch = $("amEditBarberSearch");
    els.editBarberList = $("amEditBarberList");
    els.editBarberPagination = $("amEditBarberPagination");
    els.editServiceSearch = $("amEditServiceSearch");
    els.editServiceList = $("amEditServiceList");
    els.editServicePagination = $("amEditServicePagination");

    els.availModal = $("amAvailModal");
    els.availClose = $("amAvailClose");
    els.availGrid = $("amAvailGrid");

    const openAvail = $("amOpenAvailability");
    const availApply = $("amAvailApply");
    const availDate = $("amAvailDate");
    const availScope = $("amAvailScope");

    // Ensure required containers exist
    if (!els.date || !els.list) {
      console.warn("AppointmentsManager: missing required DOM elements.");
      return;
    }

    // Default date = today
    const today = new Date().toISOString().slice(0, 10);
    els.date.value = today;
    state.dateYMD = today;

    // If collaborator, auto-select his barber and hide main barber picker UI (optional)
    if (state.role?.toLowerCase() === "colaborador") {
      // Preselect
      state.selectedBarberId = state.loggedBarberId || "";
      $("amBarberId").value = state.selectedBarberId;

      // Make UI clearer:
      $("amBarberSelectedLabel").textContent = "Você está logado como Colaborador (somente seus agendamentos).";
      // Still allow list rendering without user selecting
    }

    // Events: date
    els.date.addEventListener("change", () => {
      state.dateYMD = els.date.value;
      state.apPage = 1;
      loadAppointments();
    });

    // Events: client filter
    els.clientFilter.addEventListener(
      "input",
      debounce(() => {
        state.clientFilter = els.clientFilter.value || "";
        state.apPage = 1;
        loadAppointments();
      }, 350)
    );

    // Barber search + pagination
    if (els.barberSearch) {
      els.barberSearch.addEventListener(
        "input",
        debounce(() => {
          state.barberQuery = els.barberSearch.value || "";
          state.barberPage = 1;
          loadMainBarbers();
        }, 300)
      );
    }

    if (els.clearBarber) {
      els.clearBarber.addEventListener("click", () => {
        if (state.role?.toLowerCase() === "colaborador") return; // collaborator can't clear
        state.selectedBarberId = "";
        $("amBarberId").value = "";
        $("amBarberSelectedLabel").textContent = "Nenhum barbeiro selecionado";
        state.apPage = 1;
        loadAppointments();
      });
    }

    // List actions (delegation)
    els.list.addEventListener("click", handleListClick);

    // Edit modal close
    els.editClose?.addEventListener("click", () => show(els.editModal, false));

    // Edit modal form submit
    els.editForm?.addEventListener("submit", saveEdit);

    // Edit barber search
    els.editBarberSearch?.addEventListener(
      "input",
      debounce(() => {
        state.editBarberQuery = els.editBarberSearch.value || "";
        state.editBarberPage = 1;
        loadBarbersInto(els.editBarberList, els.editBarberPagination, {
          query: state.editBarberQuery,
          page: state.editBarberPage,
          limit: state.editBarberLimit,
          selectedId: $("amEditBarberId").value,
          scope: "amEditBarberRadio",
          onSelect: ({ id }) => {
            $("amEditBarberId").value = id;
          },
          onPage: (p) => {
            state.editBarberPage = p;
            // re-call with same opts
            loadBarbersInto(els.editBarberList, els.editBarberPagination, {
              query: state.editBarberQuery,
              page: state.editBarberPage,
              limit: state.editBarberLimit,
              selectedId: $("amEditBarberId").value,
              scope: "amEditBarberRadio",
              onSelect: ({ id }) => {
                $("amEditBarberId").value = id;
              },
              onPage: () => {},
            });
          },
        });
      }, 300)
    );

    // Edit services search
    els.editServiceSearch?.addEventListener(
      "input",
      debounce(() => {
        state.editServiceQuery = els.editServiceSearch.value || "";
        state.editServicePage = 1;
        loadServicesList(els.editServiceList, els.editServicePagination);
      }, 300)
    );

    // Availability modal open/close/apply/date/scope
    openAvail?.addEventListener("click", async () => {
      try {
        // If collaborator and not loggedBarberId, block.
        if (state.role?.toLowerCase() === "colaborador" && !state.loggedBarberId) {
          alert("Seu login não possui barber_id.");
          return;
        }

        // If owner but no barber selected, still can open in "all" scope
        await openAvailabilityModal();
      } catch (err) {
        alert(err.message || "Erro ao abrir controle de horários.");
      }
    });

    els.availClose?.addEventListener("click", () => show(els.availModal, false));
    availApply?.addEventListener("click", applyAvailability);

    availDate?.addEventListener("change", async () => {
      await loadBlockedTimesForScope();
      renderAvailabilityGrid();
    });

    availScope?.addEventListener("change", async () => {
      await loadBlockedTimesForScope();
      renderAvailabilityGrid();
    });

    // Initial load
    loadMainBarbers().catch(() => {});
    loadAppointments().catch(() => {});
  }

  return { init };
})();
