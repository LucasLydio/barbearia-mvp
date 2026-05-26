// app.js (Step 2 = Date + Barber + Times)
// - User selects DATE
// - User selects BARBER (stored in formData.barber + formData.barberName)
// - Available times are shown based on (date + barber)
// - Friendly UX + safe guards to avoid undefined crashes

(function () {
  // Ensure global formData exists (do NOT overwrite if already created by other steps)
  window.formData = window.formData || {};
  if (typeof window.formData.date !== "string") window.formData.date = "";
  if (typeof window.formData.time !== "string" && !Array.isArray(window.formData.time)) window.formData.time = "";
  if (typeof window.formData.barber !== "string" && window.formData.barber !== null) window.formData.barber = null;
  if (typeof window.formData.barberName !== "string" && window.formData.barberName !== null) window.formData.barberName = null;
  if (!Array.isArray(window.formData.service)) window.formData.service = [];

  // ====== DOM refs (Step 2) ======
  const dateInput = document.getElementById("date");
  const horariosArea = document.getElementById("horarios-area");
  const horariosList = document.getElementById("horarios-list");

  // Barber UI (must exist in Step 2 now)
  const barbersList = document.getElementById("barbers-list");
  const paginationBarbers = document.getElementById("paginationBarbers");
  const barberSearch = document.getElementById("barberSearch");

  // Buttons
  const btnPrev2 = document.getElementById("prev2");
  const btnNext2 = document.getElementById("next2");

  // ====== Guards (avoid undefined crashes) ======
  if (!dateInput || !horariosArea || !horariosList || !barbersList || !paginationBarbers || !barberSearch) {
    console.warn("[app.js] Missing required elements. Check your Step 2 HTML ids.");
    return;
  }

  // Hide times area initially
  horariosArea.style.display = "none";

  // ====== Barber pagination state ======
  let currentPageBarber = 1;
  let lastBarberQuery = "";
  const pageSizeBarber = 4;
  let totalCountBarber = 0;

  // ====== Helpers ======
  function formatYMDToBR(ymd) {
    // "YYYY-MM-DD" -> "DD/MM/YYYY"
    if (!ymd || typeof ymd !== "string") return "";
    const [y, m, d] = ymd.split("-");
    return [d, m, y].join("/");
  }

  function showHint(message) {
    horariosArea.style.display = "";
    horariosList.innerHTML = `
      <div class="text-white py-2 w-100">
        ${message}
      </div>
    `;
  }

  function clearSelectedTimeUI() {
    horariosList.querySelectorAll(".horario-toggle").forEach((b) => b.classList.remove("active"));
  }

  function normalizeTime(t) {
    // "HH:MM:SS" -> "HH:MM"
    if (!t) return "";
    return String(t).slice(0, 5);
  }

  function timeToMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== "string") return NaN;
    const [hStr, mStr] = hhmm.split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
    return h * 60 + m;
  }

  function sortTimes(times) {
    return [...times].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  }

  function isConsecutivePair(times) {
    if (!Array.isArray(times) || times.length !== 2) return false;
    const [t1, t2] = sortTimes(times);
    const m1 = timeToMinutes(t1);
    const m2 = timeToMinutes(t2);
    return Number.isFinite(m1) && Number.isFinite(m2) && (m2 - m1 === 30);
  }

  // ====== Time slots (mock) ======
  // Only applies "30min antecedence" restriction for TODAY.
  function getMockTimes(dateInputEl) {
    const times = [];
    if (!dateInputEl?.value) return times;

    const now = new Date();

    // Build selectedDate safely (no timezone shift)
    const [y, m, d] = dateInputEl.value.split("-").map(Number);
    const selectedDate = new Date(y, m - 1, d);

    const isToday = selectedDate.toDateString() === now.toDateString();

    // 30 minutes antecedence
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + 30;

    for (let h = 9; h <= 19; h++) {
      ["00", "30"].forEach((min) => {
        if (h === 19 && min === "30") return; // skip 19:30
        if (h === 9 && min === "00") return;  // optional skip 09:00

        const timeMinutes = h * 60 + Number(min);

        // Only restrict if it is today
        if (!isToday || timeMinutes >= nowMinutes) {
          times.push(`${String(h).padStart(2, "0")}:${min}`);
        }
      });
    }

    return times;
  }

  // ====== API: Busy times for a barber on a day ======
  async function fetchBusyTimes(dateYMD, barberId) {
    if (!dateYMD || !barberId) return [];
    try {
      const res = await fetch(`/.netlify/functions/appointments-get?date=${encodeURIComponent(dateYMD)}&barber_id=${encodeURIComponent(barberId)}&limit=500`);
      const json = await res.json();
      const data = json?.data;

      if (!Array.isArray(data)) return [];

      return data
        .map((a) => normalizeTime(a.time))
        .filter(Boolean);

    } catch (err) {
      console.error("Erro ao buscar horários ocupados:", err);
      return [];
    }
  }

  // ====== Render times ======
  function renderTimeToggles(availableTimes) {
    horariosList.innerHTML = "";

    if (!availableTimes || availableTimes.length === 0) {
      horariosList.innerHTML = `<div class="text-muted py-2">Nenhum horário disponível.</div>`;
      return;
    }

    const isMultiService = Array.isArray(window.formData.service) && window.formData.service.length > 1;

    // Initialize window.formData.time correctly based on the current condition
    if (isMultiService) {
      if (!Array.isArray(window.formData.time)) window.formData.time = [];
    } else {
      if (typeof window.formData.time !== "string") window.formData.time = "";
    }

    availableTimes.forEach((time) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-outline-light btn-sm horario-toggle";
      btn.textContent = time;
      btn.dataset.value = time;

      btn.addEventListener("click", () => {
        // Multi-service: user must pick exactly 2 consecutive slots
        if (isMultiService) {
          const isActivating = !btn.classList.contains("active");

          if (!Array.isArray(window.formData.time)) window.formData.time = [];

          if (isActivating) {
            if (window.formData.time.length >= 2) {
              alert("Escolha apenas dois horarios consecutivos.");
              return;
            }

            btn.classList.add("active");
            if (!window.formData.time.includes(time)) window.formData.time.push(time);

            // When the second slot is selected, enforce consecutive rule
            if (window.formData.time.length === 2 && !isConsecutivePair(window.formData.time)) {
              btn.classList.remove("active");
              window.formData.time = window.formData.time.filter((t) => t !== time);
              alert("Os horarios precisam ser consecutivos (ex: 10:00 e 10:30).");
              return;
            }

            window.formData.time = sortTimes(window.formData.time);
          } else {
            btn.classList.remove("active");
            window.formData.time = window.formData.time.filter((t) => t !== time);
          }
        }
        // CONDITION NOT MET: Single-select behavior
        else {
          const alreadyActive = btn.classList.contains("active");

          // Clear all other active buttons
          horariosList.querySelectorAll(".horario-toggle").forEach((b) => b.classList.remove("active"));

          if (alreadyActive) {
            // If clicking the already active single button, deselect it completely
            window.formData.time = "";
          } else {
            // Select this one
            btn.classList.add("active");
            window.formData.time = time;
          }
        }
      });

      horariosList.appendChild(btn);
    });
  }

  // ====== Barber selection ======
  function updateSelectedBarber() {
    const selected = document.querySelector('input[name="barber"]:checked');
    if (selected) {
      window.formData.barber = selected.value; // UUID
      window.formData.barberName = selected.getAttribute("data-name") || null;
    } else {
      window.formData.barber = null;
      window.formData.barberName = null;
    }
  }

  // ====== Recompute times when both date & barber exist ======
  async function refreshTimesForSelection() {
    const dateYMD = window.formData.date;
    const barberId = window.formData.barber;

    // Reset selected time every refresh
    const isMultiService = Array.isArray(window.formData.service) && window.formData.service.length > 1;
    window.formData.time = isMultiService ? [] : "";
    clearSelectedTimeUI();

    if (!dateYMD) {
      horariosArea.style.display = "none";
      return;
    }

    // Always show area after date is selected
    horariosArea.style.display = "";

    if (!barberId) {
      showHint("Selecione um barbeiro para ver os horários disponíveis.");
      return;
    }

    // Loading
    horariosList.innerHTML = `
      <div class="text-center py-2 w-100">
        Carregando horários... <span class="spinner-border spinner-border-sm"></span>
      </div>
    `;

    const busyTimes = await fetchBusyTimes(dateYMD, barberId);
    if (busyTimes) {
    // console.log(formData.barberName, busyTimes)
    const allTimes = getMockTimes(dateInput);
    const availableTimes = allTimes.filter((t) => !busyTimes.includes(t));

    if (false) {
      alert("Escolha dois horários!");
      
    }

    renderTimeToggles(availableTimes);
    // console.log(availableTimes)
    }
  }

  // ====== Load barbers (with pagination + search) ======
  async function loadBarbers(query = "", page = 1) {
    lastBarberQuery = query;
    currentPageBarber = page;

    let url = `/.netlify/functions/barbers-get?page=${page}&limit=${pageSizeBarber}`;
    if (query && query.trim().length > 1) {
      url += `&name=${encodeURIComponent(query.trim())}`;
    }

    barbersList.innerHTML = `<div class="text-center py-3">Carregando barbeiros...</div>`;
    paginationBarbers.innerHTML = "";

    try {
      const res = await fetch(url);
      const { data, count } = await res.json();
      totalCountBarber = count || 0;

      if (!data || !data.length) {
        barbersList.innerHTML = `<div class="alert alert-warning">Nenhum barbeiro encontrado.</div>`;
        paginationBarbers.innerHTML = "";
        // keep hint
        updateSelectedBarber();
        refreshTimesForSelection();
        return;
      }

      barbersList.innerHTML = data
        .map(
          (b) => `
          <label class="form-check-label d-flex align-items-center border rounded px-3 py-2 bg-transparent shadow-sm mb-2">
            <input type="radio" class="form-check-input me-2" name="barber" value="${b.id}" data-name="${b.name}">
            <span class="fw-bold">${b.name}</span>
          </label>
        `
        )
        .join("");

      // Restore checked barber if already chosen
      if (window.formData.barber) {
        const prev = barbersList.querySelector(`input[name="barber"][value="${window.formData.barber}"]`);
        if (prev) prev.checked = true;
      }

      // bind change
      barbersList.querySelectorAll('input[name="barber"]').forEach((input) => {
        input.addEventListener("change", async () => {
          updateSelectedBarber();
          await refreshTimesForSelection();
        });
      });

      updateSelectedBarber();
      renderBarberPagination();

      // If already have date+barber, update times (useful after pagination/search)
      await refreshTimesForSelection();

    } catch (err) {
      console.error("Erro ao carregar barbeiros:", err);
      barbersList.innerHTML = `<div class="alert alert-danger">Erro ao carregar barbeiros.</div>`;
      paginationBarbers.innerHTML = "";
    }
  }

  function renderBarberPagination() {
    const totalPages = Math.ceil(totalCountBarber / pageSizeBarber);

    if (totalPages <= 1) {
      paginationBarbers.innerHTML = "";
      return;
    }

    paginationBarbers.innerHTML = `
      <button class="btn btn-sm btn-outline-dark me-2" id="prevBarberPage" ${currentPageBarber === 1 ? "disabled" : ""}>
        <i class="bi bi-chevron-left"></i> Anterior
      </button>

      <span class="small text-muted">Página ${currentPageBarber} de ${totalPages}</span>

      <button class="btn btn-sm btn-outline-dark ms-2" id="nextBarberPage" ${currentPageBarber === totalPages ? "disabled" : ""}>
        Próxima <i class="bi bi-chevron-right"></i>
      </button>
    `;

    document.getElementById("prevBarberPage")?.addEventListener("click", () => {
      if (currentPageBarber > 1) loadBarbers(lastBarberQuery, currentPageBarber - 1);
    });

    document.getElementById("nextBarberPage")?.addEventListener("click", () => {
      if (currentPageBarber < totalPages) loadBarbers(lastBarberQuery, currentPageBarber + 1);
    });
  }

  // ====== Events: search barbers ======
  let barberTimer;
  barberSearch.addEventListener("input", () => {
    clearTimeout(barberTimer);
    barberTimer = setTimeout(() => {
      loadBarbers(barberSearch.value.trim(), 1);
    }, 350);
  });

  // ====== Events: date selection ======
  const todayMin = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", todayMin);

  dateInput.addEventListener("change", async () => {
    window.formData.date = dateInput.value;
    window.formData.time = ""; // reset
    await refreshTimesForSelection();
  });

  // ====== Next/Prev actions ======
  btnPrev2?.addEventListener("click", () => {
    if (typeof showStep === "function") showStep(1);
  });

  btnNext2?.addEventListener("click", () => {
   
    if (!window.formData.date) {
      alert("Escolha uma data primeiro!");
      dateInput.focus();
      return showStep(2);
    }
    if (!window.formData.barber) {
      alert("Selecione um barbeiro para ver os horários!");
      barbersList.scrollIntoView({ behavior: "smooth", block: "start" });
      return showStep(2);
    }

    const isMultiService = Array.isArray(window.formData.service) && window.formData.service.length > 1;
    if (isMultiService) {
      if (!Array.isArray(window.formData.time) || window.formData.time.length !== 2 || !isConsecutivePair(window.formData.time)) {
        alert("Escolha dois horarios consecutivos (ex: 10:00 e 10:30).");
        horariosArea.scrollIntoView({ behavior: "smooth", block: "start" });
        return showStep(2);
      }
    } else {
      if (!window.formData.time || typeof window.formData.time !== "string") {
        alert("Escolha um horario disponivel!");
        horariosArea.scrollIntoView({ behavior: "smooth", block: "start" });
        return showStep(2);
      }
    }
    if (typeof showStep === "function") showStep(4); 

  });

  // ====== Init ======
  // Keep times hidden until date selected
  horariosArea.style.display = "none";
  showHint("Escolha uma data e selecione um barbeiro para liberar os horários.");

  // Load barbers immediately
  loadBarbers("", 1);
})();
