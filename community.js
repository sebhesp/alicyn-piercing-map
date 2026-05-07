/* ============================================================================
   PIERCEMAP — COMMUNITY MODULE (v2)
   Auth (mock OAuth UX), perfiles, gamificación, experiencias, ratings,
   ripples, transiciones premium y toasts.
   En producción este módulo se conecta a Supabase (Auth + DB + Storage).
   ============================================================================ */

(() => {
  'use strict';

  /* ---------------- CONSTANTES ---------------- */
  const STORAGE_KEYS = {
    user: 'alicyn.user',
    experiences: 'alicyn.experiences',
    likes: 'alicyn.likes',
    feedback: 'alicyn.feedback'
  };

  const LEVELS = [
    { lv: 1, name: 'Curioso',     min: 0,    color: '#7d8a86' },
    { lv: 2, name: 'Explorador',  min: 100,  color: '#7aa6e0' },
    { lv: 3, name: 'Veterano',    min: 300,  color: '#5fd4a8' },
    { lv: 4, name: 'Embajador',   min: 700,  color: '#e6c560' },
    { lv: 5, name: 'Atlas',       min: 1500, color: '#b48ae0' }
  ];

  const BADGES = [
    { id: 'first',    name: 'Primera experiencia', desc: 'Compartiste tu primera historia.', condition: u => u.experienceCount >= 1, icon: 'star' },
    { id: 'photo',    name: 'Documentalista',      desc: 'Subiste una foto de tu piercing.', condition: u => u.photoCount >= 1, icon: 'camera' },
    { id: 'helper',   name: 'Voz útil',            desc: 'Te marcaron útil 10 veces.',       condition: u => u.likesReceived >= 10, icon: 'heart' },
    { id: 'streak',   name: 'Constancia',          desc: 'Compartiste 5 experiencias.',      condition: u => u.experienceCount >= 5, icon: 'flame' },
    { id: 'pioneer',  name: 'Pionero',             desc: 'Te uniste en los primeros 1000.',  condition: u => u.userId < 1000, icon: 'flag' },
    { id: 'mentor',   name: 'Mentor',              desc: 'Llegaste al nivel Atlas.',         condition: u => (u.xp || 0) >= 1500, icon: 'shield' },
    { id: 'curator',  name: 'Curador',             desc: 'Reportaste contenido que se moderó.', condition: u => (u.reports || 0) >= 1, icon: 'eye' },
    { id: 'ear',      name: 'Atlas de oreja',      desc: 'Documentaste 5 piercings de oreja.', condition: u => (u.earCount || 0) >= 5, icon: 'ear' }
  ];

  /* ---------------- SEED EXPERIENCES (demo data) ----------------
     En producción esto viene de Supabase. Aquí lo seedeamos para que el feed
     se sienta vivo desde la primera carga.
  */
  const SEED_EXPERIENCES = [
    { id:'s1', userId:42,  userName:'Mariana R.',  userLevel:3, piercingId:'helix',       pain:6, daysAgo:2,  text:'Mi helix se sintió fuerte los primeros 3 días, pero la parte más dura fue dormir. Tip: almohada con hueco. A los dos meses ya casi ni lo sentía.', likes:34, hasPhoto:true, badge:'Veterano' },
    { id:'s2', userId:71,  userName:'Daniela G.',  userLevel:4, piercingId:'daith',       pain:7, daysAgo:5,  text:'Mi perforadora me explicó por qué mi anatomía sí daba para daith. Sin esa conversación me hubiera ido a otro lado. La cicatrización fue lenta pero estable.', likes:58, hasPhoto:true, badge:'Embajador' },
    { id:'s3', userId:128, userName:'Carlos M.',   userLevel:2, piercingId:'septum',      pain:5, daysAgo:7,  text:'Mucho menos dolor del que esperaba. Lloraron mis ojos pero más por reflejo que por dolor. Lo más raro: estornudar la primera semana.', likes:21, hasPhoto:false, badge:'Explorador' },
    { id:'s4', userId:200, userName:'Sofía L.',    userLevel:3, piercingId:'lobulo',      pain:2, daysAgo:10, text:'Lobe simple, casi nada. Lo único: cuiden de no dormir encima la primera semana. Yo lo hice y se inflamó dos días.', likes:14, hasPhoto:false, badge:'Veterano' },
    { id:'s5', userId:312, userName:'Fer T.',      userLevel:2, piercingId:'tragus',      pain:6, daysAgo:14, text:'El crunch al perforar fue lo más impresionante. Dolor manejable. Me costó adaptarme a los audífonos in-ear.', likes:42, hasPhoto:true, badge:'Explorador' },
    { id:'s6', userId:188, userName:'Andrea P.',   userLevel:4, piercingId:'industrial', pain:8, daysAgo:18, text:'Lo más doloroso que me he hecho. No me arrepiento, pero hay que estar lista. Me tomó casi un año para sentir que ya estaba bien.', likes:73, hasPhoto:true, badge:'Embajador' },
    { id:'s7', userId:99,  userName:'Luis V.',     userLevel:3, piercingId:'nostril',     pain:4, daysAgo:22, text:'Más rápido de lo que pensé. El primer mes parecía que no avanzaba, pero después se estabilizó. Un consejo: cuiden el maquillaje.', likes:18, hasPhoto:false, badge:'Veterano' },
    { id:'s8', userId:241, userName:'Isabella H.', userLevel:5, piercingId:'rook',        pain:7, daysAgo:30, text:'Mi rook es el piercing más complicado que tengo, pero también el favorito. Vale la pena la espera de cicatrización.', likes:91, hasPhoto:true, badge:'Atlas' }
  ];

  const LEADERBOARD_SEED = [
    { rank:1, name:'Isabella H.', level:'Atlas',     points:1820 },
    { rank:2, name:'Andrea P.',   level:'Embajador', points:980 },
    { rank:3, name:'Daniela G.',  level:'Embajador', points:860 },
    { rank:4, name:'Mariana R.',  level:'Veterano',  points:540 },
    { rank:5, name:'Sofía L.',    level:'Veterano',  points:420 }
  ];

  /* ---------------- BADGE ICONS (inline SVG) ---------------- */
  const ICON = {
    star:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    heart:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.35-7-11a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 6.65-7 11-7 11z"/></svg>',
    flame:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    flag:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    eye:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    ear:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8.5C6 5.46 8.46 3 11.5 3S17 5.46 17 8.5c0 1.94-1.06 3.65-2.65 4.55-.85.48-1.35 1.32-1.35 2.27V17c0 1.66-1.34 3-3 3-1.31 0-2.42-.84-2.83-2"/><path d="M11 8.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z"/></svg>'
  };

  /* ---------------- STATE ---------------- */
  let state = {
    user: loadUser(),
    experiences: loadExperiences(),
    likes: loadLikes(),
    feedback: loadFeedback(),
    filter: 'all',
    sort: 'recent'
  };

  function loadUser() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null'); } catch { return null; }
  }
  function saveUser() {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.user));
  }
  function loadExperiences() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.experiences) || 'null');
      if (stored && Array.isArray(stored) && stored.length) return stored;
    } catch {}
    // First load: seed
    const seeded = SEED_EXPERIENCES.map(e => ({ ...e, ts: Date.now() - e.daysAgo*86400000 }));
    localStorage.setItem(STORAGE_KEYS.experiences, JSON.stringify(seeded));
    return seeded;
  }
  function saveExperiences() {
    localStorage.setItem(STORAGE_KEYS.experiences, JSON.stringify(state.experiences));
  }
  function loadLikes() {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.likes) || '[]')); } catch { return new Set(); }
  }
  function saveLikes() {
    localStorage.setItem(STORAGE_KEYS.likes, JSON.stringify([...state.likes]));
  }
  function loadFeedback() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.feedback) || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch { return []; }
  }
  function saveFeedback() {
    localStorage.setItem(STORAGE_KEYS.feedback, JSON.stringify(state.feedback));
  }

  /* ---------------- HELPERS ---------------- */
  const $  = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

  function getLevelByXp(xp) {
    let current = LEVELS[0];
    for (const l of LEVELS) if (xp >= l.min) current = l;
    return current;
  }
  function nextLevel(xp) {
    for (const l of LEVELS) if (l.min > xp) return l;
    return null;
  }
  function initials(name) {
    return (name || '?').split(/\s+/).map(p => p[0] || '').slice(0,2).join('').toUpperCase();
  }
  function timeAgo(ts) {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `hace ${d} d`;
    return `hace ${Math.floor(d/7)} sem`;
  }
  function piercingName(id) {
    const p = (window.AlicynData?.PIERCINGS || []).find(x => x.id === id);
    return p ? p.nombre : id;
  }

  /* ---------------- TOAST + POINTS REWARD ---------------- */
  function toast(msg, type='') {
    const stack = $('#toast-stack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    const ico = type === 'success'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      : type === 'warn'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    el.innerHTML = ico + '<span>' + msg + '</span>';
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }
  function pointsReward(amount, label) {
    const el = document.createElement('div');
    el.className = 'points-toast';
    el.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      <div><div class="pts">+${amount} XP</div><div style="font-size:11px;opacity:.85">${label}</div></div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  /* ---------------- RIPPLE ---------------- */
  function bindRipples() {
    document.addEventListener('pointerdown', (e) => {
      const target = e.target.closest('.btn, .nav-tabs button, .piercing-row, .piercer-card, .ear-point-btn, .hit-zone, .state-chip');
      if (!target) return;
      if (target.disabled) return;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.2;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top  = (e.clientY - rect.top)  + 'px';
      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    }, { passive: true });
  }

  /* ---------------- AUTH (mock OAuth) ----------------
     En producción: supabase.auth.signInWithOAuth({ provider: 'google'|'facebook' })
     Aquí simulamos para que toda la UX se sienta real desde el cliente.
  */
  function openLogin() { $('#login-modal')?.classList.add('is-open'); }
  function closeLogin(){ $('#login-modal')?.classList.remove('is-open'); }

  function loginAs(provider) {
    if (provider === 'google' || provider === 'facebook') {
      toast('Login social próximamente: requiere backend seguro', 'warn');
      return;
    }
    const samples = {
      google:   { name: 'Tate Spin',    avatar: 'TS' },
      facebook: { name: 'Tate Spin',    avatar: 'TS' },
      guest:    { name: 'Invitado',     avatar: 'IN' }
    };
    const s = samples[provider] || samples.guest;
    state.user = {
      userId: Math.floor(Math.random() * 9999),
      name: s.name,
      avatar: s.avatar,
      provider,
      xp: state.user?.xp || 0,
      experienceCount: state.user?.experienceCount || 0,
      photoCount: state.user?.photoCount || 0,
      likesReceived: state.user?.likesReceived || 0,
      earCount: state.user?.earCount || 0,
      reports: state.user?.reports || 0,
      since: state.user?.since || Date.now()
    };
    saveUser();
    closeLogin();
    renderProfile();
    renderHeader();
    toast(`Bienvenido a PierceMap, ${s.name}`, 'success');
  }

  function logout() {
    state.user = null;
    saveUser();
    renderProfile();
    renderHeader();
    toast('Sesión cerrada');
  }

  /* ---------------- HEADER ---------------- */
  function renderHeader() {
    const u = state.user;
    const headerPoints = $('#header-points-value');
    const btnLogin = $('#btn-login');
    if (!btnLogin) return;
    if (u) {
      btnLogin.textContent = u.name.split(' ')[0];
      btnLogin.classList.remove('btn-primary');
      btnLogin.title = 'Toca para cerrar sesión';
      btnLogin.onclick = (e) => { e.stopPropagation(); if (confirm('¿Cerrar sesión?')) logout(); };
      if (headerPoints) headerPoints.textContent = u.xp || 0;
    } else {
      btnLogin.textContent = 'Iniciar sesión';
      btnLogin.classList.add('btn-primary');
      btnLogin.title = '';
      btnLogin.onclick = openLogin;
      if (headerPoints) headerPoints.textContent = '0';
    }
  }

  /* ---------------- PROFILE / GAMIFICATION ---------------- */
  function renderProfile() {
    const u = state.user;
    const avatar = $('#profile-avatar');
    const name   = $('#profile-name');
    const lvLab  = $('#profile-level');
    const xpFill = $('#xp-fill');
    const xpCur  = $('#xp-current');
    const xpNxt  = $('#xp-next');
    const grid   = $('#badge-grid');
    if (!avatar) return;

    if (!u) {
      avatar.textContent = '?';
      avatar.style.background = 'linear-gradient(135deg, #555, #333)';
      name.textContent = 'Invitado';
      lvLab.textContent = 'Inicia sesión para ganar puntos';
      xpFill.style.width = '0%';
      xpCur.textContent = '0 XP';
      xpNxt.textContent = '100 XP siguiente nivel';
      grid.innerHTML = BADGES.map(b => badgeHtml(b, false)).join('');
      return;
    }

    const xp = u.xp || 0;
    const cur = getLevelByXp(xp);
    const nxt = nextLevel(xp);
    const span = nxt ? (nxt.min - cur.min) : 100;
    const into = nxt ? (xp - cur.min) : span;
    const pct  = Math.min(100, Math.max(0, (into / span) * 100));

    avatar.textContent = u.avatar || initials(u.name);
    avatar.style.background = '';
    name.textContent = u.name;
    lvLab.textContent = `Nivel ${cur.lv} · ${cur.name}`;
    xpFill.style.width = pct + '%';
    xpCur.textContent = xp + ' XP';
    xpNxt.textContent = nxt ? `${nxt.min - xp} XP a ${nxt.name}` : '¡Nivel máximo!';

    grid.innerHTML = BADGES.map(b => badgeHtml(b, b.condition(u))).join('');
  }
  function badgeHtml(b, unlocked) {
    return `<div class="badge ${unlocked ? 'unlocked' : 'locked'}" title="${b.name}">
      ${ICON[b.icon] || ICON.star}
      <span class="badge-tip"><strong>${b.name}</strong> · ${b.desc}</span>
    </div>`;
  }

  function awardXp(amount, label) {
    if (!state.user) return false;
    state.user.xp = (state.user.xp || 0) + amount;
    saveUser();
    pointsReward(amount, label);
    renderProfile();
    renderHeader();
    return true;
  }

  /* ---------------- COMMUNITY STATS ---------------- */
  function renderStats() {
    const list = state.experiences || [];
    $('#stat-experiences') && ($('#stat-experiences').textContent = list.length.toLocaleString('es-MX'));
    const types = new Set(list.map(e => e.piercingId));
    $('#stat-piercings') && ($('#stat-piercings').textContent = types.size);
    const pains = list.filter(e => typeof e.pain === 'number');
    const avg = pains.length ? (pains.reduce((s,e)=>s+e.pain,0) / pains.length) : 0;
    $('#stat-pain') && ($('#stat-pain').textContent = avg.toFixed(1));
    const members = new Set(list.map(e => e.userId));
    $('#stat-members') && ($('#stat-members').textContent = members.size + (state.user ? '+' : ''));
  }

  /* ---------------- DATA LEARNING LOOP ---------------- */
  function experienceFeatureRows() {
    return (state.experiences || []).map(e => ({
      id: e.id,
      piercingId: e.piercingId,
      piercingName: piercingName(e.piercingId),
      pain: Number(e.pain || 0),
      likes: Number(e.likes || 0),
      hasPhoto: !!e.hasPhoto,
      textLength: (e.text || '').length,
      userLevel: Number(e.userLevel || 0),
      daysSincePost: Math.max(0, Math.round((Date.now() - (e.ts || Date.now())) / 86400000)),
      usefulScore: Number(e.likes || 0) + (e.hasPhoto ? 8 : 0) + Math.min(20, Math.round(((e.text || '').length) / 18))
    }));
  }

  function learningMetrics() {
    const rows = experienceFeatureRows();
    const feedback = state.feedback || [];
    const errors = feedback.filter(f => f.type === 'error');
    const painByPiercing = {};
    rows.forEach(r => {
      if (!painByPiercing[r.piercingId]) painByPiercing[r.piercingId] = { count: 0, painTotal: 0, usefulTotal: 0 };
      painByPiercing[r.piercingId].count += 1;
      painByPiercing[r.piercingId].painTotal += r.pain;
      painByPiercing[r.piercingId].usefulTotal += r.usefulScore;
    });
    Object.keys(painByPiercing).forEach(id => {
      const item = painByPiercing[id];
      item.avgPain = +(item.painTotal / item.count).toFixed(2);
      item.avgUsefulScore = +(item.usefulTotal / item.count).toFixed(2);
      delete item.painTotal;
      delete item.usefulTotal;
    });
    return {
      experienceCount: rows.length,
      feedbackCount: feedback.length,
      errorCount: errors.length,
      photoQueueCount: rows.filter(r => r.hasPhoto).length,
      painByPiercing
    };
  }

  function renderDataLab() {
    const metrics = learningMetrics();
    $('#data-feedback-count') && ($('#data-feedback-count').textContent = metrics.feedbackCount);
    $('#data-error-count') && ($('#data-error-count').textContent = metrics.errorCount);
  }

  function recordFeedback(type) {
    const label = type === 'error' ? 'Describe el error que viste' : 'Escribe el feedback o aprendizaje';
    const text = prompt(label);
    if (!text || !text.trim()) return;
    state.feedback.unshift({
      id: 'fb-' + Date.now().toString(36),
      type,
      text: text.trim(),
      view: document.querySelector('.view.is-active')?.id || 'unknown',
      userId: state.user?.userId || null,
      createdAt: new Date().toISOString(),
      status: 'new'
    });
    saveFeedback();
    renderDataLab();
    toast(type === 'error' ? 'Error guardado para revisión' : 'Feedback guardado para aprendizaje', 'success');
  }

  function learningDataset() {
    return {
      name: 'alicyn-learning-dataset',
      version: 1,
      generatedAt: new Date().toISOString(),
      privacy: 'local-first demo; remove personal identifiers before model training',
      metrics: learningMetrics(),
      tables: {
        experiences: state.experiences || [],
        feedback: state.feedback || [],
        featureRows: experienceFeatureRows()
      },
      nextModelTargets: [
        'pain_expectation_by_piercing',
        'anatomy_risk_triage',
        'inspo_moderation_priority',
        'aftercare_issue_detection',
        'community_usefulness_ranking'
      ]
    };
  }

  function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportDataset() {
    downloadJson(learningDataset(), 'alicyn-learning-dataset.json');
    toast('Dataset exportado con reseñas, feedback y features', 'success');
  }

  /* ---------------- LEADERBOARD ---------------- */
  function renderLeaderboard() {
    const root = $('#leaderboard');
    if (!root) return;
    root.innerHTML = LEADERBOARD_SEED.map(r => `
      <div class="leader-row">
        <div class="rank ${r.rank<=3?'top':''}">${r.rank}</div>
        <div class="avatar">${initials(r.name)}</div>
        <div class="info"><b>${r.name}</b><small>${r.level}</small></div>
        <div class="points">${r.points} XP</div>
      </div>`).join('');
  }

  /* ---------------- EXPERIENCE FEED ---------------- */
  function paintDots(pain) {
    let html = '';
    for (let i = 1; i <= 10; i++) {
      const cls = i <= pain ? (pain >= 8 ? 'on peak' : pain >= 6 ? 'on high' : 'on') : '';
      html += `<i class="${cls}"></i>`;
    }
    return html;
  }

  function expCardHtml(e) {
    const liked = state.likes.has(e.id);
    return `
      <article class="experience-card" data-id="${e.id}">
        <div class="exp-head">
          <div class="avatar">${initials(e.userName)}</div>
          <div class="meta">
            <b>${e.userName}</b>
            <small>${timeAgo(e.ts || (Date.now() - (e.daysAgo||0)*86400000))}</small>
          </div>
          ${e.badge ? `<span class="level-pill">${e.badge}</span>` : ''}
        </div>
        <div class="exp-tags">
          <span class="exp-tag">${piercingName(e.piercingId)}</span>
          <span class="exp-tag">Dolor ${e.pain}/10</span>
        </div>
        <div class="exp-pain">
          <span style="font-size:11px;color:var(--text-mute);text-transform:uppercase;letter-spacing:.1em">Dolor reportado</span>
          <div class="pain-dots">${paintDots(e.pain)}</div>
        </div>
        <div class="exp-body">${escapeHtml(e.text || '')}</div>
        ${e.hasPhoto ? `
          <div class="exp-photo exp-photo-curated">
            <div class="blur-veil">
              <div style="text-align:center">
                <div style="font-weight:600">Foto en curaduría</div>
                <div style="font-size:11px;color:var(--text-mute);margin-top:4px">Contenido sensible · moderado</div>
              </div>
            </div>
          </div>` : ''}
        <div class="exp-foot">
          <button class="exp-action ${liked?'is-on':''}" data-action="like" data-id="${e.id}">
            <svg viewBox="0 0 24 24" fill="${liked?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.35-7-11a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 6.65-7 11-7 11z"/></svg>
            Útil · ${e.likes || 0}
          </button>
          <button class="exp-action" data-action="comment" data-id="${e.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Comentar
          </button>
          <button class="exp-action" data-action="share" data-id="${e.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Compartir
          </button>
          <button class="exp-action" data-action="report" data-id="${e.id}" style="margin-left:auto" title="Reportar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/></svg>
          </button>
        </div>
      </article>`;
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function renderFeed() {
    const root = $('#experience-list');
    if (!root) return;
    let list = [...state.experiences];
    if (state.filter !== 'all') list = list.filter(e => e.piercingId === state.filter);
    if (state.sort === 'recent')   list.sort((a,b) => (b.ts||0) - (a.ts||0));
    if (state.sort === 'loved')    list.sort((a,b) => (b.likes||0) - (a.likes||0));
    if (state.sort === 'painful')  list.sort((a,b) => (b.pain||0) - (a.pain||0));
    if (state.sort === 'painless') list.sort((a,b) => (a.pain||0) - (b.pain||0));
    if (!list.length) {
      root.innerHTML = '<div class="experience-card" style="text-align:center"><p class="muted" style="margin:0">Aún no hay experiencias para este filtro. ¡Sé el primero en compartir!</p></div>';
      return;
    }
    root.innerHTML = list.map(expCardHtml).join('');
  }

  function handleFeedAction(action, id) {
    const exp = state.experiences.find(e => e.id === id);
    if (!exp) return;

    if (action === 'like') {
      if (state.likes.has(id)) {
        state.likes.delete(id);
        exp.likes = Math.max(0, (exp.likes || 0) - 1);
      } else {
        state.likes.add(id);
        exp.likes = (exp.likes || 0) + 1;
        if (state.user && exp.userId !== state.user.userId) {
          // would award XP to original author; here simulate +1 to ourselves for engagement
        }
      }
      saveLikes(); saveExperiences(); renderFeed(); renderStats();
    }
    if (action === 'comment') toast('Comentarios llegan en la siguiente versión', '');
    if (action === 'share') {
      const url = location.href.split('#')[0] + '#exp-' + id;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).then(() => toast('Enlace copiado al portapapeles', 'success'));
      } else {
        toast('Copia este enlace desde la barra del navegador', 'warn');
      }
    }
    if (action === 'report') {
      if (!confirm('¿Reportar esta publicación por contenido inapropiado?')) return;
      if (state.user) {
        state.user.reports = (state.user.reports || 0) + 1;
        saveUser();
        renderProfile();
      }
      toast('Reporte enviado. Gracias por cuidar la comunidad.', 'success');
    }
  }

  /* ---------------- ADD EXPERIENCE FLOW ---------------- */
  function openAddExp() {
    if (!state.user) { openLogin(); toast('Inicia sesión para compartir', 'warn'); return; }
    const m = $('#add-exp-modal'); if (!m) return;
    m.classList.add('is-open');
    $('#exp-piercing').value = '';
    $('#exp-pain').value = 5;
    $('#exp-pain-readout').querySelector('strong').textContent = '5';
    $('#exp-pain-readout').className = 'pain-readout';
    $('#exp-note').value = '';
    const drop = $('#exp-photo-drop');
    drop.dataset.fileName = '';
    drop.querySelector('p').textContent = 'Arrastra una foto o haz clic para subirla';
  }
  function closeAddExp() { $('#add-exp-modal')?.classList.remove('is-open'); }

  function publishExperience() {
    const piercingId = $('#exp-piercing').value;
    const pain = parseInt($('#exp-pain').value, 10);
    const text = $('#exp-note').value.trim();
    const hasPhoto = !!$('#exp-photo-drop').dataset.fileName;
    if (!piercingId) { toast('Selecciona un piercing', 'warn'); return; }

    const newExp = {
      id: 'u' + Date.now(),
      userId: state.user.userId,
      userName: state.user.name,
      userLevel: getLevelByXp(state.user.xp || 0).lv,
      piercingId, pain, text,
      hasPhoto, likes: 0, ts: Date.now(),
      badge: getLevelByXp(state.user.xp || 0).name
    };
    state.experiences.unshift(newExp);
    saveExperiences();

    // Update user counters
    state.user.experienceCount = (state.user.experienceCount || 0) + 1;
    if (hasPhoto) state.user.photoCount = (state.user.photoCount || 0) + 1;
    if (typeof pain === 'number') {
      // reportar dolor real ya está implícito
    }
    const isEar = ['lobulo','lobulo_alto','helix','flat','conch','tragus','daith','rook','industrial'].includes(piercingId);
    if (isEar) state.user.earCount = (state.user.earCount || 0) + 1;
    saveUser();

    // XP
    let total = 50; let label = 'Experiencia compartida';
    if (hasPhoto) total += 30;
    if (typeof pain === 'number') total += 15;
    awardXp(total, label);

    closeAddExp();
    renderFeed();
    renderStats();
    toast('Experiencia publicada · ¡Gracias por aportar!', 'success');
  }

  /* ---------------- VIEW TRANSITION (premium) ----------------
     Wraps existing app.js navigate calls so transitions feel deliberate.
  */
  function bindViewTransitions() {
    const observer = new MutationObserver((muts) => {
      muts.forEach(m => {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          const v = m.target;
          if (v.classList.contains('view') && v.classList.contains('is-active')) {
            // Re-trigger animation by toggling class
            v.style.animation = 'none';
            requestAnimationFrame(() => { v.style.animation = ''; });
            // If community view became active, refresh content
            if (v.id === 'view-community') {
              renderStats(); renderFeed(); renderProfile(); renderLeaderboard(); renderDataLab();
            }
          }
        }
      });
    });
    $$('.view').forEach(v => observer.observe(v, { attributes: true }));
  }

  /* ---------------- PHOTO DROP ---------------- */
  function bindPhotoDrop() {
    const drop  = $('#exp-photo-drop');
    const input = $('#exp-photo-input');
    if (!drop || !input) return;
    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handlePhoto(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', e => { if (e.target.files[0]) handlePhoto(e.target.files[0]); });
    function handlePhoto(file) {
      if (file.size > 5 * 1024 * 1024) { toast('Foto demasiado grande (máx 5 MB)', 'warn'); return; }
      drop.dataset.fileName = file.name;
      drop.querySelector('p').textContent = '✓ ' + file.name + ' (lista, se moderará antes de publicarse)';
    }
  }

  /* ---------------- PAIN SLIDER ---------------- */
  function bindPainSlider() {
    const input = $('#exp-pain');
    const readout = $('#exp-pain-readout');
    if (!input || !readout) return;
    input.addEventListener('input', () => {
      const v = parseInt(input.value, 10);
      readout.querySelector('strong').textContent = v;
      readout.className = 'pain-readout' + (v >= 8 ? ' peak' : v >= 6 ? ' high' : '');
    });
  }

  /* ---------------- WIRE BUTTONS ---------------- */
  function wire() {
    // Login modal
    $('#btn-login')?.addEventListener('click', openLogin);
    $$('#login-modal [data-oauth]').forEach(b => b.addEventListener('click', () => loginAs(b.dataset.oauth)));
    $('#login-modal')?.addEventListener('click', e => { if (e.target.id === 'login-modal') closeLogin(); });

    // Add experience modal
    $('#btn-add-experience')?.addEventListener('click', openAddExp);
    $('#btn-exp-cancel')?.addEventListener('click', closeAddExp);
    $('#btn-exp-publish')?.addEventListener('click', publishExperience);
    $('#add-exp-modal')?.addEventListener('click', e => { if (e.target.id === 'add-exp-modal') closeAddExp(); });

    // Feed actions (delegated)
    $('#experience-list')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      handleFeedAction(btn.dataset.action, btn.dataset.id);
    });

    // Filters
    $('#feed-filter')?.addEventListener('change', e => { state.filter = e.target.value; renderFeed(); });
    $('#feed-sort')?.addEventListener('change',   e => { state.sort   = e.target.value; renderFeed(); });

    // Learning loop
    $('#btn-feedback-idea')?.addEventListener('click', () => recordFeedback('idea'));
    $('#btn-feedback-error')?.addEventListener('click', () => recordFeedback('error'));
    $('#btn-export-dataset')?.addEventListener('click', exportDataset);

    // ESC to close modals
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeLogin(); closeAddExp(); }
    });
  }

  /* ---------------- INIT ---------------- */
  function init() {
    bindRipples();
    bindViewTransitions();
    bindPhotoDrop();
    bindPainSlider();
    wire();
    renderHeader();
    renderProfile();
    renderStats();
    renderLeaderboard();
    renderDataLab();
    renderFeed();

    // Welcome toast for first time visitors
    if (!localStorage.getItem('alicyn.visited')) {
      localStorage.setItem('alicyn.visited', '1');
      setTimeout(() => toast('Bienvenido a PierceMap · v2', 'success'), 600);
    }
  }

  // Expose for debugging
  window.AlicynCommunity = { state, awardXp, openLogin, openAddExp, toast, learningDataset, exportDataset };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
