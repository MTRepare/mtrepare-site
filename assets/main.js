/* M.T Répare — interactions du site */
(function () {
  "use strict";
  var doc = document.documentElement;

  /* En-tête qui se compacte au défilement + bouton haut de page */
  var header = document.querySelector(".header");
  var toTop = document.querySelector(".to-top");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 30);
    if (toTop) toTop.classList.toggle("show", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0 }); });

  /* Menu mobile */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = doc.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { doc.classList.remove("menu-open"); });
    });
  }

  /* Lien actif dans le menu */
  var path = location.pathname.replace(/\/+$/, "") || "/";
  document.querySelectorAll(".nav a[data-path]").forEach(function (a) {
    if (a.getAttribute("data-path") === path) a.classList.add("active");
  });

  /* Apparition au défilement */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 }) : null;
  document.querySelectorAll(".reveal, .steps").forEach(function (el) {
    io ? io.observe(el) : el.classList.add("in");
  });

  /* Compteurs animés */
  function count(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    var start = null;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / 1400, 1);
      var v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toFixed(dec).replace(".", ",") + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && io) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { count(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* Mot qui tourne dans le titre d'accueil */
  var rot = document.querySelector(".rotator");
  if (rot) {
    var words = JSON.parse(rot.getAttribute("data-words"));
    var wi = 0, ci = words[0].length, deleting = true;
    rot.textContent = words[0];
    setTimeout(function tick() {
      var w = words[wi];
      if (deleting) {
        ci--;
        if (ci <= 0) { deleting = false; wi = (wi + 1) % words.length; }
      } else {
        ci++;
        if (ci >= words[wi].length) { deleting = true; rot.textContent = words[wi]; return setTimeout(tick, 1800); }
      }
      rot.textContent = words[wi].slice(0, Math.max(ci, 0));
      setTimeout(tick, deleting ? 45 : 85);
    }, 2200);
  }

  /* Onglets (page Tarifs) */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var tabs = group.querySelectorAll(".tab");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("active"); x.setAttribute("aria-selected", "false"); });
        t.classList.add("active"); t.setAttribute("aria-selected", "true");
        document.querySelectorAll(".tab-panel").forEach(function (p) {
          p.classList.toggle("active", p.id === t.getAttribute("data-target"));
        });
      });
    });
  });

  /* FAQ en accordéon + recherche */
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.parentElement;
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  var faqSearch = document.querySelector("#faq-search");
  if (faqSearch) {
    faqSearch.addEventListener("input", function () {
      var term = faqSearch.value.trim().toLowerCase();
      document.querySelectorAll(".faq-item").forEach(function (it) {
        var match = !term || it.textContent.toLowerCase().indexOf(term) > -1;
        it.style.display = match ? "" : "none";
        if (term && match) it.classList.add("open");
      });
    });
  }

  /* Formulaire de devis en 3 étapes */
  var form = document.querySelector("#devis-form");
  if (form) {
    var steps = form.querySelectorAll(".fstep");
    var bars = form.querySelectorAll(".progress span");
    var current = 0;

    function show(i) {
      steps.forEach(function (s, k) { s.classList.toggle("active", k === i); });
      bars.forEach(function (b, k) { b.classList.toggle("done", k <= i); });
      current = i;
      if (i === steps.length - 1) fillSummary();
      var top = form.getBoundingClientRect().top + window.scrollY - 100;
      if (window.scrollY > top) window.scrollTo({ top: top });
    }

    function validate(stepEl) {
      var ok = true;
      stepEl.querySelectorAll("[required]").forEach(function (inp) {
        if (inp.type === "radio") {
          var checked = stepEl.querySelector('input[name="' + inp.name + '"]:checked');
          var box = stepEl.querySelector(".device-err");
          if (box) box.style.display = checked ? "none" : "block";
          if (!checked) ok = false;
          return;
        }
        var f = inp.closest(".field");
        var valid = inp.checkValidity() && inp.value.trim() !== "";
        if (f) f.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      return ok;
    }

    form.querySelectorAll("[data-next]").forEach(function (b) {
      b.addEventListener("click", function () { if (validate(steps[current])) show(current + 1); });
    });
    form.querySelectorAll("[data-prev]").forEach(function (b) {
      b.addEventListener("click", function () { show(current - 1); });
    });
    form.querySelectorAll('input[name="appareil"]').forEach(function (r) {
      r.addEventListener("change", function () { setTimeout(function () { show(1); }, 250); });
    });
    form.querySelectorAll(".chips button").forEach(function (c) {
      c.addEventListener("click", function () {
        var ta = form.querySelector("#description");
        ta.value = (ta.value ? ta.value.trim() + "\n" : "") + c.textContent + " : ";
        ta.focus();
      });
    });
    form.querySelectorAll("input, textarea").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var f = inp.closest(".field");
        if (f && f.classList.contains("invalid") && inp.checkValidity()) f.classList.remove("invalid");
        if (current === steps.length - 1) fillSummary();
      });
    });

    /* Code postal -> liste des communes (API officielle geo.api.gouv.fr) */
    var cp = form.querySelector("#cp"), ville = form.querySelector("#ville"), list = form.querySelector("#city-list");
    if (cp && ville && list) {
      var lastCp = "";
      function closeList() { list.hidden = true; list.innerHTML = ""; }
      function pick(name) {
        ville.value = name; closeList();
        var f = ville.closest(".field"); if (f) f.classList.remove("invalid");
        fillSummary();
      }
      function render(items, msg) {
        list.innerHTML = "";
        if (msg) { var li = document.createElement("li"); li.className = "msg"; li.textContent = msg; list.appendChild(li); }
        items.forEach(function (n) {
          var li = document.createElement("li");
          li.setAttribute("role", "option"); li.tabIndex = 0; li.textContent = n;
          li.addEventListener("mousedown", function (e) { e.preventDefault(); pick(n); });
          li.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); pick(n); } });
          list.appendChild(li);
        });
        list.hidden = false;
      }
      cp.addEventListener("input", function () {
        cp.value = cp.value.replace(/\D/g, "").slice(0, 5);
        if (cp.value.length < 5) { lastCp = ""; closeList(); return; }
        if (cp.value === lastCp) return;
        lastCp = cp.value;
        render([], "Recherche des communes…");
        fetch("https://geo.api.gouv.fr/communes?codePostal=" + cp.value + "&fields=nom&format=json")
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (cp.value !== lastCp) return;
            var names = data.map(function (c) { return c.nom; }).sort(function (a, b) { return a.localeCompare(b, "fr"); });
            if (!names.length) return render([], "Aucune commune trouvée pour ce code postal.");
            if (names.length === 1) { pick(names[0]); return; }
            render(names, "Choisissez votre ville :");
            ville.focus();
          })
          .catch(function () { closeList(); });
      });
      ville.addEventListener("focus", function () { if (list.children.length) list.hidden = false; });
      ville.addEventListener("blur", function () { setTimeout(function () { list.hidden = true; }, 150); });
    }

    function fillSummary() {
      var s = form.querySelector(".summary");
      if (!s) return;
      var d = new FormData(form);
      s.innerHTML = "";
      [["Appareil", d.get("appareil")], ["Modèle", d.get("modele") || "—"], ["Nom", d.get("name")], ["E-mail", d.get("email")], ["Téléphone", d.get("telephone")], ["Ville", ((d.get("code_postal") || "") + " " + (d.get("ville") || "")).trim()]].forEach(function (r) {
        var row = document.createElement("div");
        var a = document.createElement("span"); a.textContent = r[0];
        var b = document.createElement("span"); b.textContent = r[1] || "—";
        row.appendChild(a); row.appendChild(b); s.appendChild(row);
      });
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!validate(steps[current])) return;
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = "Envoi en cours…";
      var data = new FormData(form);
      data.set("subject", "Demande de devis — " + (data.get("appareil") || "") + " — " + (data.get("name") || ""));
      fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok || res.j.success === false) throw new Error(res.j.message || "Erreur");
          form.querySelector(".form-body").style.display = "none";
          form.querySelector(".success").classList.add("show");
        })
        .catch(function () {
          btn.disabled = false; btn.innerHTML = label;
          alert("L'envoi n'a pas fonctionné. Vous pouvez nous écrire directement à mtrepare@outlook.fr ou appeler le 07 60 09 50 33.");
        });
    });
  }

  /* Image manquante : on la masque proprement au lieu d'afficher une icône cassée */
  document.querySelectorAll("main img").forEach(function (img) {
    function hide() { img.style.visibility = "hidden"; }
    if (img.complete && img.naturalWidth === 0) hide(); else img.addEventListener("error", hide);
  });

  /* Année du pied de page */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
