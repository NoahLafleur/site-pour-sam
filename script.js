// ============================================================
// ENTRETIEN S.O – Envoi automatique de RDV vers Gmail
// Utilise EmailJS (gratuit) : https://www.emailjs.com
//
// ÉTAPES DE CONFIGURATION :
// 1. Crée un compte sur https://www.emailjs.com
// 2. Ajoute ton compte Gmail comme "Email Service"
// 3. Crée un "Email Template" avec les variables ci-dessous
// 4. Remplace les 3 valeurs YOUR_... par tes vraies clés
// ============================================================

const EMAILJS_SERVICE_ID  = "service_0w27vxh";
const EMAILJS_TEMPLATE_ID = "template_wu3b38i";
const EMAILJS_PUBLIC_KEY  = "QN2Uq47z4ppgs8TzA";

// Charge le SDK EmailJS dynamiquement
(function loadEmailJS() {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  script.onload = () => emailjs.init(EMAILJS_PUBLIC_KEY);
  document.head.appendChild(script);
})();

function initScripts() {
  // Gestion du formulaire
  const form = document.getElementById("rdvForm");
  if (form) {
    // Date minimum = aujourd'hui
    const dateInput = document.getElementById("date");
    if (dateInput) {
      const today = new Date().toISOString().split("T")[0];
      dateInput.setAttribute("min", today);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btn = form.querySelector(".btn-send");
      btn.textContent = "⏳ Envoi en cours...";
      btn.disabled = true;

      const templateParams = {
        from_name:  document.getElementById("nom").value,
        from_email: document.getElementById("email").value,
        telephone:  document.getElementById("telephone").value || "Non fourni",
        adresse:    document.getElementById("adresse").value,
        date_rdv:   document.getElementById("date").value,
        message:    document.getElementById("message").value,
      };

      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        form.style.display = "none";
        document.getElementById("successMsg").style.display = "block";
      } catch (error) {
        console.error("Erreur EmailJS:", error);
        btn.textContent = "✉️ Envoyer ma demande de RDV";
        btn.disabled = false;
        alert("Une erreur s'est produite. Veuillez réessayer ou nous contacter directement par courriel.");
      }
    });
  }

  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMenu.classList.remove('open');
    }));
  }
}

// Lancer au chargement (ou tout de suite si déjà chargé)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScripts);
} else {
  initScripts();
}
