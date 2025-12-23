/* availability-modal.js
 *
 * Modal to barber control available times by creating/removing "Indisponível" appointments.
 * - Opens with today by default (or uses selectedDate if you want)
 * - Inside modal you can change the date and it reloads the grid
 * - Click a time to mark it as BLOCK or UNBLOCK
 * - Saves by calling appointments-post / appointments-delete
 */

(function () {
  // =========================
  // CONFIG (adjust these!)
  // =========================
  // 1) Create in DB a client named "Indisponível" and put its UUID here:
  const UNAVAILABLE_CLIENT_ID = "53e7fd9d-f18a-4a2c-824b-48b4e039051c";

  // 2) You can use a specific "service" for blocks OR any existing service UUID:
  const UNAVAILABLE_SERVICE_ID = "6e0b8d08-850a-42c8-a315-e4bc344159f3";

  // Endpoints (your Netlify Functions)
  const APPT_GET_URL = "/.netlify/functions/appointments-get";
  const APPT_POST_URL = "/.netlify/functions/appointments-post";
  const APPT_DELETE_URL = "/.netlify/functions/appointments-delete";

  // =========================
  // DOM
  // =========================
  const openAvailabilityBtn = document.getElementById("openAvailability");

  const availabilityModal = document.getElementById("availabilityModal"); // modal bg/container
  const closeAvailabilityBtn = document.getElementById("closeAvailabilityModal");

  const availabilityDateInput = document.getElementById("availabilityDate");
  const reloadAvailabilityBtn = document.getElementById("reloadAvailability");

  const availabilityGrid = document.getElementById("availabilityGrid");
  const availabilitySearch = document.getElementById("availabilitySearch");

  const applyBlockBtn = document.getElementById("applyAvailability");

    document.getElementById('closeAvailabilityModal2')?.addEventListener('click', () => {
        document.getElementById('availabilityModal').style.display = 'none';
    });

  if (!availabilityModal || !availabilityGrid || !availabilityDateInput) {
    // If you load this file on pages without the modal, do nothing
    return;
  }

  // =========================
  // TOKEN / BARBER ID
  // =========================
  function decodeToken(token) {
    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  }

  const barberToken = localStorage.getItem("valette_barber_token");
  const barberData = barberToken ? decodeToken(barberToken) : null;
  const barber_id = barberData?.id;

  // =========================
  // STATE
  // =========================
  const availabilityState = {
    dateYMD: "",
    apptsByTime: new Map(), // time "HH:MM" -> appointment row
    pending: new Map(), // time "HH:MM" -> "block" | "unblock"
    loading: false,
  };

  // =========================
  // HELPERS
  // =========================
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function dateToYMD(dateObj) {
    const y = dateObj.getFullYear();
    const m = pad2(dateObj.getMonth() + 1);
    const d = pad2(dateObj.getDate());
    return `${y}-${m}-${d}`;
  }

  function ymdToBR(ymd) {
    return (ymd || "").split("-").reverse().join("/");
  }

  function setAvailabilityModalVisible(visible) {
    availabilityModal.style.display = visible ? "flex" : "none";
  }

  // Times: 09:30 ... 19:00 (30 min steps)
  function getDayTimes() {
    const times = [];
    for (let h = 9; h <= 19; h++) {
      ["00", "30"].forEach((min) => {
        if (h === 19 && min === "30") return; // skip 19:30
        if (h === 9 && min === "00") return;  // skip 09:00 if you want
        times.push(`${pad2(h)}:${min}`);
      });
    }
    return times;
  }

  function isBlockedAppointment(appt) {
    // Most reliable: compare client_id with your UNAVAILABLE_CLIENT_ID
    if (UNAVAILABLE_CLIENT_ID && appt?.client_id === UNAVAILABLE_CLIENT_ID) return true;

    // Fallback: if API includes clients name:
    const cname = (appt?.clients?.name || "").toLowerCase();
    if (cname === "indisponível" || cname === "indisponivel") return true;

    // Fallback: note marker
    const note = (appt?.note || "").toLowerCase();
    if (note.includes("indispon")) return true;

    return false;
  }

  function isBookedByRealClient(appt) {
    return !!appt && !isBlockedAppointment(appt);
  }

  function showGridLoading(text = "Carregando...") {
    availabilityGrid.innerHTML = `
      <div class="text-center py-3">
        ${text} <span class="spinner-border spinner-border-sm ms-2"></span>
      </div>
    `;
  }

  function safeTime(apptTime) {
    // Some DB returns "HH:MM:SS"
    if (!apptTime) return "";
    return String(apptTime).slice(0, 5);
  }

  // =========================
  // API
  // =========================
  async function fetchDayAppointmentsForBarber(dateYMD) {
    if (!barber_id) return [];

    const url =
      `${APPT_GET_URL}?date=${encodeURIComponent(dateYMD)}` +
      `&barber_id=${encodeURIComponent(barber_id)}` +
      `&limit=500`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro ao buscar agendamentos do dia.");
    const json = await res.json();
    return json.data || [];
  }

  async function createBlockedAppointment(dateYMD, timeHHMM) {
    const body = {
      date: dateYMD,
      time: timeHHMM,
      service_id: [UNAVAILABLE_SERVICE_ID], // your backend accepts array now
      barber_id,
      client_id: UNAVAILABLE_CLIENT_ID,
      note: "INDISPONÍVEL",
    };

    const res = await fetch(APPT_POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.error) {
      throw new Error(json?.error || "Erro ao bloquear horário.");
    }
    return json?.data;
  }

  async function deleteAppointment(appointment_id) {
    const res = await fetch(APPT_DELETE_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointment_id }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.error) {
      throw new Error(json?.error || "Erro ao remover bloqueio.");
    }
    return true;
  }

  // =========================
  // LOAD & RENDER
  // =========================
  async function loadAvailabilityForDate(dateYMD) {
    availabilityState.loading = true;
    availabilityState.dateYMD = dateYMD;
    availabilityState.apptsByTime.clear();
    availabilityState.pending.clear();

    showGridLoading(`Carregando horários de ${ymdToBR(dateYMD)}...`);

    const appts = await fetchDayAppointmentsForBarber(dateYMD);

    appts.forEach((a) => {
      const t = safeTime(a?.time);
      if (t) availabilityState.apptsByTime.set(t, a);
    });

    availabilityState.loading = false;
    renderAvailabilityGrid(availabilitySearch?.value || "");
  }

  function renderAvailabilityGrid(filterTerm = "") {
    const term = (filterTerm || "").trim().toLowerCase();
    const times = getDayTimes().filter((t) => (term ? t.includes(term) : true));

    const dateLabel = availabilityState.dateYMD ? ymdToBR(availabilityState.dateYMD) : "";
    const header = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="fw-bold">Horários - ${dateLabel}</div>
        <div class="small text-muted">
          Clique para bloquear/desbloquear
        </div>
      </div>
    `;

    const items = times
      .map((t) => {
        const appt = availabilityState.apptsByTime.get(t);
        const blocked = isBlockedAppointment(appt);
        const booked = isBookedByRealClient(appt);

        const pendingAction = availabilityState.pending.get(t); // "block" | "unblock"
        const pendingBadge =
          pendingAction === "block"
            ? `<span class="badge bg-warning text-dark ms-2">Bloquear</span>`
            : pendingAction === "unblock"
              ? `<span class="badge bg-info text-dark ms-2">Desbloquear</span>`
              : "";

        // visual classes
        let cls = "availability-chip border rounded px-3 py-2 d-flex justify-content-between align-items-center mb-2";
        let statusText = "Disponível";
        let statusCls = "ms-2 text-success";

        if (booked) {
          statusText = "Ocupado";
          statusCls = "ms-2 text-danger";
          cls += " opacity-75";
        } else if (blocked) {
          statusText = "Indisponível";
          statusCls = "text-secondary";
        }

        return `
          <button type="button"
            class="${cls}"
            data-time="${t}"
            ${booked ? "disabled" : ""}>
            <span class="fw-semibold">${t}</span>
            <span class="${statusCls}">
              ${statusText}
              ${pendingBadge}
            </span>
          </button>
        `;
      })
      .join("");

    availabilityGrid.innerHTML = header + (items || `<div class="text-muted py-2">Nenhum horário.</div>`);

    // click handlers
    availabilityGrid.querySelectorAll("button[data-time]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const time = btn.getAttribute("data-time");
        const appt = availabilityState.apptsByTime.get(time);
        const blocked = isBlockedAppointment(appt);

        // Toggle pending action:
        // - If time is currently blocked => click means "unblock"
        // - If time is available => click means "block"
        const current = availabilityState.pending.get(time);

        if (blocked) {
          // want UNBLOCK
          if (current === "unblock") availabilityState.pending.delete(time);
          else availabilityState.pending.set(time, "unblock");
        } else {
          // want BLOCK
          if (current === "block") availabilityState.pending.delete(time);
          else availabilityState.pending.set(time, "block");
        }

        renderAvailabilityGrid(availabilitySearch?.value || "");
      });
    });

    // enable/disable apply button
    if (applyBlockBtn) {
      const hasPending = availabilityState.pending.size > 0;
      applyBlockBtn.disabled = !hasPending;
      applyBlockBtn.innerHTML = hasPending
        ? `Salvar alterações (${availabilityState.pending.size})`
        : `Salvar alterações`;
    }
  }

  // =========================
  // OPEN / CLOSE / DATE CHANGE
  // =========================
  async function openAvailabilityModal(initialDate = new Date()) {
    if (!barber_id) {
      alert("Barbeiro não identificado. Faça login novamente.");
      return;
    }
    if (!UNAVAILABLE_CLIENT_ID || !UNAVAILABLE_SERVICE_ID) {
      alert("Configure UNAVAILABLE_CLIENT_ID e UNAVAILABLE_SERVICE_ID no arquivo availability-modal.js");
      return;
    }

    const ymd = dateToYMD(initialDate);
    availabilityDateInput.value = ymd;

    setAvailabilityModalVisible(true);
    await loadAvailabilityForDate(ymd);
  }

  // Open button: today by default
  openAvailabilityBtn?.addEventListener("click", async () => {
    // If you want: use selectedDate when exists
    // const base = (window.selectedDate instanceof Date) ? window.selectedDate : new Date();
    const base = new Date(); // always today (as you requested)
    await openAvailabilityModal(base);
  });

  closeAvailabilityBtn?.addEventListener("click", () => {
    setAvailabilityModalVisible(false);
  });

  availabilityDateInput?.addEventListener("change", async () => {
    const ymd = availabilityDateInput.value;
    if (!ymd) return;
    await loadAvailabilityForDate(ymd);
  });

  reloadAvailabilityBtn?.addEventListener("click", async () => {
    const ymd = availabilityDateInput.value;
    if (!ymd) return;
    await loadAvailabilityForDate(ymd);
  });

  availabilitySearch?.addEventListener("input", () => {
    renderAvailabilityGrid(availabilitySearch.value);
  });

  // =========================
  // APPLY CHANGES
  // =========================
  applyBlockBtn?.addEventListener("click", async () => {
    if (availabilityState.loading) return;
    if (!availabilityState.dateYMD) return;

    const entries = Array.from(availabilityState.pending.entries());
    if (!entries.length) return;

    applyBlockBtn.disabled = true;
    applyBlockBtn.innerHTML = `Salvando... <span class="spinner-border spinner-border-sm ms-2"></span>`;

    try {
      // Process sequentially (safer)
      for (const [time, action] of entries) {
        if (action === "block") {
          // If already has appointment (shouldn't if UI is correct), skip
          const existing = availabilityState.apptsByTime.get(time);
          if (!existing) {
            await createBlockedAppointment(availabilityState.dateYMD, time);
          }
        } else if (action === "unblock") {
          const appt = availabilityState.apptsByTime.get(time);
          if (appt?.id) {
            await deleteAppointment(appt.id);
          }
        }
      }

      // Reload after saving
      await loadAvailabilityForDate(availabilityState.dateYMD);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Erro ao salvar alterações.");
      // restore button state
      renderAvailabilityGrid(availabilitySearch?.value || "");
    } finally {
      applyBlockBtn.disabled = false;
    }
  });
})();
