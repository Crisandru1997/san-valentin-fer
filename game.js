document.addEventListener('DOMContentLoaded', () => {
  // helper touch+click
  const addTap = (el, handler) => {
    if (!el) return;
    let touched = false;
    el.addEventListener('touchstart', (e) => {
      touched = true;
      handler(e);
    });
    el.addEventListener('click', (e) => {
      if (touched) {
        touched = false;
        return;
      }
      handler(e);
    });
  };

  const envelope = document.getElementById('envelope');
  const sealButton = document.getElementById('sealButton');
  const glitterLayer = document.querySelector('.glitter-layer');
  const modeToggle = document.getElementById('modeToggle');
  const heartStars = document.querySelector('.heart-stars');
  const body = document.body;
  let typewriterAbort = null;

  const spawnConfetti = () => {
    if (!glitterLayer) return;
    const rect = envelope.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const colors = ['#ff5a87', '#ff7aa2', '#ffb1c6', '#ff3c73', '#ff8aa6'];
    const count = 25 + Math.random() * 15;
    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement('span');
      const angle = (Math.PI * 2 * i) / count;
      const speed = 8 + Math.random() * 12;
      const offsetX = Math.cos(angle) * speed * 4;
      const offsetY = Math.sin(angle) * speed * 4;
      piece.className = 'confetti-piece';
      piece.style.width = `${6 + Math.random() * 4}px`;
      piece.style.height = `${6 + Math.random() * 4}px`;
      piece.style.left = `${centerX}px`;
      piece.style.top = `${centerY}px`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.setProperty('--tx', `${offsetX}px`);
      piece.style.setProperty('--ty', `${offsetY}px`);
      piece.style.animationDelay = `${Math.random() * 0.08}s`;
      glitterLayer.appendChild(piece);
      piece.addEventListener('animationend', () => piece.remove());
    }
  };

  const typewriterEffect = async () => {
    // Cancel any previous typewriter effect
    if (typewriterAbort) {
      typewriterAbort.abort();
    }
    typewriterAbort = new AbortController();
    const signal = typewriterAbort.signal;

    const letterTexts = document.querySelectorAll('.letter-text');
    const texts = Array.from(letterTexts).map(el => {
      // Save original content if not already saved
      if (!el.dataset.original) {
        el.dataset.original = el.innerHTML;
      }
      return el.textContent;
    });
    
    // Clear all first
    letterTexts.forEach(el => el.textContent = '');
    
    // Type each one sequentially
    try {
      for (let idx = 0; idx < texts.length; idx += 1) {
        if (signal.aborted) return;
        const content = texts[idx];
        const textEl = letterTexts[idx];
        for (let i = 0; i < content.length; i += 1) {
          if (signal.aborted) return;
          textEl.textContent += content[i];
          await new Promise(resolve => setTimeout(resolve, 16));
        }
      }
    } catch (e) {
      // Typewriter was cancelled
    }
  };

  const toggleEnvelope = () => {
    if (!envelope) return;
    const isOpen = envelope.classList.toggle('open');
    envelope.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (sealButton) {
      sealButton.setAttribute('aria-label', isOpen ? 'Cerrar la carta' : 'Abrir la carta');
      const label = sealButton.querySelector('.seal-button__label');
      if (label) {
        label.textContent = isOpen ? 'Cierra aqui' : 'Abre aqui';
      }
    }
    if (isOpen) {
      spawnConfetti();
      typewriterEffect();
      if (heartStars) {
        heartStars.classList.add('is-on');
        setTimeout(() => heartStars.classList.remove('is-on'), 2000);
      }
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    } else {
      // Cancel typewriter if running
      if (typewriterAbort) {
        typewriterAbort.abort();
      }
      const letterTexts = document.querySelectorAll('.letter-text');
      for (const textEl of letterTexts) {
        if (textEl.dataset.original) {
          textEl.innerHTML = textEl.dataset.original;
        }
      }
    }
  };

  if (sealButton) {
    addTap(sealButton, (event) => {
      event.preventDefault();
      toggleEnvelope();
    });
  }

  if (envelope) {
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
