document.addEventListener('DOMContentLoaded', () => {
  // helper touch+click
  const addTap = (el, handler) => {
    if (!el) return;
    let touched = false;
    let startX = 0;
    let startY = 0;
    let moved = false;

    const shouldIgnore = (event) => {
      const target = event.target;
      return target && target.closest && target.closest('.letter-card__scroll');
    };

    el.addEventListener('touchstart', (e) => {
      touched = true;
      moved = false;
      const touch = e.touches[0];
      if (touch) {
        startX = touch.clientX;
        startY = touch.clientY;
      }
    });
    el.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      const dx = Math.abs(touch.clientX - startX);
      const dy = Math.abs(touch.clientY - startY);
      if (dx > 10 || dy > 10) {
        moved = true;
      }
    });
    el.addEventListener('touchend', (e) => {
      if (shouldIgnore(e) || moved) return;
      handler(e);
    });
    el.addEventListener('click', (e) => {
      if (touched) {
        touched = false;
        return;
      }
      if (shouldIgnore(e)) return;
      handler(e);
    });
  };

  const envelope = document.getElementById('envelope');
  const glitterLayer = document.querySelector('.glitter-layer');
  const modeToggle = document.getElementById('modeToggle');
  const heartStars = document.querySelector('.heart-stars');
  const body = document.body;
  const toggleEnvelope = () => {
    if (!envelope) return;
    const isOpen = envelope.classList.toggle('open');
    envelope.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) {
      if (heartStars) {
        heartStars.classList.add('is-on');
        setTimeout(() => heartStars.classList.remove('is-on'), 2000);
      }
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  };

  addTap(envelope, toggleEnvelope);
  if (envelope) {
    envelope.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleEnvelope();
      }
    });

    let rafId = null;
    let lastGlitter = 0;
    const updateTilt = (event) => {
      const rect = envelope.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const percentX = (pointerX / rect.width) - 0.5;
      const percentY = (pointerY / rect.height) - 0.5;
      const tiltX = Math.max(-8, Math.min(8, percentY * -12));
      const tiltY = Math.max(-8, Math.min(8, percentX * 12));
      envelope.style.setProperty('--tilt-x', `${tiltX}deg`);
      envelope.style.setProperty('--tilt-y', `${tiltY}deg`);
      envelope.style.setProperty('--spot-x', `${(percentX + 0.5) * 100}%`);
      envelope.style.setProperty('--spot-y', `${(percentY + 0.5) * 100}%`);
    };

    const spawnGlitter = (x, y) => {
      if (!glitterLayer) return;
      const count = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i += 1) {
        const piece = document.createElement('span');
        const size = 4 + Math.random() * 6;
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;
        piece.className = 'glitter-piece';
        piece.style.width = `${size}px`;
        piece.style.height = `${size}px`;
        piece.style.left = `${x + offsetX}px`;
        piece.style.top = `${y + offsetY}px`;
        piece.style.animationDelay = `${Math.random() * 0.15}s`;
        glitterLayer.appendChild(piece);
        piece.addEventListener('animationend', () => piece.remove());
      }
    };

    const scheduleTilt = (event) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => updateTilt(event));
    };

    envelope.addEventListener('pointermove', (event) => {
      envelope.classList.add('is-tilting');
      scheduleTilt(event);
      const now = performance.now();
      if (now - lastGlitter > 110) {
        lastGlitter = now;
        spawnGlitter(event.clientX, event.clientY);
      }
    });

    envelope.addEventListener('pointerdown', (event) => {
      spawnGlitter(event.clientX, event.clientY);
    });

    envelope.addEventListener('pointerleave', () => {
      envelope.classList.remove('is-tilting');
      envelope.style.setProperty('--tilt-x', '0deg');
      envelope.style.setProperty('--tilt-y', '0deg');
      envelope.style.setProperty('--spot-x', '50%');
      envelope.style.setProperty('--spot-y', '35%');
    });
  }

  if (modeToggle) {
    const stored = localStorage.getItem('nightMode');
    if (stored === 'true') {
      body.classList.add('night');
      modeToggle.setAttribute('aria-pressed', 'true');
      modeToggle.textContent = 'Modo dia';
    } else {
      body.classList.remove('night');
      modeToggle.setAttribute('aria-pressed', 'false');
      modeToggle.textContent = 'Modo noche';
      if (stored === null) {
        localStorage.setItem('nightMode', 'false');
      }
    }

    modeToggle.addEventListener('click', () => {
      const isNight = body.classList.toggle('night');
      modeToggle.setAttribute('aria-pressed', isNight ? 'true' : 'false');
      modeToggle.textContent = isNight ? 'Modo dia' : 'Modo noche';
      localStorage.setItem('nightMode', isNight ? 'true' : 'false');
    });
  }

});
