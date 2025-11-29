// Modal Bootstrap
let agendamentoModal = new bootstrap.Modal(document.getElementById('agendamentoModal'));
const agendamentoForm = document.getElementById('agendamentoForm');
const modalTitle = document.getElementById('modalTitle');
const modalCliente = document.getElementById('modalCliente');
const modalHorario = document.getElementById('modalHorario');
const modalServico = document.getElementById('modalServico');
const modalStatus = document.getElementById('modalStatus');
const modalAgendamentoId = document.getElementById('modalAgendamentoId');
const saveBtn = document.getElementById('saveBtn');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');

let modalMode = "edit"; // ou "confirm" ou "cancel"

// Função para abrir modal em modo Editar, Confirmar ou Cancelar
function openAgendamentoModal(id, mode = "edit") {
  modalMode = mode;
  const ag = agendamentos.find(a => a.id === id);
  if (!ag) return;
  modalAgendamentoId.value = ag.id;
  modalCliente.value = ag.cliente;
  modalHorario.value = ag.horario;
  modalServico.value = ag.servico;
  modalStatus.value = ag.status;

  // Exibe apenas botões relevantes
  saveBtn.style.display = (mode === "edit") ? "" : "none";
  confirmBtn.style.display = (mode === "confirm") ? "" : "none";
  cancelBtn.style.display = (mode === "cancel") ? "" : "none";

  modalCliente.readOnly = (mode !== "edit");
  modalHorario.readOnly = (mode !== "edit");
  modalServico.readOnly = (mode !== "edit");
  modalStatus.disabled = (mode !== "edit");

  if (mode === "edit") modalTitle.textContent = "Editar Agendamento";
  if (mode === "confirm") modalTitle.textContent = "Confirmar Agendamento";
  if (mode === "cancel") modalTitle.textContent = "Cancelar Agendamento";

  agendamentoModal.show();
}

// Delegação dos botões de ação
bookingsList.addEventListener('click', function(event) {
  if (event.target.closest('button')) {
    const card = event.target.closest('.booking-card');
    const id = Number(card.dataset.id);

    if (event.target.closest('.btn-outline-primary')) openAgendamentoModal(id, "edit");
    if (event.target.closest('.btn-outline-success')) openAgendamentoModal(id, "confirm");
    if (event.target.closest('.btn-outline-danger')) openAgendamentoModal(id, "cancel");
  }
});

// Salvar edição
agendamentoForm.onsubmit = function(e) {
  e.preventDefault();
  const id = Number(modalAgendamentoId.value);
  const ag = agendamentos.find(a => a.id === id);
  if (!ag) return;
  if (modalMode === "edit") {
    ag.cliente = modalCliente.value;
    ag.horario = modalHorario.value;
    ag.servico = modalServico.value;
    ag.status = modalStatus.value;
  }
  renderBookings();
  agendamentoModal.hide();
};

// Confirmar agendamento
confirmBtn.onclick = function() {
  const id = Number(modalAgendamentoId.value);
  const ag = agendamentos.find(a => a.id === id);
  if (!ag) return;
  ag.status = "Confirmado";
  renderBookings();
  agendamentoModal.hide();
};

// Cancelar agendamento
cancelBtn.onclick = function() {
  const id = Number(modalAgendamentoId.value);
  const ag = agendamentos.find(a => a.id === id);
  if (!ag) return;
  ag.status = "Cancelado";
  renderBookings();
  agendamentoModal.hide();
};
