/* ============================================================================
   ALICYN BODY MAP — APP LOGIC
   Mobile-first · Vanilla JS · Sin dependencias externas
   Optimizado para iPhone 375–430px y tablet/iPad.
   ============================================================================ */

(function () {
  'use strict';

  // ── ESTADO GLOBAL ──────────────────────────────────────────────────────────
  const state = {
    currentView: 'home',
    planner: {
      selected: new Set(),
      side: 'left'
    },
    anatomy: {
      points: [],        // { id, xPct, yPct, name, state, phase, jewelry, note }
      selectedId: null,
      activeTool: 'add',
      imageLoaded: false,
      dragTarget: null,
      dragStartX: 0,
      dragStartY: 0
    },
    drawer: {
      piercingId: null
    },
    inspoFilter: 'all'
  };

  // ── NAVEGACIÓN ─────────────────────────────────────────────────────────────
  function navigate(viewId) {
    if (!viewId) return;
    const views = ['home', 'planner', 'anatomy', 'inspo', 'community', 'piercer'];
    if (!views.includes(viewId)) return;

    document.querySelectorAll('.view').forEach(v => v.classList.remove('is-active'));
    const target = document.getElementById('view-' + viewId);
    if (target) {
      target.classList.add('is-active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Sincronizar nav tabs (header, tablet)
    document.querySelectorAll('.nav-tabs button[data-nav]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.nav === viewId);
    });

    // Sincronizar bottom nav (móvil)
    document.querySelectorAll('.bottom-nav-btn[data-nav]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.nav === viewId);
    });

    state.currentView = viewId;
  }

  // Delegación de eventos para todos los [data-nav] del documento
  function initNavigation() {
    document.body.addEventListener('click', e => {
      const el = e.target.closest('[data-nav]');
      if (!el) return;
      // Ignorar si el click viene de dentro del tool-group de anatomía
      if (el.closest('#tool-group')) return;
      const target = el.dataset.nav;
      if (['home', 'planner', 'anatomy', 'inspo', 'community', 'piercer'].includes(target)) {
        if (document.getElementById('drawer')?.classList.contains('is-open')) closeDrawer();
        navigate(target);
      }
    });
  }

  function initMapEntrance() {
    const close = document.getElementById('btn-close-map-disclaimer');
    const disclaimer = document.getElementById('map-disclaimer');
    if (close && disclaimer) {
      close.addEventListener('click', () => {
        disclaimer.classList.add('is-closed');
      });
    }

    document.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('is-active'));
        card.classList.add('is-active');
      });
    });
  }

  // ── MAPA CORPORAL (VISTA HOME) ─────────────────────────────────────────────
  function initBodyMap() {
    const zoneInfo = document.getElementById('zone-info');

    document.querySelectorAll('.hit-zone').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        const zoneId = AlicynData.normalizeZone ? AlicynData.normalizeZone(el.dataset.zone) : el.dataset.zone;
        const zone = AlicynData.ZONES.find(z => {
          const id = AlicynData.normalizeZone ? AlicynData.normalizeZone(z.id) : z.id;
          return id === zoneId;
        });
        const piercings = AlicynData.byZone(zoneId);

        // Highlight zone
        document.querySelectorAll('.hit-zone').forEach(z => z.classList.remove('is-active'));
        el.classList.add('is-active');

        if (!piercings.length) {
          zoneInfo.innerHTML = `
            <div style="padding:4px 0 12px">
              <h3 style="margin:0 0 2px;font-size:17px">${zone ? zone.label : zoneId}</h3>
              <p style="margin:0 0 14px;font-size:12px;color:var(--text-mute)">Zona en curaduría profesional. Se publicarán opciones solo cuando haya información anatómica responsable.</p>
              <div class="zone-route-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px">
                <button class="btn btn-primary" data-nav="anatomy" style="justify-content:center">Evaluar</button>
                <button class="btn" data-nav="inspo" style="justify-content:center">Inspo segura</button>
                <button class="btn" data-nav="community" style="justify-content:center">Reseñas</button>
                <button class="btn btn-ghost" data-nav="piercer" style="justify-content:center">Piercer</button>
              </div>
            </div>`;
          return;
        }

        zoneInfo.innerHTML = `
          <div style="padding:4px 0 12px">
            <h3 style="margin:0 0 2px;font-size:17px">${zone ? zone.label : zoneId}</h3>
            <p style="margin:0 0 14px;font-size:12px;color:var(--text-mute)">${piercings.length} piercings disponibles · toca para ver detalles</p>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${piercings.map(p => `
                <button class="zone-piercing-btn" data-pid="${p.id}" style="
                  background:var(--bg-3);border:1.5px solid var(--line);border-radius:10px;
                  padding:11px 14px;text-align:left;cursor:pointer;color:var(--text);
                  display:flex;align-items:center;justify-content:space-between;gap:8px;
                  min-height:52px;transition:border-color .15s,background .15s;width:100%;
                ">
                  <div>
                    <div style="font-weight:600;font-size:14px">${p.nombre}</div>
                    <div style="font-size:11px;color:var(--text-mute);margin-top:1px">${p.cicatrizacion}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                    ${dotRating(p.dolor, 10)}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
              `).join('')}
            </div>
            <div class="zone-route-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px">
              <button class="btn btn-primary" data-nav="planner" style="justify-content:center">Planner</button>
              <button class="btn" data-nav="community" style="justify-content:center">Reseñas</button>
              <button class="btn" data-nav="inspo" style="justify-content:center">Inspo</button>
              <button class="btn btn-ghost" data-nav="anatomy" style="justify-content:center">Evaluar</button>
            </div>
          </div>`;

        zoneInfo.querySelectorAll('.zone-piercing-btn').forEach(btn => {
          btn.addEventListener('click', () => openDrawer(btn.dataset.pid));
        });
      });
    });
  }

  function dotRating(value, max) {
    let dots = '';
    for (let i = 1; i <= max; i++) {
      dots += `<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${i <= value ? 'var(--accent)' : 'rgba(255,255,255,0.15)'};margin:0 1px"></span>`;
    }
    return `<span style="display:inline-flex;align-items:center">${dots}</span>`;
  }

  // ── DRAWER DE DETALLE ──────────────────────────────────────────────────────
  function openDrawer(piercingId) {
    const p = AlicynData.byId(piercingId);
    if (!p) return;
    state.drawer.piercingId = piercingId;

    const zone = AlicynData.ZONES.find(z => {
      const id = AlicynData.normalizeZone ? AlicynData.normalizeZone(z.id) : z.id;
      return id === p.zona;
    });
    document.getElementById('drawer-zone').textContent = (zone ? zone.label : '').toUpperCase();
    document.getElementById('drawer-title').textContent = p.nombre;
    document.getElementById('drawer-desc').textContent = p.descripcion;

    const compatHtml = (p.compatibilidad && p.compatibilidad.length)
      ? `<div style="margin-bottom:20px">
          <h4 style="margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)">Combina bien con</h4>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${p.compatibilidad.map(id => {
              const cp = AlicynData.byId(id);
              return cp ? `<button class="chip" data-cp="${id}" style="background:var(--bg-3);border:1px solid var(--line);border-radius:20px;padding:5px 12px;font-size:12px;color:var(--text);cursor:pointer;min-height:32px">${cp.nombre}</button>` : '';
            }).join('')}
          </div>
        </div>` : '';

    document.getElementById('drawer-body').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:20px">
        <div style="background:var(--bg-3);border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:11px;color:var(--text-mute);margin-bottom:6px">Dolor estimado</div>
          <div>${dotRating(p.dolor, 10)}</div>
        </div>
        <div style="background:var(--bg-3);border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:11px;color:var(--text-mute);margin-bottom:4px">Cicatrización</div>
          <div style="font-size:12px;font-weight:600">${p.cicatrizacion}</div>
        </div>
        <div style="background:var(--bg-3);border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:11px;color:var(--text-mute);margin-bottom:4px">Mantenimiento</div>
          <div style="font-size:12px;font-weight:600">${p.mantenimiento}</div>
        </div>
      </div>

      ${drawerSection('Joyería inicial sugerida', `<p style="margin:0;font-size:13px">${p.joyeria}</p>`)}
      ${drawerSection('Molestias frecuentes', iconList(p.molestias, '#e6c560'))}
      ${drawerSection('Cuidados esenciales', iconList(p.cuidados, 'var(--accent)'))}
      ${drawerSection('Errores comunes', iconList(p.errores, '#e07a7a'))}
      ${drawerSection('Señales de alerta', iconList(p.alertas, '#e07a7a'))}
      ${drawerSection('Recomendación', `<p style="margin:0;font-size:13px">${p.recomendacion}</p>`)}
      ${drawerSection('Inspiración', `<p style="margin:0;font-size:13px;color:var(--text-soft)">${p.inspiracion}</p>`)}
      ${compatHtml}
      <div class="disclaimer-box">${p.disclaimer}</div>
    `;

    // Chips de compatibilidad
    document.getElementById('drawer-body').querySelectorAll('.chip[data-cp]').forEach(chip => {
      chip.addEventListener('click', () => openDrawer(chip.dataset.cp));
    });

    document.getElementById('drawer').classList.add('is-open');
    document.getElementById('drawer-backdrop').classList.add('is-open');
    document.getElementById('drawer').setAttribute('aria-hidden', 'false');
    document.getElementById('drawer-backdrop').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function drawerSection(title, content) {
    return `
      <div style="margin-bottom:18px">
        <h4 style="margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)">${title}</h4>
        ${content}
      </div>`;
  }

  function iconList(items, color) {
    return `<ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px">
      ${items.map(item => `
        <li style="display:flex;align-items:flex-start;gap:8px;font-size:13px">
          <span style="width:5px;height:5px;border-radius:50%;background:${color};margin-top:6px;flex-shrink:0"></span>
          <span>${item}</span>
        </li>`).join('')}
    </ul>`;
  }

  function closeDrawer() {
    document.getElementById('drawer').classList.remove('is-open');
    document.getElementById('drawer-backdrop').classList.remove('is-open');
    document.getElementById('drawer').setAttribute('aria-hidden', 'true');
    document.getElementById('drawer-backdrop').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initDrawer() {
    document.getElementById('drawer-close').addEventListener('click', closeDrawer);
    document.getElementById('drawer-backdrop').addEventListener('click', closeDrawer);
    document.getElementById('btn-save-plan').addEventListener('click', () => {
      const id = state.drawer.piercingId;
      if (!id) return;
      state.planner.selected.add(id);
      renderPlanner();
      closeDrawer();
      navigate('planner');
    });
  }

  // ── INSPIRACIÓN CURADA ─────────────────────────────────────────────────────
  function initInspo() {
    const filter = document.getElementById('inspo-filter');
    if (filter) {
      filter.addEventListener('change', e => {
        state.inspoFilter = e.target.value;
        renderInspo();
      });
    }
    renderInspo();
  }

  function renderInspo() {
    const grid = document.getElementById('inspo-grid');
    if (!grid) return;

    const filter = state.inspoFilter || 'all';
    const cards = AlicynData.PIERCINGS
      .filter(p => filter === 'all' || p.zona === (AlicynData.normalizeZone ? AlicynData.normalizeZone(filter) : filter))
      .map(p => {
        const zone = AlicynData.ZONES.find(z => {
          const id = AlicynData.normalizeZone ? AlicynData.normalizeZone(z.id) : z.id;
          return id === p.zona;
        });
        return `
          <article class="inspo-card" data-zone="${p.zona}">
            <div class="inspo-thumb" aria-hidden="true">
              <span>${(zone ? zone.short : p.zona).slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <span class="inspo-zone">${zone ? zone.label : p.zona}</span>
              <h3>${p.nombre}</h3>
              <p>${p.inspiracion || 'Referencia pendiente de curaduría visual.'}</p>
              <div class="inspo-meta">
                <span>Dolor ${p.dolor}/10</span>
                <span>${p.cicatrizacion}</span>
              </div>
              <button class="btn btn-ghost" data-pid="${p.id}">Ver criterio</button>
            </div>
          </article>`;
      });

    if (!cards.length) {
      grid.innerHTML = `
        <div class="inspo-empty">
          <h3>No hay referencias para esta zona todavía.</h3>
          <p>Se publicarán cuando pasen curaduría anatómica, ética y de joyería segura.</p>
        </div>`;
      return;
    }

    grid.innerHTML = `
      <article class="inspo-panel danger-panel">
        <h3>No todo lo viral es viable</h3>
        <p>Las referencias se filtran por anatomía, presión, joyería inicial, riesgo de migración y expectativas realistas. La inspiración no debe reemplazar una evaluación presencial.</p>
      </article>
      ${cards.join('')}`;

    grid.querySelectorAll('[data-pid]').forEach(btn => {
      btn.addEventListener('click', () => openDrawer(btn.dataset.pid));
    });
  }

  // ── PLANEADOR DE OREJA ─────────────────────────────────────────────────────
  const EAR_POINT_SELECTOR = '.ear-point-btn, .ear-point';

  function plannerPointPhase(id) {
    const p = AlicynData.byId(id);
    if (!p) return '';
    if (p.dolor <= 3) return 'p1';
    if (p.dolor <= 5) return 'p2';
    return 'p3';
  }

  function applyEarSide() {
    const isRight = state.planner.side === 'right';
    const earPhoto = document.getElementById('ear-photo');
    if (earPhoto) earPhoto.classList.toggle('is-right', isRight);
    document.querySelectorAll(EAR_POINT_SELECTOR).forEach(pt => {
      if (!pt.dataset.baseX) pt.dataset.baseX = pt.style.getPropertyValue('--x').trim();
      if (pt.dataset.baseX) {
        pt.style.setProperty('--x', isRight ? `calc(100% - ${pt.dataset.baseX})` : pt.dataset.baseX);
      }
    });
  }

  function initPlanner() {
    // Puntos sobre la imagen de oreja
    document.querySelectorAll(EAR_POINT_SELECTOR).forEach(pt => {
      pt.style.cursor = 'pointer';
      pt.addEventListener('click', () => {
        const id = pt.dataset.piercing;
        if (state.planner.selected.has(id)) {
          state.planner.selected.delete(id);
        } else {
          state.planner.selected.add(id);
        }
        renderPlanner();
      });
    });

    // Toggle izquierda/derecha
    document.querySelectorAll('.planner-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.planner-toggle button').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.planner.side = btn.dataset.side;
        applyEarSide();
      });
    });

    document.getElementById('btn-clear-plan').addEventListener('click', () => {
      state.planner.selected.clear();
      renderPlanner();
    });
    document.getElementById('btn-export-plan').addEventListener('click', exportPlan);
    document.getElementById('btn-share-plan').addEventListener('click', sharePlan);
  }

  function renderPlanner() {
    const sel = [...state.planner.selected];
    const count = sel.length;

    // Actualizar puntos sobre la imagen
    document.querySelectorAll(EAR_POINT_SELECTOR).forEach(pt => {
      const selected = state.planner.selected.has(pt.dataset.piercing);
      pt.classList.toggle('is-selected', selected);
      if (selected) pt.dataset.phase = plannerPointPhase(pt.dataset.piercing);
      else delete pt.dataset.phase;
    });
    const earPhoto = document.getElementById('ear-photo');
    if (earPhoto) earPhoto.classList.toggle('has-selection', count > 0);
    applyEarSide();

    // Carga de Cicatrización Alicyn
    const fill   = document.getElementById('load-fill');
    const label  = document.getElementById('load-label');
    const cnt    = document.getElementById('load-count');
    const pct    = Math.min((count / 9) * 100, 100);
    fill.style.width = pct + '%';
    cnt.textContent = count + (count === 1 ? ' piercing' : ' piercings');

    if (count === 0) {
      label.textContent = '—';
      fill.style.background = '';
    } else {
      const load = AlicynData.getHealingLoad(count);
      label.textContent = load.label;
      fill.style.background = load.color;
    }

    // Fases
    const output = document.getElementById('phases-output');
    if (!count) {
      output.innerHTML = '<p style="color:var(--text-mute);font-size:13px;margin:0">Aún no has seleccionado piercings.</p>';
      return;
    }

    const piercings = sel.map(id => AlicynData.byId(id)).filter(Boolean);
    const p1 = piercings.filter(p => p.dolor <= 3);
    const p2 = piercings.filter(p => p.dolor === 4 || p.dolor === 5);
    const p3 = piercings.filter(p => p.dolor >= 6);

    const phaseBlock = (label, desc, items, color) => {
      if (!items.length) return '';
      return `<div style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>
          <strong style="font-size:13px">${label}</strong>
        </div>
        <p style="font-size:11px;color:var(--text-mute);margin:0 0 8px 16px">${desc}</p>
        <div style="display:flex;flex-direction:column;gap:4px;margin-left:16px">
          ${items.map(p => `
            <div style="background:var(--bg-3);border:1px solid var(--line);border-radius:8px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:40px">
              <span style="font-size:13px;font-weight:500">${p.nombre}</span>
              <span style="font-size:11px;color:var(--text-mute);white-space:nowrap">${p.cicatrizacion}</span>
            </div>`).join('')}
        </div>
      </div>`;
    };

    let html = '';
    html += phaseBlock('Fase 1 · Base', AlicynData.PROJECT_PHASES[0].desc, p1, 'var(--accent)');
    html += phaseBlock('Fase 2 · Construcción', AlicynData.PROJECT_PHASES[1].desc, p2, 'var(--warn)');
    html += phaseBlock('Fase 3 · Cierre', AlicynData.PROJECT_PHASES[2].desc, p3, 'var(--danger)');

    // Nota de carga
    const load = AlicynData.getHealingLoad(count);
    if (count > 0) {
      html += `<div class="disclaimer-box" style="margin-top:8px;font-size:12px">
        <strong style="color:${load.color}">Carga ${load.label}:</strong> ${load.advice}
      </div>`;
    }
    output.innerHTML = html;
  }

  function exportPlan() {
    const sel = [...state.planner.selected];
    if (!sel.length) { showToast('Selecciona al menos un piercing para exportar.'); return; }
    const piercings = sel.map(id => AlicynData.byId(id)).filter(Boolean);
    const p1 = piercings.filter(p => p.dolor <= 3);
    const p2 = piercings.filter(p => p.dolor === 4 || p.dolor === 5);
    const p3 = piercings.filter(p => p.dolor >= 6);
    const load = AlicynData.getHealingLoad(piercings.length);
    const dateStr = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    const lines = [
      'ALICYN BODY MAP · Plan de Composición de Oreja',
      '═'.repeat(50),
      dateStr,
      '',
      `Piercings en el plan: ${piercings.length}`,
      `Carga de Cicatrización Alicyn: ${load.label}`,
      '',
      '─'.repeat(50),
      'COMPOSICIÓN PLANEADA',
      '─'.repeat(50),
      ...piercings.map((p, i) => `${i + 1}. ${p.nombre}  ·  Proceso estimado: ${p.cicatrizacion}`),
      '',
      '─'.repeat(50),
      'FASES SUGERIDAS',
      '─'.repeat(50),
      ...(p1.length ? [`Fase 1 (Base):         ${p1.map(p => p.nombre).join(', ')}`] : []),
      ...(p2.length ? [`Fase 2 (Construcción): ${p2.map(p => p.nombre).join(', ')}`] : []),
      ...(p3.length ? [`Fase 3 (Cierre):       ${p3.map(p => p.nombre).join(', ')}`] : []),
      '',
      `${load.advice}`,
      '',
      '─'.repeat(50),
      'CUIDADOS GENERALES',
      '─'.repeat(50),
      '· Limpieza con suero fisiológico 1–2 veces al día.',
      '· No manipular, rotar ni retirar la joyería antes de tiempo.',
      '· Consulta a tu perforador ante cualquier signo inusual.',
      '· Los tiempos de proceso son orientativos. Cada anatomía es diferente.',
      '',
      '─'.repeat(50),
      AlicynData.ANATOMY_REMINDER,
      '',
      AlicynData.ALICYN_DISCLAIMER
    ];
    downloadText(lines.join('\n'), 'plan-oreja-alicyn.txt');
  }

  function sharePlan() {
    const sel = [...state.planner.selected];
    if (!sel.length) { showToast('Selecciona al menos un piercing.'); return; }
    const text = 'Mi plan de oreja Alicyn: ' + sel.map(id => {
      const p = AlicynData.byId(id);
      return p ? p.nombre : id;
    }).join(', ');
    if (navigator.share) {
      navigator.share({ title: 'Mi plan Alicyn', text });
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast('Plan copiado al portapapeles.'));
    } else {
      showToast('Tu navegador no permite compartir automáticamente.');
    }
  }

  // ── EVALUACIÓN ANATÓMICA ───────────────────────────────────────────────────
  let cvs = null;   // canvas element
  let ctx = null;   // 2d context
  let img = null;   // HTMLImageElement
  let imgDataUrl = ''; // guardado para redibujado en resize

  function initAnatomy() {
    // Chips de estado
    const statesEl = document.getElementById('ed-states');
    statesEl.innerHTML = AlicynData.ANATOMY_STATES.map(s => `
      <button class="state-chip" data-state="${s.id}"
        style="border-color:${s.color};color:${s.color}">${s.label}</button>
    `).join('');

    statesEl.querySelectorAll('.state-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        statesEl.querySelectorAll('.state-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        updatePoint({ state: chip.dataset.state });
      });
    });

    // Subida de imagen
    document.getElementById('btn-upload').addEventListener('click', () =>
      document.getElementById('anatomy-file').click());
    document.getElementById('anatomy-file').addEventListener('change', handleUpload);

    // Herramientas
    document.querySelectorAll('#tool-group [data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#tool-group [data-tool]').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.anatomy.activeTool = btn.dataset.tool;
        updateCursor();
      });
    });

    // Acciones
    document.getElementById('btn-clear-image').addEventListener('click', clearImage);
    document.getElementById('btn-summary').addEventListener('click', generateSummary);

    // Formulario de editor (live update)
    document.getElementById('ed-name').addEventListener('input', e => updatePoint({ name: e.target.value }));
    document.getElementById('ed-phase').addEventListener('change', e => updatePoint({ phase: e.target.value }));
    document.getElementById('ed-jewelry').addEventListener('input', e => updatePoint({ jewelry: e.target.value }));
    document.getElementById('ed-note').addEventListener('input', e => updatePoint({ note: e.target.value }));
    document.getElementById('btn-delete-point').addEventListener('click', deleteSelected);

    // Modal de resumen
    document.getElementById('summary-close').addEventListener('click', closeSummary);
    document.getElementById('summary-modal').addEventListener('click', e => {
      if (e.target.id === 'summary-modal') closeSummary();
    });
    document.getElementById('btn-summary-copy').addEventListener('click', copySummary);
    document.getElementById('btn-summary-download').addEventListener('click', downloadSummary);
    document.getElementById('btn-summary-print').addEventListener('click', () => window.print());
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => loadImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function loadImage(dataUrl) {
    imgDataUrl = dataUrl;
    const newImg = new Image();
    newImg.onload = () => {
      img = newImg;
      state.anatomy.imageLoaded = true;
      state.anatomy.points = [];
      state.anatomy.selectedId = null;
      setupCanvas();
      renderPointsList();
      selectPoint(null);
    };
    newImg.src = dataUrl;
  }

  function setupCanvas() {
    const stage = document.getElementById('anatomy-stage');
    stage.innerHTML = '';
    stage.style.position = 'relative';

    cvs = document.createElement('canvas');
    cvs.id = 'anatomy-canvas';
    cvs.style.cssText = `
      display:block;width:100%;height:100%;
      touch-action:none;user-select:none;
      border-radius:10px;
    `;
    stage.appendChild(cvs);
    ctx = cvs.getContext('2d');

    // Dimensionar canvas al tamaño real del stage
    function sizeCanvas() {
      const r = stage.getBoundingClientRect();
      cvs.width  = Math.round(r.width  * (window.devicePixelRatio || 1));
      cvs.height = Math.round(r.height * (window.devicePixelRatio || 1));
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      drawCanvas();
    }

    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(stage);
    requestAnimationFrame(sizeCanvas);

    updateCursor();

    // Eventos touch & pointer (unificados para móvil y escritorio)
    cvs.addEventListener('pointerdown',  onDown);
    cvs.addEventListener('pointermove',  onMove);
    cvs.addEventListener('pointerup',    onUp);
    cvs.addEventListener('pointercancel',onUp);
  }

  function updateCursor() {
    if (!cvs) return;
    const t = state.anatomy.activeTool;
    cvs.style.cursor = t === 'delete' ? 'crosshair' : t === 'move' ? 'grab' : 'crosshair';
  }

  // Convierte coordenadas del evento a coordenadas CSS del canvas (independiente de DPR)
  function evtPos(e) {
    const r = cvs.getBoundingClientRect();
    return {
      x: e.clientX - r.left,
      y: e.clientY - r.top
    };
  }

  // Punto en porcentaje del canvas CSS
  function toPct(x, y) {
    const r = cvs.getBoundingClientRect();
    return { xPct: x / r.width, yPct: y / r.height };
  }

  // Coordenadas CSS del punto a partir de porcentajes
  function fromPct(pt) {
    const r = cvs.getBoundingClientRect();
    return { x: pt.xPct * r.width, y: pt.yPct * r.height };
  }

  function hitTest(x, y) {
    const R = 18; // radio de hit test (táctil amigable)
    for (let i = state.anatomy.points.length - 1; i >= 0; i--) {
      const pt = state.anatomy.points[i];
      const { x: px, y: py } = fromPct(pt);
      const dx = px - x, dy = py - y;
      if (Math.sqrt(dx * dx + dy * dy) < R) return pt;
    }
    return null;
  }

  function onDown(e) {
    e.preventDefault();
    if (!state.anatomy.imageLoaded) return;
    const { x, y } = evtPos(e);
    const tool = state.anatomy.activeTool;
    const hit  = hitTest(x, y);

    if (tool === 'add') {
      if (hit) {
        selectPoint(hit.id);
      } else {
        const { xPct, yPct } = toPct(x, y);
        const newPt = { id: Date.now() + Math.random(), xPct, yPct, name: '', state: 'compatible', phase: '', jewelry: '', note: '' };
        state.anatomy.points.push(newPt);
        selectPoint(newPt.id);
        drawCanvas();
        renderPointsList();
      }
    } else if (tool === 'move') {
      if (hit) {
        state.anatomy.dragTarget = hit.id;
        cvs.style.cursor = 'grabbing';
        cvs.setPointerCapture(e.pointerId);
        selectPoint(hit.id);
      }
    } else if (tool === 'delete') {
      if (hit) {
        state.anatomy.points = state.anatomy.points.filter(p => p.id !== hit.id);
        if (state.anatomy.selectedId === hit.id) selectPoint(null);
        drawCanvas();
        renderPointsList();
      }
    }
  }

  function onMove(e) {
    if (!state.anatomy.dragTarget) return;
    e.preventDefault();
    const { x, y } = evtPos(e);
    const pt = state.anatomy.points.find(p => p.id === state.anatomy.dragTarget);
    if (pt) {
      const { xPct, yPct } = toPct(x, y);
      pt.xPct = Math.max(0, Math.min(1, xPct));
      pt.yPct = Math.max(0, Math.min(1, yPct));
      drawCanvas();
    }
  }

  function onUp(e) {
    if (state.anatomy.dragTarget) {
      state.anatomy.dragTarget = null;
      updateCursor();
      renderPointsList();
    }
  }

  function drawCanvas() {
    if (!ctx || !cvs) return;
    // Dimensiones CSS (sin DPR)
    const r   = cvs.getBoundingClientRect();
    const W   = r.width;
    const H   = r.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.scale(dpr, dpr);

    // Dibujar imagen con object-fit:contain centrada
    if (img) {
      const imgRatio   = img.naturalWidth / img.naturalHeight;
      const stageRatio = W / H;
      let drawW, drawH, drawX, drawY;
      if (imgRatio > stageRatio) {
        drawW = W; drawH = W / imgRatio;
      } else {
        drawH = H; drawW = H * imgRatio;
      }
      drawX = (W - drawW) / 2;
      drawY = (H - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    // Dibujar puntos
    state.anatomy.points.forEach((pt, idx) => {
      const { x, y } = fromPct(pt);
      const isSel  = pt.id === state.anatomy.selectedId;
      const stData = AlicynData.ANATOMY_STATES.find(s => s.id === pt.state) || AlicynData.ANATOMY_STATES[0];
      const color  = stData.color;
      const R      = isSel ? 13 : 10;

      // Halo de selección
      if (isSel) {
        ctx.beginPath();
        ctx.arc(x, y, R + 8, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x, y, R, x, y, R + 8);
        grad.addColorStop(0, color + '55');
        grad.addColorStop(1, color + '00');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Círculo exterior (borde)
      ctx.beginPath();
      ctx.arc(x, y, R + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();

      // Relleno
      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Número
      ctx.font = `bold ${isSel ? 11 : 10}px Inter, sans-serif`;
      ctx.fillStyle = '#000';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(idx + 1, x, y);

      // Etiqueta con nombre
      if (pt.name) {
        const tag   = pt.name;
        const tx    = x + R + 8;
        const ty    = y - R - 4;
        ctx.font    = '11px Inter, sans-serif';
        ctx.textAlign = 'left';
        const tw    = ctx.measureText(tag).width;
        const pad   = 5;
        const tagH  = 18;

        // Fondo de etiqueta
        ctx.fillStyle = 'rgba(10,13,12,0.82)';
        const lx = tx - pad;
        const ly = ty - tagH / 2;
        ctx.beginPath();
        ctx.roundRect
          ? ctx.roundRect(lx, ly, tw + pad * 2, tagH, 4)
          : ctx.rect(lx, ly, tw + pad * 2, tagH);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.fillText(tag, tx, ty);
      }
    });

    ctx.restore();
  }

  function selectPoint(id) {
    state.anatomy.selectedId = id;
    const form = document.getElementById('editor-form');
    const pt   = id ? state.anatomy.points.find(p => p.id === id) : null;

    if (pt) {
      form.style.display = '';
      form.classList.remove('hidden');
      document.getElementById('ed-name').value    = pt.name    || '';
      document.getElementById('ed-phase').value   = pt.phase   || '';
      document.getElementById('ed-jewelry').value = pt.jewelry || '';
      document.getElementById('ed-note').value    = pt.note    || '';

      document.querySelectorAll('#ed-states .state-chip').forEach(chip => {
        chip.classList.toggle('is-active', chip.dataset.state === (pt.state || 'compatible'));
      });

      // En móvil: hacer scroll al editor
      const editor = document.getElementById('point-editor');
      if (editor && window.innerWidth < 768) {
        setTimeout(() => editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      }
    } else {
      form.style.display = 'none';
      form.classList.add('hidden');
    }

    drawCanvas();
    renderPointsList();
  }

  function updatePoint(changes) {
    if (!state.anatomy.selectedId) return;
    const pt = state.anatomy.points.find(p => p.id === state.anatomy.selectedId);
    if (!pt) return;
    Object.assign(pt, changes);
    drawCanvas();
    renderPointsList();
  }

  function deleteSelected() {
    if (!state.anatomy.selectedId) return;
    state.anatomy.points = state.anatomy.points.filter(p => p.id !== state.anatomy.selectedId);
    selectPoint(null);
    drawCanvas();
    renderPointsList();
  }

  function renderPointsList() {
    const list = document.getElementById('points-list');
    if (!state.anatomy.points.length) {
      list.innerHTML = '<p style="color:var(--text-mute);font-size:13px;margin:0">Aún no has marcado puntos.</p>';
      return;
    }
    list.innerHTML = state.anatomy.points.map((pt, i) => {
      const s    = AlicynData.ANATOMY_STATES.find(x => x.id === pt.state) || AlicynData.ANATOMY_STATES[0];
      const isS  = pt.id === state.anatomy.selectedId;
      return `
        <button class="point-list-item" data-pid="${pt.id}" style="
          display:flex;align-items:center;gap:10px;padding:10px 10px;
          border-radius:9px;cursor:pointer;width:100%;text-align:left;
          background:${isS ? 'var(--accent-soft)' : 'var(--bg-3)'};
          border:1.5px solid ${isS ? 'var(--accent)' : 'var(--line)'};
          margin-bottom:4px;min-height:48px;
        ">
          <span style="
            width:24px;height:24px;border-radius:50%;background:${s.color};color:#000;
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:700;flex-shrink:0;
          ">${i + 1}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${pt.name || 'Sin nombre'}
            </div>
            <div style="font-size:11px;color:${s.color}">${s.label}</div>
          </div>
        </button>`;
    }).join('');

    list.querySelectorAll('.point-list-item').forEach(item => {
      item.addEventListener('click', () => selectPoint(parseFloat(item.dataset.pid)));
    });
  }

  function clearImage() {
    if (!confirm('¿Limpiar imagen y todos los puntos marcados?')) return;
    state.anatomy = {
      points: [], selectedId: null, activeTool: 'add',
      imageLoaded: false, dragTarget: null, dragStartX: 0, dragStartY: 0
    };
    img = null; cvs = null; ctx = null; imgDataUrl = '';

    document.getElementById('anatomy-stage').innerHTML = `
      <div class="empty-state">
        <div class="ico">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
        </div>
        <p style="margin:0 0 4px;color:var(--text-soft);font-size:14px">Sube una foto de la oreja del cliente</p>
        <p style="margin:0;font-size:12px">JPG o PNG. La imagen se mantiene local en este navegador.</p>
      </div>`;

    // Reset tool buttons
    document.querySelectorAll('#tool-group [data-tool]').forEach((b, i) => b.classList.toggle('is-active', i === 0));

    const form = document.getElementById('editor-form');
    form.style.display = 'none';
    form.classList.add('hidden');
    renderPointsList();
  }

  // ── RESUMEN MODAL ──────────────────────────────────────────────────────────
  function getClientName() {
    const el = document.getElementById('ed-client-name');
    return el ? el.value.trim() : '';
  }

  function generateSummary() {
    if (!state.anatomy.points.length) {
      showToast('Marca al menos un punto antes de generar el resumen.');
      return;
    }
    const dateStr    = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const clientName = getClientName();
    const phased     = state.anatomy.points.filter(p => p.phase);
    const load       = AlicynData.getHealingLoad(state.anatomy.points.length);

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--line)">
        <div>
          ${clientName ? `<div style="font-size:16px;font-weight:600;margin-bottom:2px">${clientName}</div>` : ''}
          <div style="font-size:12px;color:var(--text-mute)">${dateStr} \xB7 Evaluaci\xF3n anat\xF3mica asistida</div>
          <div style="font-size:12px;color:var(--text-soft);font-style:italic;margin-top:4px">“Un buen proyecto no empieza con la joyer\xEDa, empieza con la anatom\xEDa.”</div>
        </div>
        <div style="background:${load.color}18;border:1px solid ${load.color}44;border-radius:10px;padding:8px 14px;text-align:center;flex-shrink:0">
          <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${load.color};margin-bottom:2px">Carga de Cicatrizaci\xF3n</div>
          <div style="font-size:16px;font-weight:700;color:${load.color}">${load.label}</div>
          <div style="font-size:10px;color:var(--text-mute);margin-top:1px">${state.anatomy.points.length} punto${state.anatomy.points.length !== 1 ? 's' : ''} evaluado${state.anatomy.points.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <p style="font-size:12px;color:var(--text-mute);margin:0 0 14px">${load.advice}</p>
      <h4 style="margin:0 0 10px;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:var(--accent)">Observaciones por punto</h4>
    `;

    state.anatomy.points.forEach((pt, i) => {
      const s  = AlicynData.stateById(pt.state);
      const ph = AlicynData.PROJECT_PHASES.find(x => x.id === pt.phase);
      html += `
        <div style="border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span style="width:22px;height:22px;border-radius:50%;background:${s.color};color:#000;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">${i+1}</span>
            <strong style="font-size:14px;flex:1">${pt.name || 'Punto sin nombre'}</strong>
            <span style="font-size:11px;font-weight:600;color:${s.color};background:${s.color}1a;padding:3px 9px;border-radius:20px;white-space:nowrap">${s.shortLabel || s.label}</span>
          </div>
          <div style="font-size:11px;color:var(--text-mute);margin-bottom:6px;padding-left:30px;font-style:italic">${s.desc}</div>
          ${pt.jewelry ? `<div style="font-size:12px;color:var(--text-soft);margin-bottom:3px;padding-left:30px">💎 Joyer\xEDa sugerida: <em>${pt.jewelry}</em></div>` : ''}
          ${ph ? `<div style="font-size:12px;color:var(--text-mute);margin-bottom:3px;padding-left:30px">📅 ${ph.label}</div>` : ''}
          ${pt.note ? `<div style="font-size:12px;color:var(--text-soft);background:var(--bg-3);border:1px solid var(--line);padding:7px 10px;border-radius:7px;margin-top:6px;margin-left:30px;line-height:1.5">${pt.note}</div>` : ''}
        </div>`;
    });

    if (phased.length) {
      html += `<h4 style="margin:18px 0 10px;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:var(--accent)">Plan por fases</h4>`;
      AlicynData.PROJECT_PHASES.forEach(ph => {
        const pts = phased.filter(p => p.phase === ph.id);
        if (!pts.length) return;
        html += `<div style="margin-bottom:10px;padding-left:4px">
          <strong style="font-size:13px">${ph.label}</strong>
          <p style="font-size:11px;color:var(--text-mute);margin:2px 0 6px">${ph.desc}</p>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${pts.map(p => `<span style="background:var(--bg-3);border:1px solid var(--line);border-radius:6px;padding:4px 10px;font-size:12px">${p.name || 'Sin nombre'}</span>`).join('')}
          </div>
        </div>`;
      });
    }

    html += `
      <div style="background:var(--bg-3);border:1px solid var(--line);border-radius:10px;padding:14px;margin-top:16px;margin-bottom:10px">
        <h4 style="margin:0 0 8px;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:var(--accent)">Cuidados orientativos</h4>
        <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px">
          <li style="display:flex;gap:8px;font-size:12px"><span style="color:var(--accent);flex-shrink:0">\xB7</span> Limpieza con suero fisiol\xF3gico, 1–2 veces al d\xEDa.</li>
          <li style="display:flex;gap:8px;font-size:12px"><span style="color:var(--accent);flex-shrink:0">\xB7</span> No manipular, rotar ni retirar la joyer\xEDa antes de tiempo.</li>
          <li style="display:flex;gap:8px;font-size:12px"><span style="color:var(--accent);flex-shrink:0">\xB7</span> Ante cualquier signo inusual, consulta a tu perforador.</li>
          <li style="display:flex;gap:8px;font-size:12px"><span style="color:var(--accent);flex-shrink:0">\xB7</span> Los tiempos de proceso son orientativos. Tu anatom\xEDa marca el ritmo.</li>
        </ul>
      </div>
    `;

    const waText = buildWhatsAppText(clientName, load);
    html += `
      <div style="margin-top:4px;margin-bottom:12px">
        <h4 style="margin:0 0 8px;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:var(--accent)">Texto listo para WhatsApp</h4>
        <div id="wa-text-block" style="background:var(--bg-3);border:1px solid var(--line);border-radius:10px;padding:12px;font-size:12px;line-height:1.7;white-space:pre-line;color:var(--text-soft)">${waText}</div>
        <button id="btn-copy-wa" style="margin-top:8px;background:var(--accent-soft);border:1px solid var(--accent);color:var(--accent);border-radius:8px;padding:8px 16px;font-size:12px;cursor:pointer;font-family:inherit;min-height:36px">Copiar texto WhatsApp</button>
      </div>
    `;

    html += `
      <div class="disclaimer-box" style="margin-top:4px">
        ${AlicynData.ANATOMY_REMINDER}
        <br><br>
        <em style="font-size:11px;color:var(--text-mute)">${AlicynData.ALICYN_DISCLAIMER}</em>
      </div>`;

    document.getElementById('summary-body').innerHTML = html;

    const waBtnEl = document.getElementById('btn-copy-wa');
    if (waBtnEl) {
      waBtnEl.addEventListener('click', () => {
        if (!navigator.clipboard?.writeText) {
          showToast('Tu navegador no permite copiar automáticamente.');
          return;
        }
        navigator.clipboard.writeText(waText).then(() => {
          waBtnEl.textContent = '✓ Copiado';
          setTimeout(() => { waBtnEl.textContent = 'Copiar texto WhatsApp'; }, 2000);
        });
      });
    }

    document.getElementById('summary-modal').classList.add('is-open');
    document.getElementById('summary-modal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function buildWhatsAppText(clientName, load) {
    const greeting = clientName ? `Hola ${clientName} 👋` : 'Hola 👋';
    const pts = state.anatomy.points.map((pt, i) => {
      const s = AlicynData.stateById(pt.state);
      let line = `${i + 1}. *${pt.name || 'Punto ' + (i+1)}* — ${s.shortLabel || s.label}`;
      if (pt.jewelry) line += `\n   Joyer\xEDa sugerida: ${pt.jewelry}`;
      if (pt.note) line += `\n   Nota: ${pt.note}`;
      return line;
    }).join('\n\n');

    return `${greeting}\n\nTe comparto el resumen de tu evaluaci\xF3n anat\xF3mica asistida con Alicyn Body Map:\n\n*Carga de Cicatrizaci\xF3n Alicyn: ${load.label}*\n${load.advice}\n\n*Puntos evaluados:*\n${pts}\n\n*Cuidados b\xE1sicos:*\n\xB7 Limpieza con suero fisiol\xF3gico 1–2 veces al d\xEDa\n\xB7 No manipular ni retirar la joyer\xEDa antes de tiempo\n\xB7 Consulta ante cualquier signo inusual\n\n_Esta evaluaci\xF3n es orientativa y no sustituye la valoraci\xF3n presencial de un perforador profesional. La viabilidad final depende de tu anatom\xEDa real._\n\n— Generado con Alicyn Body Map`;
  }

  function closeSummary() {
    document.getElementById('summary-modal').classList.remove('is-open');
    document.getElementById('summary-modal').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function buildSummaryText() {
    const dateStr    = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const clientName = getClientName();
    const load       = AlicynData.getHealingLoad(state.anatomy.points.length);
    const sep        = '─'.repeat(52);

    const lines = [
      'ALICYN BODY MAP \xB7 Resumen de Evaluaci\xF3n Anat\xF3mica',
      '═'.repeat(52),
      dateStr,
      ...(clientName ? [`Cliente: ${clientName}`] : []),
      '',
      '“Un buen proyecto no empieza con la joyer\xEDa, empieza con la anatom\xEDa.”',
      '',
      sep,
      `CARGA DE CICATRIZACI\xD3N ALICYN: ${load.label.toUpperCase()}`,
      load.desc,
      load.advice,
      sep,
      '',
      'OBSERVACIONES POR PUNTO',
      sep
    ];

    state.anatomy.points.forEach((pt, i) => {
      const s  = AlicynData.stateById(pt.state);
      const ph = AlicynData.PROJECT_PHASES.find(x => x.id === pt.phase);
      lines.push(`${i + 1}. ${pt.name || 'Sin nombre'}  \xB7  ${s.label}`);
      lines.push(`   → ${s.desc}`);
      if (pt.jewelry) lines.push(`   Joyer\xEDa sugerida: ${pt.jewelry}`);
      if (ph)         lines.push(`   Fase: ${ph.label}`);
      if (pt.note)    lines.push(`   Nota profesional: ${pt.note}`);
      lines.push('');
    });

    const phased = state.anatomy.points.filter(p => p.phase);
    if (phased.length) {
      lines.push(sep);
      lines.push('PLAN POR FASES');
      lines.push(sep);
      AlicynData.PROJECT_PHASES.forEach(ph => {
        const pts = phased.filter(p => p.phase === ph.id);
        if (!pts.length) return;
        lines.push(`${ph.label}: ${pts.map(p => p.name || 'Sin nombre').join(', ')}`);
      });
      lines.push('');
    }

    lines.push(sep);
    lines.push('CUIDADOS ORIENTATIVOS');
    lines.push(sep);
    lines.push('\xB7 Limpieza con suero fisiol\xF3gico, 1–2 veces al d\xEDa.');
    lines.push('\xB7 No manipular, rotar ni retirar la joyer\xEDa antes de tiempo.');
    lines.push('\xB7 Ante cualquier signo inusual, consulta a tu perforador.');
    lines.push('\xB7 Los tiempos de proceso son orientativos. Tu anatom\xEDa marca el ritmo.');
    lines.push('');
    lines.push(sep);
    lines.push(AlicynData.ANATOMY_REMINDER);
    lines.push('');
    lines.push(AlicynData.ALICYN_DISCLAIMER);
    return lines.join('\n');
  }

  function copySummary() {
    if (!navigator.clipboard?.writeText) {
      showToast('Tu navegador no permite copiar automáticamente.');
      return;
    }
    navigator.clipboard.writeText(buildSummaryText()).then(() => {
      const btn = document.getElementById('btn-summary-copy');
      const orig = btn.textContent;
      btn.textContent = '✓ Copiado';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  }

  function downloadSummary() {
    const clientName = getClientName();
    const slug = clientName
      ? 'evaluacion-' + clientName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.txt'
      : 'evaluacion-anatomica-alicyn.txt';
    downloadText(buildSummaryText(), slug);
  }

  // ── MODO PIERCER ───────────────────────────────────────────────────────────
  function initPiercer() {
    const btn = document.getElementById('btn-consult-mode');
    if (!btn) return;
    btn.addEventListener('click', () => {
      document.querySelector('.app-footer').style.display = 'none';
      showToast('Modo consulta activo. Recarga la página para salir.');
    });
  }

  function initGlobalKeys() {
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      closeDrawer();
      closeSummary();
    });
  }

  // ── UTILIDADES ─────────────────────────────────────────────────────────────
  function downloadText(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showToast(msg) {
    let t = document.getElementById('alicyn-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'alicyn-toast';
      t.style.cssText = `
        position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);left:50%;
        transform:translateX(-50%) translateY(20px);
        background:var(--bg-3,#1a2220);border:1px solid var(--accent,#5fd4a8);
        color:var(--text,#eef3f1);border-radius:12px;padding:10px 20px;
        font-size:13px;z-index:9999;opacity:0;transition:opacity .2s,transform .2s;
        max-width:90vw;text-align:center;pointer-events:none;
      `;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
  }

  // ── ARRANQUE ───────────
  function boot() {
    const ef = document.getElementById('editor-form');
    if (ef) ef.style.display = 'none';

    initNavigation();
    initMapEntrance();
    initBodyMap();
    initDrawer();
    initInspo();
    initPlanner();
    initAnatomy();
    initPiercer();
    initGlobalKeys();
    navigate('home');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
