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

	/* ---- Galerie du service : carrousel ----
	   Le défilement natif (scroll-snap) fait le gros du travail : le rail
	   reste glissable sans JS. On ajoute ici les flèches, les pastilles
	   et le clavier. */
	document.querySelectorAll('.gal').forEach(function (gal) {
		var track = gal.querySelector('.gal-track');
		var slides = Array.prototype.slice.call(gal.querySelectorAll('.gal-slide'));
		if (!track || slides.length < 2) return;

		var prev = gal.querySelector('.gal-prev');
		var next = gal.querySelector('.gal-next');
		var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
		var index = 0;

		gal.classList.add('has-nav');

		// Pastilles : inutiles sans JS, donc créées ici
		var dots = document.createElement('div');
		dots.className = 'gal-dots';
		var buttons = slides.map(function (slide, i) {
			var dot = document.createElement('button');
			dot.type = 'button';
			dot.className = 'gal-dot';
			dot.setAttribute('aria-label', 'Photo ' + (i + 1) + ' sur ' + slides.length);
			dot.addEventListener('click', function () { go(i); });
			dots.appendChild(dot);
			return dot;
		});
		gal.parentNode.insertBefore(dots, gal.nextSibling);

		// Reflète l'index courant sur les pastilles et les flèches
		function update() {
			buttons.forEach(function (dot, i) {
				dot.classList.toggle('is-active', i === index);
				if (i === index) dot.setAttribute('aria-current', 'true');
				else dot.removeAttribute('aria-current');
			});
			var focused = document.activeElement;
			if (prev) prev.disabled = index === 0;
			if (next) next.disabled = index === slides.length - 1;
			// Une flèche qui se désactive ne doit pas emporter le focus avec elle
			if (focused === prev && prev.disabled && next) next.focus();
			else if (focused === next && next.disabled && prev) prev.focus();
		}

		function go(i) {
			index = Math.max(0, Math.min(slides.length - 1, i));
			update();
			track.scrollTo({
				left: slides[index].offsetLeft - slides[0].offsetLeft,
				behavior: reduce.matches ? 'auto' : 'smooth'
			});
		}

		// Défilement au doigt ou à la molette : on retrouve la diapositive la plus centrée
		function sync() {
			var center = track.scrollLeft + track.clientWidth / 2;
			var best = 0;
			var min = Infinity;
			slides.forEach(function (slide, i) {
				var mid = slide.offsetLeft - slides[0].offsetLeft + slide.offsetWidth / 2;
				var dist = Math.abs(mid - center);
				if (dist < min) { min = dist; best = i; }
			});
			index = best;
			update();
		}

		if (prev) prev.addEventListener('click', function () { go(index - 1); });
		if (next) next.addEventListener('click', function () { go(index + 1); });

		track.addEventListener('keydown', function (e) {
			if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
			e.preventDefault();
			go(index + (e.key === 'ArrowRight' ? 1 : -1));
		});

		var ticking = false;
		track.addEventListener('scroll', function () {
			if (ticking) return;
			ticking = true;
			window.requestAnimationFrame(function () { ticking = false; sync(); });
		}, { passive: true });
		window.addEventListener('resize', sync, { passive: true });

		sync();
	});

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
