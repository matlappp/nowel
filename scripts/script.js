/* ============================================================
   Nowel — interactions
   ============================================================ */
(function () {
	'use strict';

	/* ---- Mobile navigation ---- */
	var toggle = document.querySelector('.nav-toggle');
	var nav = document.querySelector('.primary-nav');

	function closeNav() {
		if (!nav || !toggle) return;
		nav.classList.remove('is-open');
		toggle.classList.remove('is-open');
		toggle.setAttribute('aria-expanded', 'false');
	}

	if (toggle && nav) {
		toggle.addEventListener('click', function () {
			var open = nav.classList.toggle('is-open');
			toggle.classList.toggle('is-open', open);
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		});

		nav.querySelectorAll('a').forEach(function (link) {
			link.addEventListener('click', closeNav);
		});

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape') closeNav();
		});

		document.addEventListener('click', function (e) {
			if (nav.classList.contains('is-open') &&
				!nav.contains(e.target) && !toggle.contains(e.target)) {
				closeNav();
			}
		});
	}

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
