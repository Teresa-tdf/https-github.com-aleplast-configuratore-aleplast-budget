// === Facebook Pixel ===
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '175524241934273');
fbq('track', 'PageView');

// === Google Analytics ===
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-JQK7VN6HN3');

// === Webhook Zapier ===
var ZAPIER_WEBHOOK = 'https://hooks.zapier.com/hooks/catch/10787587/332mdy4/';

// === Tracking eventi conversione (Meta Pixel + Zapier) ===
(function() {
  var completionTracked = false;
  var quizAnswers = {};    // risposte quiz accumulate step-by-step
  var quizPayload  = null; // payload completo pronto per Zapier
  var quizSendTimer = null; // timer 5 minuti

  // Funzione per inviare dati a Zapier tramite fetch (non bloccante)
  function sendToZapier(data) {
    fetch(ZAPIER_WEBHOOK, {
      method: 'POST',
      body: JSON.stringify(data)
    }).catch(function() {}); // silenzioso in caso di errore
  }

  // Normalizza il testo categoria in chiave pulita (es. "Priorita" -> "priorita")
  function normalizeCategory(text) {
    return text.trim().toLowerCase()
      .replace(/à/g, 'a').replace(/è/g, 'e').replace(/é/g, 'e')
      .replace(/ì/g, 'i').replace(/ò/g, 'o').replace(/ù/g, 'u')
      .replace(/s+/g, '_');
  }

  // 1) QUIZ ANSWERS: cattura la risposta selezionata ad ogni step
  //    useCapture = true per intercettare prima che React aggiorni il DOM
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn || !btn.className.includes('group relative flex flex-col')) return;

    // Risale dal button al container padre per trovare la label categoria
    var container = btn.parentElement;
    var categoryEl = null;
    while (container && container !== document.body) {
      var found = Array.from(container.querySelectorAll('span')).find(function(el) {
        return el.className.includes('text-brand-accent') && el.className.includes('uppercase');
      });
      if (found) { categoryEl = found; break; }
      container = container.parentElement;
    }

    // Leggi il titolo della risposta selezionata (primo span text-lg dentro il button)
    var titleEl = btn.querySelector('span[class*="text-lg"]');

    if (categoryEl && titleEl) {
      var key = normalizeCategory(categoryEl.textContent);
      quizAnswers[key] = titleEl.textContent.trim();
    }
  }, true); // useCapture = true

  // 2) FORM SUBMIT: prepara il payload ma NON invia subito
  //    Attende 5 minuti per dare tempo all'utente di cliccare una CTA
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;

    // Verifica che sia il form del quiz (ha il bottone "Visualizza il Risultato")
    var submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn || submitBtn.textContent.indexOf('Visualizza il Risultato') === -1) return;

    // Leggi i campi dal form
    // Filtra il campo honeypot anti-spam (tabindex="-1" o parent aria-hidden="true")
    var textInputs = Array.from(form.querySelectorAll('input[type="text"]')).filter(function(inp) {
      if (inp.getAttribute('tabindex') === '-1') return false;
      var parent = inp.parentElement;
      while (parent && parent !== form) {
        if (parent.getAttribute('aria-hidden') === 'true') return false;
        parent = parent.parentElement;
      }
      return true;
    });
    var emailInput = form.querySelector('input[type="email"]');
    var telInput   = form.querySelector('input[type="tel"]');
    var checkboxes = form.querySelectorAll('input[type="checkbox"]');

    var nome               = textInputs[0] ? textInputs[0].value.trim() : '';
    var cognome            = textInputs[1] ? textInputs[1].value.trim() : '';
    var email              = emailInput    ? emailInput.value.trim()    : '';
    var telefono           = telInput      ? telInput.value.trim()      : '';
    var consenso_marketing = checkboxes[1] ? checkboxes[1].checked      : false;

    quizPayload = {
      tipo:               'quiz_completo',
      nome:               nome,
      cognome:            cognome,
      email:              email,
      telefono:           telefono,
      consenso_marketing: consenso_marketing,
      tipologia:          quizAnswers.tipologia    || '',
      materiale:          quizAnswers.materiale    || '',
      contesto:           quizAnswers.contesto     || '',
      priorita:           quizAnswers.priorita     || '',
      stile:              quizAnswers.stile        || '',
      estetica:           quizAnswers.estetica     || '',
      clima:              quizAnswers.clima        || '',
      acustica:           quizAnswers.acustica     || '',
      spazio:             quizAnswers.spazio       || '',
      investimento:       quizAnswers.investimento || '',
      bonus:              quizAnswers.bonus        || '',
      azione_cta:         '',
      timestamp:          new Date().toISOString(),
      sorgente:           'quiz-aleplast',
      url_pagina:         window.location.href
    };

    if (quizSendTimer) clearTimeout(quizSendTimer);
    quizSendTimer = setTimeout(function() {
      if (quizPayload) {
        sendToZapier(quizPayload);
        quizPayload = null;
      }
    }, 300000); // 5 minuti

  }, true);

  // 3) RETE DI SICUREZZA: se l'utente chiude il browser, invia prima della chiusura
  window.addEventListener('beforeunload', function() {
    if (quizPayload) {
      var blob = new Blob([JSON.stringify(quizPayload)], { type: 'application/json' });
      navigator.sendBeacon(ZAPIER_WEBHOOK, blob);
      quizPayload = null;
    }
  });

  // 4) CompleteRegistration: rileva pagina risultato
  var observer = new MutationObserver(function() {
    if (completionTracked) return;
    var badge = document.querySelector('[class*="tracking-widest"]');
    if (badge && badge.textContent.trim() === 'Il Match Perfetto') {
      completionTracked = true;
      fbq('track', 'CompleteRegistration');
    }
  });

  observer.observe(document.getElementById('root') || document.body, {
    childList: true,
    subtree: true
  });

  // 5) Lead: click sui bottoni CTA nella pagina risultato
  document.addEventListener('click', function(e) {
    var target = e.target.closest('button, a');
    if (!target) return;
    var text = target.textContent.trim();

    if (text.indexOf('Richiedi Preventivo Gratuito') !== -1) {
      fbq('track', 'Lead', { content_category: 'preventivo' });
      if (quizSendTimer) { clearTimeout(quizSendTimer); quizSendTimer = null; }
      if (quizPayload) {
        quizPayload.azione_cta = 'preventivo';
        sendToZapier(quizPayload);
        quizPayload = null;
      }
    }

    if (text.indexOf('Parla con un esperto') !== -1) {
      fbq('track', 'Lead', { content_category: 'consulenza_telefonica' });
      if (quizSendTimer) { clearTimeout(quizSendTimer); quizSendTimer = null; }
      if (quizPayload) {
        quizPayload.azione_cta = 'consulenza_telefonica';
        sendToZapier(quizPayload);
        quizPayload = null;
      }
    }
  });

})();
