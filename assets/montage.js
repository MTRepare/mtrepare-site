/* M.T Répare — module « Montage PC » */
(function () {
  "use strict";
  var form = document.getElementById("mpc-form");
  if (!form) return;

  var STORE = "mtr-montage-v1";
  var CATS = ["Processeur", "Carte mère", "Mémoire", "Carte graphique", "Stockage", "Alimentation", "Boîtier", "Refroidissement"];
  var CAT_ICON = { "Processeur": "🧠", "Carte mère": "🧩", "Mémoire": "💾", "Carte graphique": "🎮", "Stockage": "🗄️", "Alimentation": "🔌", "Boîtier": "🖥️", "Refroidissement": "❄️" };
  var FORMAT_RANK = { ITX: 1, MATX: 2, ATX: 3, EATX: 4 };

  var steps = Array.prototype.slice.call(form.querySelectorAll(".mstep"));
  var stepper = form.querySelector(".mpc-steps");
  var btnPrev = form.querySelector("[data-mprev]");
  var btnNext = form.querySelector("[data-mnext]");
  var btnSend = form.querySelector("[data-msubmit]");
  var printBtns = form.querySelectorAll("[data-print]");
  var current = 0;

  /* ---------- utilitaires ---------- */
  function val(name) {
    var els = form.querySelectorAll('[name="' + name + '"]');
    if (!els.length) return "";
    var el = els[0];
    if (el.type === "checkbox" || el.type === "radio") {
      return Array.prototype.filter.call(els, function (e) { return e.checked; }).map(function (e) { return e.value; }).join(", ");
    }
    return (el.value || "").trim();
  }
  function path() { return val("parcours"); }
  function activeSteps() {
    return steps.filter(function (s) { var p = s.getAttribute("data-path"); return !p || !path() || p === path(); });
  }
  function euros(n) { return Number(n).toLocaleString("fr-FR") + " €"; }
  function parseCSV(text) {
    var lines = text.replace(/\r/g, "").split("\n").filter(function (l) { return l.trim() && l.trim().charAt(0) !== "#"; });
    if (!lines.length) return [];
    var head = lines.shift().split(";").map(function (h) { return h.trim().toLowerCase(); });
    return lines.map(function (l) {
      var cells = l.split(";"), o = {};
      head.forEach(function (h, i) { o[h] = (cells[i] || "").trim(); });
      return o;
    });
  }
  function norm(s) { return (s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }

  /* ---------- étapes ---------- */
  function drawStepper() {
    var list = activeSteps();
    stepper.innerHTML = "";
    list.forEach(function (s, i) {
      var li = document.createElement("li");
      li.textContent = s.getAttribute("data-label");
      var pos = list.indexOf(steps[current]);
      if (i < pos) li.className = "done"; else if (i === pos) li.className = "on";
      stepper.appendChild(li);
    });
  }
  function show(idx, noScroll) {
    current = idx;
    steps.forEach(function (s, i) { s.classList.toggle("active", i === idx); });
    var list = activeSteps(), pos = list.indexOf(steps[idx]);
    var last = pos === list.length - 1;
    btnPrev.style.visibility = pos === 0 ? "hidden" : "visible";
    btnNext.hidden = last; btnSend.hidden = !last;
    form.querySelector(".print-btn").hidden = !last;
    if (steps[idx].getAttribute("data-step") === "details") toggleBlocks();
    if (last) renderRecap();
    drawStepper();
    if (!noScroll) {
      var top = form.getBoundingClientRect().top + window.scrollY - 100;
      if (window.scrollY > top) window.scrollTo({ top: top });
    }
    save();
  }
  function move(dir) {
    var list = activeSteps(), pos = list.indexOf(steps[current]);
    var next = list[pos + dir];
    if (next) show(steps.indexOf(next));
  }
  function validate(step) {
    var ok = true;
    var name = step.getAttribute("data-step");
    if (name === "path" || name === "usage") {
      var field = name === "path" ? "parcours" : "usage";
      var has = !!val(field);
      step.querySelector(".opt-err").style.display = has ? "none" : "block";
      if (!has) ok = false;
    }
    step.querySelectorAll("input[required], select[required], textarea[required]").forEach(function (inp) {
      var f = inp.closest(".field");
      var good = inp.checkValidity() && inp.value.trim() !== "";
      if (f) f.classList.toggle("invalid", !good);
      if (!good) ok = false;
    });
    return ok;
  }
  function toggleBlocks() {
    var usage = val("usage");
    form.querySelectorAll(".blk[data-show-if]").forEach(function (b) {
      b.hidden = usage.indexOf(b.getAttribute("data-show-if")) === -1;
    });
  }

  btnNext.addEventListener("click", function () { if (validate(steps[current])) move(1); });
  btnPrev.addEventListener("click", function () { move(-1); });
  form.querySelectorAll('input[name="parcours"]').forEach(function (r) {
    r.addEventListener("change", function () { drawStepper(); setTimeout(function () { move(1); }, 250); });
  });
  form.addEventListener("input", function (e) {
    var f = e.target.closest && e.target.closest(".field");
    if (f && f.classList.contains("invalid") && e.target.checkValidity()) f.classList.remove("invalid");
    var st = e.target.closest && e.target.closest(".mstep");
    if (st) { var err = st.querySelector(".opt-err"); if (err) err.style.display = "none"; }
    save();
  });
  form.addEventListener("change", save);
  printBtns.forEach(function (b) { b.addEventListener("click", function () { renderRecap(); window.print(); }); });

  /* ---------- budget ---------- */
  var range = form.querySelector("#budget"), out = form.querySelector("#budget-out"), unknown = form.querySelector("#budget-inconnu");
  var note = form.querySelector("#budget-note"), contenu = form.querySelector('[name="budget_contenu"]');
  function drawBudget() {
    var v = +range.value;
    out.textContent = unknown.checked ? "À définir ensemble" : (v >= 5000 ? "5 000 € et +" : euros(v));
    range.disabled = unknown.checked;
    note.textContent = contenu.value.indexOf("complet") > -1 ? "PC complet avec périphériques" : "tour seule, composants compris";
    var pct = (v - range.min) / (range.max - range.min) * 100;
    range.style.setProperty("--p", pct + "%");
  }
  [range, unknown, contenu].forEach(function (el) { el.addEventListener("input", drawBudget); el.addEventListener("change", drawBudget); });
  function budgetText() {
    if (unknown.checked) return "À définir";
    var v = +range.value;
    return (v >= 5000 ? "5 000 € et +" : euros(v)) + (val("budget_flexible") ? " (flexible ±10 %)" : "") + " — " + contenu.value;
  }

  /* ---------- composants (data/composants.csv) ---------- */
  var compBox = form.querySelector("#comp-list"), compat = form.querySelector("#compat");
  var compLoaded = fetch("/data/composants.csv", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw 0; return r.text(); })
    .then(function (txt) {
      var rows = parseCSV(txt).filter(function (r) { return (r.disponible || "oui").toLowerCase() !== "non" && r.modele; });
      compBox.innerHTML = "";
      CATS.forEach(function (cat) {
        var items = rows.filter(function (r) { return r.categorie === cat; });
        var id = "c-" + norm(cat).toLowerCase();
        var wrap = document.createElement("div");
        wrap.className = "field comp";
        var lab = document.createElement("label");
        lab.setAttribute("for", id);
        lab.textContent = (CAT_ICON[cat] || "") + " " + cat;
        var sel = document.createElement("select");
        sel.id = id; sel.name = "comp_" + norm(cat).toLowerCase(); sel.setAttribute("data-cat", cat);
        sel.appendChild(new Option("Je laisse M.T Répare choisir", ""));
        var groups = {};
        items.forEach(function (r) {
          var o = new Option(r.modele + (r.info ? " — " + r.info : ""), r.modele);
          o.setAttribute("data-socket", r.socket || ""); o.setAttribute("data-mem", r.memoire || ""); o.setAttribute("data-format", r.format || "");
          o.setAttribute("data-label", o.text);
          if (r.groupe) {
            if (!groups[r.groupe]) { groups[r.groupe] = document.createElement("optgroup"); groups[r.groupe].label = r.groupe; sel.appendChild(groups[r.groupe]); }
            groups[r.groupe].appendChild(o);
          } else sel.appendChild(o);
        });
        if (cat === "Carte graphique") sel.appendChild(new Option("Aucune (graphique intégré au processeur)", "Aucune (iGPU)"));
        sel.addEventListener("change", checkCompat);
        wrap.appendChild(lab); wrap.appendChild(sel);
        compBox.appendChild(wrap);
      });
    })
    .catch(function () {
      compBox.innerHTML = '<p class="sub">La liste des composants n\'a pas pu être chargée. Indiquez vos composants dans le champ ci-dessous.</p>';
    });

  function selected(cat) {
    var sel = form.querySelector('select[data-cat="' + cat + '"]');
    if (!sel || !sel.value) return null;
    var o = sel.options[sel.selectedIndex];
    return { name: sel.value, socket: o.getAttribute("data-socket"), mem: o.getAttribute("data-mem"), format: o.getAttribute("data-format") };
  }
  /* grise les choix incompatibles avec ce qui est déjà sélectionné */
  function markOptions(cat, test) {
    var sel = form.querySelector('select[data-cat="' + cat + '"]');
    if (!sel) return;
    Array.prototype.forEach.call(sel.options, function (o) {
      if (!o.value || !o.getAttribute("data-label")) return;
      var ok = test(o);
      o.disabled = !ok && o !== sel.options[sel.selectedIndex];
      o.text = o.getAttribute("data-label") + (ok ? "" : " (non compatible)");
    });
  }
  function filterOptions() {
    var cpu = selected("Processeur"), mb = selected("Carte mère"), ram = selected("Mémoire"), box = selected("Boîtier");
    markOptions("Carte mère", function (o) {
      var s = o.getAttribute("data-socket"), m = o.getAttribute("data-mem"), f = o.getAttribute("data-format");
      return (!cpu || !cpu.socket || !s || s === cpu.socket) && (!ram || !ram.mem || !m || m === ram.mem) &&
        (!box || !box.format || !f || (FORMAT_RANK[norm(f)] || 0) <= (FORMAT_RANK[norm(box.format)] || 0));
    });
    markOptions("Processeur", function (o) { var s = o.getAttribute("data-socket"); return !mb || !mb.socket || !s || s === mb.socket; });
    markOptions("Mémoire", function (o) { var m = o.getAttribute("data-mem"); return !mb || !mb.mem || !m || m === mb.mem; });
  }
  function checkCompat() {
    filterOptions();
    var cpu = selected("Processeur"), mb = selected("Carte mère"), ram = selected("Mémoire"), box = selected("Boîtier");
    var msgs = [];
    if (cpu && mb && cpu.socket && mb.socket) {
      msgs.push(cpu.socket === mb.socket ? ["ok", "Processeur et carte mère compatibles (" + cpu.socket + ")"] : ["ko", "Le processeur (" + cpu.socket + ") n'est pas compatible avec la carte mère (" + mb.socket + ")"]);
    }
    if (ram && mb && ram.mem && mb.mem) {
      msgs.push(ram.mem === mb.mem ? ["ok", "Mémoire " + ram.mem + " compatible avec la carte mère"] : ["ko", "La carte mère accepte la " + mb.mem + ", pas la " + ram.mem]);
    }
    if (mb && box && mb.format && box.format) {
      var fits = (FORMAT_RANK[norm(mb.format)] || 0) <= (FORMAT_RANK[norm(box.format)] || 0);
      msgs.push(fits ? ["ok", "La carte mère (" + mb.format + ") rentre dans le boîtier"] : ["ko", "La carte mère " + mb.format + " est trop grande pour ce boîtier (" + box.format + " maximum)"]);
    }
    compat.innerHTML = "";
    msgs.forEach(function (m) {
      var p = document.createElement("p");
      p.className = "c-" + m[0];
      p.textContent = (m[0] === "ok" ? "✅ " : "⚠️ ") + m[1];
      compat.appendChild(p);
    });
    if (msgs.some(function (m) { return m[0] === "ko"; })) {
      var p = document.createElement("p"); p.className = "c-info";
      p.textContent = "Pas d'inquiétude : vous pouvez envoyer la demande, nous corrigerons la configuration avec vous.";
      compat.appendChild(p);
    }
    return msgs;
  }

  /* ---------- code postal -> villes ---------- */
  var cp = form.querySelector("#cp"), ville = form.querySelector("#ville"), cityList = form.querySelector("#city-list"), lastCp = "";
  function closeCities() { cityList.hidden = true; cityList.innerHTML = ""; }
  function pickCity(n) { ville.value = n; closeCities(); var f = ville.closest(".field"); if (f) f.classList.remove("invalid"); save(); renderRecap(); }
  function drawCities(items, msg) {
    cityList.innerHTML = "";
    if (msg) { var m = document.createElement("li"); m.className = "msg"; m.textContent = msg; cityList.appendChild(m); }
    items.forEach(function (n) {
      var li = document.createElement("li"); li.setAttribute("role", "option"); li.tabIndex = 0; li.textContent = n;
      li.addEventListener("mousedown", function (e) { e.preventDefault(); pickCity(n); });
      li.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); pickCity(n); } });
      cityList.appendChild(li);
    });
    cityList.hidden = false;
  }
  cp.addEventListener("input", function () {
    cp.value = cp.value.replace(/\D/g, "").slice(0, 5);
    if (cp.value.length < 5) { lastCp = ""; closeCities(); return; }
    if (cp.value === lastCp) return;
    lastCp = cp.value;
    drawCities([], "Recherche des communes…");
    fetch("https://geo.api.gouv.fr/communes?codePostal=" + cp.value + "&fields=nom&format=json")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (cp.value !== lastCp) return;
        var names = d.map(function (c) { return c.nom; }).sort(function (a, b) { return a.localeCompare(b, "fr"); });
        if (!names.length) return drawCities([], "Aucune commune trouvée pour ce code postal.");
        if (names.length === 1) return pickCity(names[0]);
        drawCities(names, "Choisissez votre ville :"); ville.focus();
      })
      .catch(closeCities);
  });
  ville.addEventListener("focus", function () { if (cityList.children.length) cityList.hidden = false; });
  ville.addEventListener("blur", function () { setTimeout(function () { cityList.hidden = true; }, 150); });

  /* ---------- récapitulatif ---------- */
  function sections() {
    var S = [];
    function add(title, rows) {
      rows = rows.filter(function (r) { return r[1]; });
      if (rows.length) S.push({ title: title, rows: rows });
    }
    add("Projet", [["Formule", val("config_type") && path() === "Expert" ? "Configuration type" : (path() === "Expert" ? "Je choisis mes composants" : "Conseil personnalisé")], ["Configuration de départ", path() === "Expert" ? val("config_type") : ""]]);
    if (path() === "Expert") {
      add("Composants choisis", [["Utilisation", val("usage_expert")]].concat(CATS.map(function (c) {
        var s = selected(c); return [c, s ? s.name : (form.querySelector('select[data-cat="' + c + '"]') ? "Choix M.T Répare" : "")];
      })).concat([["Configuration fournie", val("lien_config")], ["Précisions", val("precisions_expert")]]));
      var ko = checkCompat().filter(function (m) { return m[0] === "ko"; }).map(function (m) { return m[1]; }).join(" / ");
      add("Compatibilité", [["Alerte", ko]]);
    } else {
      var usage = val("usage");
      add("Utilisation", [["Usage", usage]]);
      if (usage.indexOf("Jeux") > -1) add("Jeux vidéo", [["Jeux", [val("jeux"), val("jeux_autres")].filter(Boolean).join(", ")], ["Résolution", val("resolution")], ["Fréquence", val("frequence")], ["Graphismes", val("graphismes")], ["Options", val("jeux_options")]]);
      if (usage.indexOf("Création") > -1) add("Création", [["Logiciels", val("logiciels")], ["Projets", val("projets")]]);
      if (usage.indexOf("Programmation") > -1) add("Programmation / IA", [["Détail", val("dev")]]);
      add("Au quotidien", [["Écrans", val("ecrans")], ["Silence", val("silence")], ["Durée visée", val("duree")]]);
      add("Préférences", [["Stockage", val("stockage")], ["RAM", val("ram")], ["Boîtier", val("taille")], ["Style", val("style")], ["Couleur", val("couleur")], ["Vitre", val("vitre")], ["Processeur", val("marque_cpu")], ["Carte graphique", val("marque_gpu")], ["Wi-Fi / Bluetooth", val("wifi")], ["À réutiliser", [val("reutiliser"), val("reutiliser_detail")].filter(Boolean).join(" — ")], ["Périphériques", val("peripheriques")]]);
    }
    add("Budget & options", [["Budget", budgetText()], ["Délai", val("delai") || "Pas pressé"], ["Système", val("systeme")], ["Récupération", val("retrait")]]);
    add("Client", [["Nom", val("name")], ["E-mail", val("email")], ["Téléphone", val("telephone")], ["Adresse", [val("adresse"), (val("code_postal") + " " + val("ville")).trim()].filter(Boolean).join(", ")], ["Message", val("message")]]);
    return S;
  }
  function renderRecap() {
    var box = form.querySelector("#recap");
    box.innerHTML = "";
    var h = document.createElement("h4"); h.textContent = "Récapitulatif de votre demande"; box.appendChild(h);
    var d = document.createElement("p"); d.className = "recap-date"; d.textContent = "M.T Répare — " + new Date().toLocaleDateString("fr-FR"); box.appendChild(d);
    sections().forEach(function (s) {
      var t = document.createElement("h5"); t.textContent = s.title; box.appendChild(t);
      s.rows.forEach(function (r) {
        var row = document.createElement("div");
        var a = document.createElement("span"); a.textContent = r[0];
        var b = document.createElement("span"); b.textContent = r[1];
        row.appendChild(a); row.appendChild(b); box.appendChild(row);
      });
    });
  }
  function recapText() {
    return sections().map(function (s) {
      return "■ " + s.title.toUpperCase() + "\n" + s.rows.map(function (r) { return "   • " + r[0] + " : " + r[1]; }).join("\n");
    }).join("\n\n");
  }
  function subject() {
    var bits = ["[MONTAGE PC]"];
    if (path() === "Expert") bits.push(val("config_type") ? "Config " + val("config_type").split(" (composants")[0] : "Config client");
    else {
      var u = val("usage");
      if (u.indexOf("Jeux") > -1) bits.push("Jeux" + (val("resolution") ? " " + val("resolution").split(" ").pop() : "") + (val("frequence") ? "/" + val("frequence").split(" ")[0] + "Hz" : ""));
      else bits.push(u.split(",")[0]);
    }
    bits.push("Budget " + (unknown.checked ? "à définir" : (+range.value >= 5000 ? "5000 €+" : range.value + " €")));
    bits.push(val("name"));
    return bits.join(" · ");
  }

  /* ---------- sauvegarde du brouillon ---------- */
  var restoring = false;
  function save() {
    if (restoring) return;
    try {
      var data = { step: current, f: {} };
      form.querySelectorAll("input, select, textarea").forEach(function (el) {
        if (!el.name || el.name === "botcheck") return;
        if (el.type === "checkbox" || el.type === "radio") { if (el.checked) (data.f[el.name] = data.f[el.name] || []).push(el.value); }
        else data.f[el.name] = el.value;
      });
      localStorage.setItem(STORE, JSON.stringify(data));
    } catch (e) { /* stockage indisponible */ }
  }
  function restore() {
    var data;
    try { data = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { data = null; }
    if (!data || !data.f) return null;
    restoring = true;
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (!el.name || !(el.name in data.f)) return;
      var v = data.f[el.name];
      if (el.type === "checkbox" || el.type === "radio") el.checked = [].concat(v).indexOf(el.value) > -1;
      else el.value = v;
    });
    restoring = false;
    return data;
  }

  /* ---------- envoi ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate(steps[current])) return;
    var key = (window.MTR_CONFIG && window.MTR_CONFIG.web3formsKey) || "";
    var fd = new FormData();
    fd.append("access_key", key);
    fd.append("subject", subject());
    fd.append("from_name", "Site M.T Répare — Montage PC");
    fd.append("name", val("name"));
    fd.append("email", val("email"));
    fd.append("Téléphone", val("telephone"));
    fd.append("Ville", (val("code_postal") + " " + val("ville")).trim());
    fd.append("Récapitulatif", recapText());
    fd.append("Données (format GestAtPhone)", JSON.stringify({ type: "montage_pc", date: new Date().toISOString(), sections: sections() }));
    fd.append("botcheck", form.querySelector('[name="botcheck"]').checked ? "on" : "");
    btnSend.disabled = true; var label = btnSend.innerHTML; btnSend.innerHTML = "Envoi en cours…";
    fetch(form.action, { method: "POST", body: fd, headers: { Accept: "application/json" } })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || res.j.success === false) throw new Error(res.j.message);
        renderRecap();
        form.querySelector(".mpc-body").querySelectorAll(".mstep, .mpc-nav, .mpc-steps").forEach(function (el) { el.style.display = "none"; });
        stepper.style.display = "none";
        var recap = form.querySelector("#recap"), success = form.querySelector("#mpc-success");
        success.classList.add("show");
        success.insertBefore(recap, success.querySelector(".form-nav"));
        try { localStorage.removeItem(STORE); } catch (err) { /* */ }
        window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100 });
      })
      .catch(function () {
        btnSend.disabled = false; btnSend.innerHTML = label;
        alert("L'envoi n'a pas fonctionné. Vous pouvez nous appeler au 07 60 09 50 33 ou écrire à mtrepare@outlook.fr.");
      });
  });

  /* ---------- galerie « Nos réalisations » ---------- */
  var gal = document.getElementById("realisations");
  if (gal) {
    fetch("/data/realisations.csv", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (txt) {
        var rows = parseCSV(txt).filter(function (r) { return r.photo; });
        if (!rows.length) return;
        var g = document.getElementById("gallery");
        rows.forEach(function (r) {
          var fig = document.createElement("figure");
          var img = document.createElement("img"); img.src = "/img/realisations/" + r.photo; img.alt = r.titre || "PC monté par M.T Répare"; img.loading = "lazy";
          var cap = document.createElement("figcaption");
          var b = document.createElement("b"); b.textContent = r.titre || "";
          var s = document.createElement("span"); s.textContent = r.description || "";
          cap.appendChild(b); cap.appendChild(s); fig.appendChild(img); fig.appendChild(cap); g.appendChild(fig);
        });
        gal.hidden = false;
      })
      .catch(function () { /* pas de galerie */ });
  }

  /* ---------- configurations types (data/configurations.csv) ---------- */
  var cfgSection = document.getElementById("configs-section");
  var CFG_ROWS = [["Processeur", "processeur", "🧠"], ["Carte graphique", "carte_graphique", "🎮"], ["Mémoire", "memoire", "💾"], ["Stockage", "stockage", "🗄️"], ["Carte mère", "carte_mere", "🧩"], ["Alimentation", "alimentation", "🔌"], ["Boîtier", "boitier", "🖥️"], ["Refroidissement", "refroidissement", "❄️"]];
  function applyConfig(c) {
    compLoaded.then(function () {
      restoring = true;
      var exp = form.querySelector("#p-expert"); exp.checked = true;
      CFG_ROWS.forEach(function (r) {
        var sel = form.querySelector('select[data-cat="' + r[0] + '"]');
        if (!sel) return;
        var want = c[r[1]] || "", found = false;
        Array.prototype.forEach.call(sel.options, function (o) { o.disabled = false; if (o.value === want) found = true; });
        sel.value = found ? want : "";
      });
      form.querySelector('[name="config_type"]').value = c.titre + " — " + c.plateforme + " (composants à partir de " + euros(c.prix) + ")";
      form.querySelector('[name="usage_expert"]').value = c.titre + " : " + c.usage;
      form.querySelector('[name="precisions_expert"]').value = c.extras || "";
      if (+c.prix) { range.value = Math.min(5000, Math.round(+c.prix / 50) * 50); unknown.checked = false; }
      restoring = false;
      drawBudget(); checkCompat();
      var box = form.querySelector("#cfg-picked");
      box.innerHTML = "";
      var b = document.createElement("b"); b.textContent = c.icone + " " + c.titre + " — " + c.plateforme;
      box.appendChild(b);
      box.appendChild(document.createTextNode(" : configuration pré-remplie. Modifiez librement les composants ci-dessous, puis continuez."));
      box.hidden = false;
      drawStepper();
      show(steps.indexOf(form.querySelector('[data-step="expert"]')), true);
      document.getElementById("configurateur").scrollIntoView({ behavior: "smooth" });
      save();
    });
  }
  if (cfgSection) {
    fetch("/data/configurations.csv", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (txt) {
        var rows = parseCSV(txt).filter(function (r) { return r.id && (r.disponible || "oui").toLowerCase() !== "non"; });
        if (!rows.length) return;
        var byId = {}, order = [];
        rows.forEach(function (r) { if (!byId[r.id]) { byId[r.id] = []; order.push(r.id); } byId[r.id].push(r); });
        order.sort(function (a, b) { return (+byId[a][0].ordre || 0) - (+byId[b][0].ordre || 0); });
        var grid = document.getElementById("cfg-grid");
        order.forEach(function (id) {
          var variants = byId[id], cur = variants[0];
          var card = document.createElement("article"); card.className = "cfg";
          card.innerHTML = '<div class="cfg-top"><span class="e"></span><h3></h3></div><p class="use"></p><div class="plat" role="group" aria-label="Plateforme"></div><ul></ul><p class="extra"></p><div class="cfg-price"><small>À partir de</small><b></b><sup>*</sup><small class="ht">composants, hors montage</small></div><button type="button" class="btn btn-accent">Partir de cette config →</button>';
          card.querySelector(".e").textContent = cur.icone || "🖥️";
          card.querySelector("h3").textContent = cur.titre;
          card.querySelector(".use").textContent = cur.usage;
          var plat = card.querySelector(".plat");
          function draw() {
            var ul = card.querySelector("ul"); ul.innerHTML = "";
            CFG_ROWS.slice(0, 5).forEach(function (r) {
              if (!cur[r[1]]) return;
              var li = document.createElement("li"), i = document.createElement("b"), s = document.createElement("span");
              i.textContent = r[2]; s.textContent = cur[r[1]] === "Aucune (iGPU)" ? "Graphique intégré au processeur" : cur[r[1]].replace(/^Carte mère /, "");
              li.appendChild(i); li.appendChild(s); ul.appendChild(li);
            });
            var ex = card.querySelector(".extra"); ex.textContent = cur.extras || ""; ex.hidden = !cur.extras;
            card.querySelector(".cfg-price b").textContent = euros(cur.prix);
            plat.querySelectorAll("button").forEach(function (b) { var on = b.getAttribute("data-p") === cur.plateforme; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
          }
          variants.forEach(function (v) {
            var b = document.createElement("button"); b.type = "button"; b.textContent = v.plateforme; b.setAttribute("data-p", v.plateforme);
            b.addEventListener("click", function () { cur = v; draw(); });
            plat.appendChild(b);
          });
          card.querySelector(".btn").addEventListener("click", function () { applyConfig(cur); });
          draw();
          grid.appendChild(card);
        });
        cfgSection.hidden = false;
      })
      .catch(function () { /* pas de configurations */ });
  }
  form.querySelectorAll('input[name="parcours"]').forEach(function (r) {
    r.addEventListener("change", function () {
      if (r.value === "Conseil") { form.querySelector('[name="config_type"]').value = ""; form.querySelector("#cfg-picked").hidden = true; }
    });
  });

  /* ---------- démarrage ---------- */
  var draft = restore();
  drawBudget();
  compLoaded.then(function () {
    if (draft) { restoring = true; restore(); restoring = false; }
    var ct = form.querySelector('[name="config_type"]');
    if (ct && ct.value && path() === "Expert") { var bx = form.querySelector("#cfg-picked"); bx.textContent = "Configuration de départ : " + ct.value + ". Modifiez librement les composants ci-dessous."; bx.hidden = false; }
    checkCompat();
  });
  var startStep = draft && typeof draft.step === "number" && steps[draft.step] && activeSteps().indexOf(steps[draft.step]) > -1 ? draft.step : 0;
  show(startStep, true);
})();
