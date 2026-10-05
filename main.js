/* =========================================================================
   DALIFAL 40 ANOS - SCRIPT COMUM A TODAS AS PÁGINAS
   Idioma (PT/EN), menu móvel, cabeçalho compacto, pausa de vídeo/carrosséis
   e carregamento do mapa só após consentimento.
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const html = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection && navigator.connection.saveData;

    const UI = {
        pt: { pause: 'Pausar', play: 'Reproduzir', menuOpen: 'Abrir menu', menuClose: 'Fechar menu' },
        en: { pause: 'Pause', play: 'Play', menuOpen: 'Open menu', menuClose: 'Close menu' }
    };

    // ---------------------------------------------------------------------
    // 1. Idioma
    // ---------------------------------------------------------------------
    const langBtns = document.querySelectorAll('.lang-btn');
    const metaDescription = document.querySelector('meta[name="description"]');
    const texts = {
        pt: { title: document.title, description: metaDescription ? metaDescription.content : '' },
        en: { title: body.dataset.titleEn || document.title, description: body.dataset.descriptionEn || '' }
    };

    let currentLang = 'pt';
    try { currentLang = localStorage.getItem('dalifal_lang') || 'pt'; } catch (e) { /* sem acesso */ }

    function setLanguage(lang) {
        currentLang = lang === 'en' ? 'en' : 'pt';
        body.classList.toggle('lang-en', currentLang === 'en');
        body.classList.toggle('lang-pt', currentLang === 'pt');
        html.lang = currentLang === 'en' ? 'en' : 'pt-PT';
        document.title = texts[currentLang].title;
        if (metaDescription && texts[currentLang].description) {
            metaDescription.content = texts[currentLang].description;
        }

        // <option> não aceita <span>: o texto é trocado a partir de data-pt / data-en
        document.querySelectorAll('option[data-pt]').forEach(opt => {
            opt.textContent = opt.dataset[currentLang] || opt.dataset.pt;
        });

        // Atributos traduzíveis (ex.: aria-label, title, alt)
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            const attr = el.dataset.i18nAttr;
            const value = el.dataset[currentLang + 'Attr'];
            if (attr && value) el.setAttribute(attr, value);
        });

        langBtns.forEach(btn => {
            const active = btn.dataset.lang === currentLang;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        try { localStorage.setItem('dalifal_lang', currentLang); } catch (e) { /* sem acesso */ }
        updateDynamicLabels();
    }

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    // ---------------------------------------------------------------------
    // 2. Menu móvel
    // ---------------------------------------------------------------------
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.getElementById('menu-principal');

    function setMenu(open) {
        if (!menuToggle || !mainNav) return;
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        mainNav.classList.toggle('is-open', open);
        body.classList.toggle('menu-open', open);
        updateDynamicLabels();
    }

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
        });

        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setMenu(false));
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
                setMenu(false);
                menuToggle.focus();
            }
        });

        window.matchMedia('(min-width: 993px)').addEventListener('change', e => {
            if (e.matches) setMenu(false);
        });
    }

    // ---------------------------------------------------------------------
    // 3. Cabeçalho compacto ao fazer scroll
    // ---------------------------------------------------------------------
    const header = document.querySelector('.site-header');
    if (header) {
        const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // ---------------------------------------------------------------------
    // 4. Vídeo do hero e carrosséis com botão de pausa (WCAG 2.2.2)
    // ---------------------------------------------------------------------
    const pauseButtons = [];

    function createPauseButton(container, isPaused, onToggle) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'media-pause-btn';
        btn.dataset.paused = isPaused ? 'true' : 'false';
        btn.addEventListener('click', () => {
            const paused = btn.dataset.paused !== 'true';
            btn.dataset.paused = paused ? 'true' : 'false';
            onToggle(paused);
            updateDynamicLabels();
        });
        container.appendChild(btn);
        pauseButtons.push(btn);
        return btn;
    }

    const heroVideo = document.querySelector('.hero-background-video');
    if (heroVideo) {
        const shouldPlay = !reduceMotion && !saveData;
        if (shouldPlay) {
            heroVideo.play().catch(() => { /* reprodução automática bloqueada */ });
        }
        createPauseButton(heroVideo.parentElement, !shouldPlay, paused => {
            if (paused) heroVideo.pause();
            else heroVideo.play().catch(() => {});
        });
    }

    if (!reduceMotion) {
        document.querySelectorAll('.art-carousel').forEach(carousel => {
            createPauseButton(carousel, false, paused => carousel.classList.toggle('is-paused', paused));
        });
    }

    function updateDynamicLabels() {
        const t = UI[currentLang];
        pauseButtons.forEach(btn => {
            btn.textContent = btn.dataset.paused === 'true' ? '▶ ' + t.play : '❚❚ ' + t.pause;
        });
        if (menuToggle) {
            const open = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-label', open ? t.menuClose : t.menuOpen);
        }
    }

    // ---------------------------------------------------------------------
    // 5. Mapa do Google só após clique (evita cookies de terceiros sem consentimento)
    // ---------------------------------------------------------------------
    document.querySelectorAll('[data-map-load]').forEach(btn => {
        btn.addEventListener('click', () => {
            const container = btn.closest('.map-container');
            const iframe = document.createElement('iframe');
            iframe.src = container.dataset.mapSrc;
            iframe.title = currentLang === 'en' ? 'Map of Dalifal headquarters' : 'Mapa da sede Dalifal';
            iframe.loading = 'lazy';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.allowFullscreen = true;
            container.innerHTML = '';
            container.appendChild(iframe);
        });
    });

    setLanguage(currentLang);
});
