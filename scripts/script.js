/* ============================================================
   Nowel — interactions
   ============================================================ */
(function () {
	'use strict';

	/* ---- Header : dropdowns desktop ---- */
	var ddItems = Array.prototype.slice.call(document.querySelectorAll('.nav-item.has-dd'));
	var touchOnly = window.matchMedia('(hover: none)');

	function setExpanded(item, open) {
		var link = item.querySelector('.nav-link');
		if (link) link.setAttribute('aria-expanded', open ? 'true' : 'false');
	}

	function closeAllDd() {
		ddItems.forEach(function (item) {
			item.classList.remove('is-open');
			setExpanded(item, false);
		});
	}

	ddItems.forEach(function (item) {
		var link = item.querySelector('.nav-link');

		item.addEventListener('mouseenter', function () { setExpanded(item, true); });
		item.addEventListener('mouseleave', function () { setExpanded(item, false); });
		item.addEventListener('focusin', function () { setExpanded(item, true); });
		item.addEventListener('focusout', function () {
			if (!item.contains(document.activeElement)) setExpanded(item, false);
		});

		// Écrans tactiles : le premier tap ouvre le menu, le second navigue
		if (link) {
			link.addEventListener('click', function (e) {
				if (touchOnly.matches && !item.classList.contains('is-open')) {
					e.preventDefault();
					closeAllDd();
					item.classList.add('is-open');
					setExpanded(item, true);
				}
			});
		}
	});

	if (ddItems.length) {
		document.addEventListener('click', function (e) {
			if (!e.target.closest('.nav-item.has-dd')) closeAllDd();
		});
	}

	/* Survol d'une catégorie du mega menu → affiche ses services */
	var cats = document.querySelectorAll('.dd-cat');
	var panels = document.querySelectorAll('.dd-panel');

	function activateCat(name) {
		cats.forEach(function (c) { c.classList.toggle('is-active', c.dataset.cat === name); });
		panels.forEach(function (p) { p.classList.toggle('is-active', p.dataset.cat === name); });
	}

	cats.forEach(function (cat) {
		cat.addEventListener('mouseenter', function () { activateCat(cat.dataset.cat); });
		cat.addEventListener('focus', function () { activateCat(cat.dataset.cat); });
	});

	/* ---- Header : tiroir mobile ---- */
	var burger = document.querySelector('.nav-burger');
	var drawer = document.querySelector('.drawer');
	var overlay = document.querySelector('.drawer-overlay');
	var closeBtn = document.querySelector('.drawer-close');

	function setLevel(n) {
		if (drawer) drawer.dataset.level = String(n);
	}

	function activateSub(attr, value) {
		drawer.querySelectorAll('.drawer-sub[' + attr + ']').forEach(function (sub) {
			sub.classList.toggle('is-active', sub.getAttribute(attr) === value);
		});
	}

	function openDrawer() {
		drawer.classList.add('is-open');
		overlay.classList.add('is-visible');
		document.body.classList.add('no-scroll');
		drawer.setAttribute('aria-hidden', 'false');
		burger.setAttribute('aria-expanded', 'true');
	}

	function closeDrawer() {
		if (!drawer || !drawer.classList.contains('is-open')) return;
		drawer.classList.remove('is-open');
		overlay.classList.remove('is-visible');
		document.body.classList.remove('no-scroll');
		drawer.setAttribute('aria-hidden', 'true');
		burger.setAttribute('aria-expanded', 'false');
		// Revient au premier niveau une fois le tiroir refermé
		window.setTimeout(function () { setLevel(0); }, 450);
	}

	if (burger && drawer && overlay) {
		burger.addEventListener('click', openDrawer);
		overlay.addEventListener('click', closeDrawer);
		if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

		// Niveau 1 : Services ou Locations
		drawer.querySelectorAll('[data-open]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				activateSub('data-menu', btn.dataset.open);
				setLevel(1);
			});
		});

		// Niveau 2 : services d'une catégorie
		drawer.querySelectorAll('[data-open-cat]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				activateSub('data-cat', btn.dataset.openCat);
				setLevel(2);
			});
		});

		// Boutons retour
		drawer.querySelectorAll('[data-back]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				setLevel(btn.dataset.back);
			});
		});

		// Toute navigation referme le tiroir
		drawer.querySelectorAll('a').forEach(function (link) {
			link.addEventListener('click', closeDrawer);
		});

		// Repasse en desktop → on referme proprement
		var desktop = window.matchMedia('(min-width: 921px)');
		var onDesktopChange = function (mq) { if (mq.matches) closeDrawer(); };
		if (desktop.addEventListener) desktop.addEventListener('change', onDesktopChange);
		else desktop.addListener(onDesktopChange);
	}

	document.addEventListener('keydown', function (e) {
		if (e.key !== 'Escape') return;
		closeAllDd();
		closeDrawer();
		if (document.activeElement && document.activeElement.closest &&
			document.activeElement.closest('.nav-item.has-dd')) {
			document.activeElement.blur();
		}
	});

	/* ---- Header subtle elevation on scroll ---- */
	var header = document.querySelector('.site-header');
	if (header) {
		var onScroll = function () {
			header.style.boxShadow = window.scrollY > 8
				? '0 10px 30px -20px rgba(28,58,41,0.5)'
				: 'none';
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
	}

	/* ---- Reveal on scroll ---- */
	var reveals = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window && reveals.length) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					io.unobserve(entry.target);
				}
			});
		}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
		reveals.forEach(function (el) { io.observe(el); });
	} else {
		reveals.forEach(function (el) { el.classList.add('is-visible'); });
	}

	/* ---- Current year ---- */
	var year = document.getElementById('year');
	if (year) year.textContent = new Date().getFullYear();

	/* ---- AJAX forms (contact / newsletter) — progressive enhancement ---- */
	document.querySelectorAll('form[data-ajax]').forEach(function (form) {
		var status = form.querySelector('.form-status');

		form.addEventListener('submit', function (e) {
			var action = form.getAttribute('action') || '';
			// If no real endpoint is wired yet, prevent a broken navigation.
			if (action.indexOf('VOTRE_ID') !== -1 || action === '') {
				e.preventDefault();
				if (status) {
					status.textContent =
						'Le formulaire n’est pas encore relié. Écrivez-nous directement à info@nowel.ca.';
					status.style.color = 'var(--clay)';
				}
				return;
			}

			e.preventDefault();
			var btn = form.querySelector('[type="submit"]');
			var original = btn ? btn.textContent : '';
			if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }
			if (status) { status.textContent = ''; }

			fetch(action, {
				method: 'POST',
				body: new FormData(form),
				headers: { Accept: 'application/json' }
			}).then(function (res) {
				if (res.ok) {
					form.reset();
					if (status) {
						status.textContent = 'Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.';
						status.style.color = 'var(--moss)';
					}
				} else {
					throw new Error('bad response');
				}
			}).catch(function () {
				if (status) {
					status.textContent = 'Une erreur est survenue. Réessayez ou écrivez-nous à info@nowel.ca.';
					status.style.color = 'var(--clay)';
				}
			}).finally(function () {
				if (btn) { btn.disabled = false; btn.textContent = original; }
			});
		});
	});
})();
