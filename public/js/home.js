/* AnkoraDev — Home motion engine (vanilla, sin dependencias) */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1. Dividir títulos palabra por palabra ---------- */
  function splitWords(el) {
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'w';
            var inner = document.createElement('span');
            inner.style.setProperty('--i', i++);
            inner.textContent = p;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.classList.contains('shine')) {
          var ws = document.createElement('span');
          ws.className = 'w';
          var wi = document.createElement('span');
          wi.style.setProperty('--i', i++);
          node.replaceChild(ws, child);
          wi.appendChild(child);
          ws.appendChild(wi);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    }
    walk(el);
  }

  document.querySelectorAll('.split').forEach(splitWords);

  /* ---------- 2. Revelado al hacer scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal, .split');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 3. Contadores animados ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var dur = 1800, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- 4. Nav: scroll, progreso, menú móvil ---------- */
  var navWrap = document.getElementById('nav-wrap');
  var bar = document.getElementById('scroll-bar');
  var waFloat = document.querySelector('.wa-float');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (navWrap) navWrap.classList.toggle('scrolled', y > 40);
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (waFloat) waFloat.classList.toggle('show', y > 500);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  var toggle = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Dropdown interactivo de productos */
  document.querySelectorAll('.nav-dropdown').forEach(function (dd) {
    var trigger = dd.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = dd.classList.contains('open');
      document.querySelectorAll('.nav-dropdown.open').forEach(function (other) {
        if (other !== dd) other.classList.remove('open');
      });
      dd.classList.toggle('open', !wasOpen);
      trigger.setAttribute('aria-expanded', !wasOpen ? 'true' : 'false');
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.nav-dropdown.open').forEach(function (dd) {
        dd.classList.remove('open');
        var tr = dd.querySelector('.nav-dropdown-trigger');
        if (tr) tr.setAttribute('aria-expanded', 'false');
      });
    }
  });

  /* ---------- 5. Spotlight en cards (optimizado sin reflows) ---------- */
  if (finePointer) {
    document.querySelectorAll('.card').forEach(function (card) {
      var rect = null;
      card.addEventListener('pointerenter', function () {
        rect = card.getBoundingClientRect();
      });
      card.addEventListener('pointermove', function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      }, { passive: true });
      card.addEventListener('pointerleave', function () {
        rect = null;
      });
    });
  }

  /* ---------- 6. Botones magnéticos (optimizados) ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      var rect = null;
      el.addEventListener('pointerenter', function () {
        rect = el.getBoundingClientRect();
      });
      el.addEventListener('pointermove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) * 0.22;
        var y = (e.clientY - rect.top - rect.height / 2) * 0.3;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        rect = null;
        el.style.transition = 'transform .4s cubic-bezier(.34,1.56,.64,1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 400);
      });
    });
  }

  /* ---------- 7. Parallax 3D en el hero ---------- */
  var heroVisual = document.getElementById('hero-visual');
  if (heroVisual && finePointer && !reduceMotion) {
    var layers = heroVisual.querySelectorAll('[data-depth]');
    var tx = 0, ty = 0, cx = 0, cy = 0, rafId = null;

    function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute('data-depth'));
        if (l.classList.contains('tilt')) {
          l.style.transform = 'rotateY(' + (cx * 10) + 'deg) rotateX(' + (-cy * 10) + 'deg)';
        } else {
          l.style.transform = 'translate3d(' + (cx * d * 12) + 'px,' + (cy * d * 12) + 'px,0)';
        }
      });
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    }

    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!rafId) rafId = requestAnimationFrame(loop);
    }, { passive: true });
  }

  /* ---------- 8. Carrusel de pantallas en el teléfono ---------- */
  var screens = document.querySelectorAll('#hero-screens img');
  if (screens.length > 1 && !reduceMotion) {
    var idx = 0;
    setInterval(function () {
      if (document.hidden) return;
      screens[idx].classList.remove('active');
      idx = (idx + 1) % screens.length;
      screens[idx].classList.add('active');
    }, 3200);
  }

  /* ---------- 9. Texto que se escribe (demo IA de Naub) ---------- */
  var typingEl = document.querySelector('.typing');
  if (typingEl) {
    var phrases = [
      'Generando post para Instagram…',
      'Programando en Facebook · 6:00 p.m.',
      'Respondiendo en WhatsApp…',
      'Resumiendo fuentes RSS del día…'
    ];
    if (reduceMotion) {
      typingEl.textContent = phrases[0];
    } else {
      var pi = 0, ci = 0, deleting = false;
      (function type() {
        var phrase = phrases[pi];
        typingEl.textContent = phrase.slice(0, ci);
        var delay = deleting ? 28 : 55;
        if (!deleting && ci === phrase.length) { deleting = true; delay = 1600; }
        else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 350; }
        ci += deleting ? -1 : 1;
        setTimeout(type, delay);
      })();
    }
  }

  /* ---------- 10. Luciérnagas en canvas ---------- */
  var canvas = document.getElementById('fireflies');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, flies = [];
    var mouse = { x: -9999, y: -9999 };

    var sprite = document.createElement('canvas');
    var S = 48;
    sprite.width = sprite.height = S;
    var sctx = sprite.getContext('2d');
    var g = sctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(236,253,245,.9)');
    g.addColorStop(0.18, 'rgba(110,231,183,.8)');
    g.addColorStop(0.45, 'rgba(52,211,153,.25)');
    g.addColorStop(1, 'rgba(52,211,153,0)');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, S, S);

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      var count = Math.min(22, Math.max(12, Math.round(W / 70)));
      if (reduceMotion) count = 8;
      flies = [];
      for (var i = 0; i < count; i++) {
        flies.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          size: 14 + Math.random() * 16,
          phase: Math.random() * Math.PI * 2,
          speed: 0.01 + Math.random() * 0.015,
          wander: Math.random() * Math.PI * 2
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < flies.length; i++) {
        var f = flies[i];
        f.phase += f.speed;
        f.wander += (Math.random() - 0.5) * 0.12;
        f.vx += Math.cos(f.wander) * 0.01;
        f.vy += Math.sin(f.wander) * 0.01;

        if (mouse.x > 0) {
          var dx = mouse.x - f.x, dy = mouse.y - f.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 2) {
            var force = (1 - dist / 180) * 0.025;
            f.vx += (dx / dist) * force;
            f.vy += (dy / dist) * force;
          }
        }

        f.vx *= 0.98; f.vy *= 0.98;
        f.x += f.vx; f.y += f.vy;

        if (f.x < -20) f.x = W + 20; else if (f.x > W + 20) f.x = -20;
        if (f.y < -20) f.y = H + 20; else if (f.y > H + 20) f.y = -20;

        var alpha = 0.2 + (Math.sin(f.phase) * 0.5 + 0.5) * 0.75;
        var s = f.size * (0.8 + alpha * 0.3);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, f.x - s / 2, f.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    }

    var running = true;
    function frame() {
      if (running) draw();
      if (!reduceMotion && running) requestAnimationFrame(frame);
    }

    resize();
    if (reduceMotion) { draw(); } else { requestAnimationFrame(frame); }

    var resizeT;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () { resize(); if (reduceMotion) draw(); }, 150);
    });

    window.addEventListener('pointermove', function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY;
    }, { passive: true });
    document.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    document.addEventListener('visibilitychange', function () { running = !document.hidden; });
  }

  /* ---------- 11. Formulario → WhatsApp ---------- */
  var form = document.getElementById('contact-form');
  var statusEl = document.getElementById('form-status');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = (document.getElementById('nombre').value || '').trim();
      var email = (document.getElementById('email').value || '').trim();
      var mensaje = (document.getElementById('mensaje').value || '').trim();
      if (!nombre || !email || !mensaje) {
        if (statusEl) statusEl.textContent = 'Completa todos los campos.';
        return;
      }
      var text = 'Hola AnkoraDev, soy ' + nombre + '.\nContacto: ' + email + '\n\n' + mensaje;
      if (statusEl) statusEl.textContent = 'Abriendo WhatsApp…';
      window.open('https://wa.me/573151029805?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

  /* ---------- 12. Año dinámico ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
