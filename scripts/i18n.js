/* ============================================================
   Nowel — bilinguisme FR / EN
   Le HTML est rédigé en français. Avec ?lang=en, on charge le
   dictionnaire scripts/i18n-en.js et on traduit la page au
   chargement : nœuds texte, attributs (alt, title, aria-label,
   placeholder…), métadonnées et sujets des courriels préremplis.
   Sans paramètre (ou ?lang=fr) : français. Un ?lang= explicite
   est ensuite propagé à tous les liens internes.
   Chargé de façon synchrone dans le <head> : la langue est connue
   avant script.js, qui s'en sert pour ses textes dynamiques.
   ============================================================ */
(function () {
	'use strict';

	var html = document.documentElement;
	var param = null;
	try { param = new URLSearchParams(window.location.search).get('lang'); } catch (e) { /* vieux navigateur : français */ }
	var lang = param === 'en' ? 'en' : 'fr';
	var explicit = param === 'en' || param === 'fr';

	html.lang = lang;

	var dict = null;
	var domReady = false;
	var applied = false;

	/* Même normalisation que l'outil d'extraction : suites d'espaces
	   (insécables comprises) réduites à une seule, bouts rognés. */
	function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

	function translate(fr) {
		var key = norm(fr);
		if (!key) return null;
		if (Object.prototype.hasOwnProperty.call(dict.strings, key)) return dict.strings[key];
		for (var i = 0; i < dict.patterns.length; i++) {
			var p = dict.patterns[i];
			if (p[0].test(key)) return key.replace(p[0], p[1]);
		}
		return null;
	}

	function withLang(href) {
		var u = new URL(href, window.location.href);
		u.searchParams.set('lang', lang);
		return u.href;
	}

	/* ---- Traduction de la page ---- */
	var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/;
	var ATTRS = ['alt', 'title', 'aria-label', 'aria-roledescription', 'placeholder'];

	function apply() {
		// Les <option> sans value envoient leur texte : on fige la valeur
		// française pour que les demandes reçues restent uniformes.
		document.querySelectorAll('option:not([value])').forEach(function (o) {
			o.setAttribute('value', o.text);
		});

		var walker = document.createTreeWalker(html, NodeFilter.SHOW_TEXT);
		var nodes = [];
		while (walker.nextNode()) nodes.push(walker.currentNode);
		nodes.forEach(function (node) {
			if (!node.parentNode || SKIP.test(node.parentNode.nodeName)) return;
			var v = node.nodeValue;
			var tr = translate(v);
			// On garde les espaces de bord : ils séparent le texte des balises voisines
			if (tr !== null) node.nodeValue = v.match(/^\s*/)[0] + tr + v.match(/\s*$/)[0];
		});

		document.querySelectorAll('[' + ATTRS.join('],[') + ']').forEach(function (el) {
			ATTRS.forEach(function (name) {
				var v = el.getAttribute(name);
				if (v === null) return;
				var tr = translate(v);
				if (tr !== null) el.setAttribute(name, tr);
			});
		});

		document.querySelectorAll('meta[name="description"], meta[property^="og:"], meta[property^="twitter:"]').forEach(function (meta) {
			var tr = translate(meta.getAttribute('content') || '');
			if (tr !== null) meta.setAttribute('content', tr);
		});
		var locale = document.querySelector('meta[property="og:locale"]');
		if (locale) locale.setAttribute('content', 'en_CA');

		// Sujets des courriels préremplis (candidatures)
		document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
			var href = a.getAttribute('href');
			var m = href.match(/([?&]subject=)([^&]*)/);
			if (!m) return;
			var tr = translate(decodeURIComponent(m[2]));
			if (tr !== null) a.setAttribute('href', href.replace(m[0], m[1] + encodeURIComponent(tr)));
		});

		// La version anglaise est sa propre page canonique (voir les hreflang du <head>)
		var canonical = document.querySelector('link[rel="canonical"]');
		if (canonical) canonical.setAttribute('href', withLang(canonical.getAttribute('href')));
		var ogUrl = document.querySelector('meta[property="og:url"]');
		if (ogUrl) ogUrl.setAttribute('content', withLang(ogUrl.getAttribute('content')));

		// Les demandes envoyées depuis la version anglaise sont identifiées
		document.querySelectorAll('form').forEach(function (form) {
			var input = document.createElement('input');
			input.type = 'hidden';
			input.name = 'langue';
			input.value = 'en';
			form.appendChild(input);
		});
	}

	function reveal() { html.classList.remove('i18n-pending'); }

	function tryApply() {
		if (applied || !dict || !domReady) return;
		applied = true;
		try { apply(); } finally { reveal(); }
	}

	/* ---- Liens internes : on conserve la langue choisie ---- */
	function propagate() {
		document.querySelectorAll('a[href]').forEach(function (a) {
			var raw = a.getAttribute('href');
			// '#…' reste sur la page ; '?lang=…' est le sélecteur de langue
			if (!raw || raw.charAt(0) === '#' || raw.charAt(0) === '?') return;
			var u;
			try { u = new URL(raw, window.location.href); } catch (e) { return; }
			if (u.protocol !== window.location.protocol || u.host !== window.location.host) return;
			if (!/(\.html?|\/)$/.test(u.pathname)) return;
			u.searchParams.set('lang', lang);
			a.setAttribute('href', u.href);
		});
	}

	function markSwitch() {
		document.querySelectorAll('.lang-switch a[hreflang]').forEach(function (a) {
			if (a.getAttribute('hreflang') === lang) a.setAttribute('aria-current', 'true');
			else a.removeAttribute('aria-current');
		});
	}

	document.addEventListener('DOMContentLoaded', function () {
		domReady = true;
		markSwitch();
		if (explicit) propagate();
		tryApply();
	});

	/* ---- Anglais : on masque la page le temps de charger le dictionnaire ---- */
	if (lang === 'en') {
		html.classList.add('i18n-pending');
		var script = document.createElement('script');
		script.src = document.currentScript.src.replace(/i18n\.js(\?.*)?$/, 'i18n-en.js');
		script.onload = function () {
			dict = window.NOWEL_I18N_EN || null;
			if (dict) tryApply();
			else reveal();
		};
		script.onerror = reveal;
		document.head.appendChild(script);
		// Filet de sécurité : jamais de page blanche si le dictionnaire tarde
		window.setTimeout(reveal, 3000);
	}
})();
