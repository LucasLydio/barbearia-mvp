

document.addEventListener('DOMContentLoaded', () => {

function getPaymentLink() {
  return formData.paymentLink || "https://cielolink.com.br/4htomi0";
}

function getPaymentLinkPix() {
  return formData.paymentLinkPix || "62991300232";
} 

function formatDateBR(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function buildFinalSummary() {
  const ul = document.getElementById("final-summary");
  if (!ul) return;

    ul.innerHTML = `
        <li class="list-group-item"><strong>Serviços:</strong> ${Array.isArray(formData.serviceName) ? formData.serviceName.join(', ') : formData.serviceName}</li>
        <li class="list-group-item"><strong>Data:</strong> ${formatDateBR(formData.date)}</li>
        <li class="list-group-item"><strong>Hora:</strong> ${formData.time}</li>
        <li class="list-group-item"><strong>Barbeiro:</strong> ${formData.barberName || formData.barber}</li>
        <li class="list-group-item"><strong>Nome:</strong> ${formData.clientName}</li>
        <li class="list-group-item"><strong>Telefone:</strong> ${formData.telephone}</li>
        ${formData.note ? `<li class="list-group-item"><strong>Observações:</strong> ${formData.note}</li>` : ''}
    `;
  }

  function setupFinalStep() {
    const link = getPaymentLink();
    const linkPix = getPaymentLinkPix();

    const titleStep = document.getElementById("title");
    const stepIndicator = document.getElementById("progressbar");

    if (titleStep) titleStep.style.display = 'none';
    if (stepIndicator) stepIndicator.style.setProperty('display', 'none', 'important');

    const linkText = document.getElementById("paymentLinkText");
    const openLink = document.getElementById("openPaymentLink");

    const linkTextPix = document.getElementById("paymentLinkTextPix");
    const openLinkPix = document.getElementById("openPaymentLinkPix");

    if (linkText) linkText.textContent = link;
    if (openLink) openLink.href = link;

    if (linkTextPix) linkTextPix.textContent = linkPix;
    if (openLinkPix) openLinkPix.href = linkPix;

    const copyBtn = document.getElementById("copyPaymentLink");
    const toast = document.getElementById("copyToast");
    
    const copyBtnPix = document.getElementById("copyPaymentLinkPix");
    const toastPix = document.getElementById("copyToastPix");

    if (copyBtn) {
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(link);
          if (toast) {
            toast.style.display = "";
            setTimeout(() => (toast.style.display = "none"), 1800);
          }
        } catch {
          alert("Não consegui copiar automaticamente. Copie manualmente o link.");
        }
      };
    }

    if (copyBtnPix) {
      copyBtnPix.onclick = async () => {
        try {
          await navigator.clipboard.writeText(linkPix);
          if (toastPix) {
            toastPix.style.display = "";
            setTimeout(() => (toastPix.style.display = "none"), 1800);
          }
        } catch {
          alert("Não consegui copiar automaticamente. Copie manualmente o pix.");
        }
      };
    }


    const sendWhatsapp = document.getElementById("whatsProofBtn");
    if (sendWhatsapp) {
      
      sendWhatsapp.onclick = async (e) => {

        sendWhatsapp.disabled = true;
        sendWhatsapp.innerHTML = 'Finalizando... <i class="bi bi-clock-history ms-2"></i>';

        try {
          const waNumber = '5562991300232'; 
          const waText = getWhatsappText();
          sendWhatsapp.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
          sendWhatsapp.target = '_blank';
          sendWhatsapp.rel = 'noopener';
          const waLink = sendWhatsapp.href;
          if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.location.href = sendWhatsapp.href;

            setTimeout(() => {
              window.location.reload();
            }, 5500);
          } else {
            window.open(waLink, '_blank');

            setTimeout(() => {
              window.location.reload();
            }, 5500);
          }

        } catch (err) {
          alert(err.message || 'Erro ao salvar!');
          sendWhatsapp.disabled = false;
          sendWhatsapp.innerHTML = `<i class="bi bi-whatsapp me-2"></i>Finalizar no WhatsApp`;
          e.preventDefault(); 
          return false;
        }
      };
    }

    buildFinalSummary();
  }

  if (typeof showStep === 'function') {
    const _showStep = showStep;
    window.showStep = function(n) {
      _showStep(n);
      if (n === 6) setupFinalStep();
    }
  } 
});