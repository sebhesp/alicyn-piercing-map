/* ============================================================================
   ALICYN SUPABASE CLIENT
   Frontend-only foundation for GitHub Pages.
   Paste the public project URL and anon public key below. Never use service keys.

   Google OAuth checklist:
   1. Supabase Project Settings -> API:
      - Project URL goes in SUPABASE_URL.
      - anon public / publishable key goes in SUPABASE_ANON_KEY.
   2. Supabase Authentication -> URL Configuration:
      - Site URL: https://sebhesp.github.io/alicyn-piercing-map/
      - Redirect URL: https://sebhesp.github.io/alicyn-piercing-map/
   3. Supabase Authentication -> Providers -> Google:
      - Enable Google.
   4. Google Cloud OAuth redirect URI:
      - https://TU-PROYECTO.supabase.co/auth/v1/callback
   ============================================================================ */
(function () {
  'use strict';

  const SUPABASE_URL = "https://pejggyicajjfcvrtjraf.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_dk1HLbLQSGejoXTX0ZgrTQ_GtmHFpQ-";
  // Compute redirect at runtime so it works on every host:
  //   piercemap.com, www.piercemap.com, sebhesp.github.io/alicyn-piercing-map/, localhost
  // Each host MUST be added to Supabase -> Authentication -> URL Configuration -> Redirect URLs.
  function getGoogleRedirectTo() {
    return window.location.origin + window.location.pathname;
  }

  const FAVORITES_KEY = 'alicyn.inspoFavorites.v1';
  const DESIGN_PROJECTS_KEY = 'alicyn.designProjects.v1';
  const NOT_READY_MESSAGE = 'Disponible próximamente';

  const configured = Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL !== 'PEGAR_PROJECT_URL_AQUI' &&
    SUPABASE_ANON_KEY !== 'PEGAR_ANON_PUBLIC_KEY_AQUI' &&
    /^https?:\/\//.test(SUPABASE_URL)
  );

  const authState = window.alicynAuth || {
    user: null,
    session: null,
    isLoggedIn: false
  };

  const state = {
    configured,
    client: null,
    profile: null,
    ready: null
  };

  window.alicynAuth = authState;

  function emitAuthChange() {
    window.dispatchEvent(new CustomEvent('alicyn:supabase-auth', {
      detail: {
        configured: state.configured,
        session: authState.session,
        user: authState.user,
        profile: state.profile,
        isLoggedIn: authState.isLoggedIn
      }
    }));
  }

  function updateAuth(session) {
    authState.session = session || null;
    authState.user = session?.user || null;
    authState.isLoggedIn = Boolean(authState.user);
    if (!authState.user) state.profile = null;
    emitAuthChange();
  }

  function updateUser(user) {
    authState.user = user || null;
    if (!authState.user) authState.session = null;
    authState.isLoggedIn = Boolean(authState.user);
    if (!authState.user) state.profile = null;
    emitAuthChange();
  }

  function authUser() {
    return authState.user || authState.session?.user || null;
  }

  function displayName(user = authUser()) {
    if (!user) return '';
    return user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      'PierceMap user';
  }

  function initials(name) {
    return (name || '?')
      .split(/\s+/)
      .map(part => part[0] || '')
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function localUserFromSession() {
    const user = authUser();
    if (!user) return null;
    const name = displayName(user);
    return {
      userId: user.id,
      name,
      avatar: initials(name),
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      provider: user.app_metadata?.provider || 'supabase',
      authSource: 'supabase',
      email: user.email || '',
      xp: 0,
      experienceCount: 0,
      photoCount: 0,
      likesReceived: 0,
      earCount: 0,
      reports: 0,
      since: Date.now()
    };
  }

  function localList(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveLocalList(key, list, limit = 50) {
    try {
      localStorage.setItem(key, JSON.stringify(list.slice(0, limit)));
      return true;
    } catch (err) {
      return false;
    }
  }

  function saveFavoriteFallback(item, isFavorite) {
    if (!item?.id) return false;
    const list = localList(FAVORITES_KEY);
    const idx = list.findIndex(fav => fav.id === item.id);
    if (!isFavorite) {
      if (idx >= 0) list.splice(idx, 1);
      return saveLocalList(FAVORITES_KEY, list, 100);
    }
    if (idx >= 0) list.splice(idx, 1);
    list.unshift({
      id: item.id,
      image: item.image || '',
      tags: item.tags || [],
      zone: item.zone || '',
      savedAt: Date.now()
    });
    return saveLocalList(FAVORITES_KEY, list, 100);
  }

  function saveProjectFallback(projectData) {
    const list = localList(DESIGN_PROJECTS_KEY);
    list.unshift({
      ...projectData,
      localOnly: true,
      savedAt: Date.now()
    });
    return saveLocalList(DESIGN_PROJECTS_KEY, list, 25);
  }

  async function tryWrite(label, attempts) {
    if (!state.client || !authUser()) return { ok: false, skipped: true };
    let lastError = null;
    for (const attempt of attempts) {
      try {
        const { data, error } = await attempt();
        if (!error) return { ok: true, data };
        lastError = error;
      } catch (err) {
        lastError = err;
      }
    }
    console.warn('[Alicyn Supabase]', label, lastError);
    return { ok: false, error: lastError };
  }

  function loadSupabaseScript() {
    if (window.supabase?.createClient) return Promise.resolve(true);
    if (!state.configured) return Promise.resolve(false);
    const existing = document.querySelector('script[data-alicyn-supabase-cdn]');
    if (existing) {
      return new Promise(resolve => {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
      });
    }
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.defer = true;
      script.dataset.alicynSupabaseCdn = '1';
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn('[Alicyn Supabase] CDN could not be loaded');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  async function syncProfile() {
    const user = authUser();
    if (!state.client || !user) return null;
    const profile = {
      id: user.id,
      display_name: user.user_metadata?.full_name || user.email,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      role: 'client',
      updated_at: new Date().toISOString()
    };

    const result = await tryWrite('profiles upsert', [
      () => state.client.from('profiles').upsert(profile, { onConflict: 'id' })
    ]);
    state.profile = result.ok ? profile : null;
    emitAuthChange();
    return state.profile;
  }

  async function loginWithGoogle() {
    if (!state.configured) {
      console.error('[Alicyn Supabase] Not configured. Check SUPABASE_URL and SUPABASE_ANON_KEY.');
      return { ok: false, reason: 'not_configured' };
    }
    if (!state.client && state.ready) await state.ready;
    if (!state.client) {
      console.error('[Alicyn Supabase] Client not available (CDN failed?).');
      return { ok: false, reason: 'client_unavailable' };
    }
    const redirectTo = getGoogleRedirectTo();
    console.info('[Alicyn Supabase] signInWithOAuth(google) → redirectTo:', redirectTo);
    try {
      const { data, error } = await state.client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      });
      if (error) {
        console.error('[Alicyn Supabase] Google OAuth error', error);
        return { ok: false, error };
      }
      return { ok: true, data };
    } catch (err) {
      console.error('[Alicyn Supabase] Google OAuth threw', err);
      return { ok: false, error: err };
    }
  }

  async function loginWithFacebook() {
    console.warn(NOT_READY_MESSAGE);
    window.dispatchEvent(new CustomEvent('alicyn:auth-provider-unavailable', {
      detail: { provider: 'facebook', message: NOT_READY_MESSAGE }
    }));
    return { ok: false, reason: 'coming_soon' };
  }

  async function loginWithApple() {
    console.warn(NOT_READY_MESSAGE);
    window.dispatchEvent(new CustomEvent('alicyn:auth-provider-unavailable', {
      detail: { provider: 'apple', message: NOT_READY_MESSAGE }
    }));
    return { ok: false, reason: 'coming_soon' };
  }

  async function signIn(provider) {
    if (provider === 'google') {
      if (state.configured && !state.client && state.ready) await state.ready;
      return loginWithGoogle();
    }
    if (provider === 'facebook') return loginWithFacebook();
    if (provider === 'apple') return loginWithApple();
    return { ok: false, reason: 'unsupported_provider' };
  }

  async function signOut() {
    if (!state.client) {
      updateAuth(null);
      return { ok: true, localOnly: true };
    }
    const { error } = await state.client.auth.signOut();
    if (error) return { ok: false, error };
    updateAuth(null);
    return { ok: true };
  }

  async function ensureInspoItem(item) {
    if (!state.client || !item?.id) return;
    const now = new Date().toISOString();
    await tryWrite('inspo_items upsert', [
      () => state.client.from('inspo_items').upsert({
        id: item.id,
        title: item.name || item.id,
        image_url: item.image || null,
        zone: item.zone || null,
        tags: item.tags || [],
        source: 'alicyn-frontend',
        updated_at: now
      }, { onConflict: 'id' }),
      () => state.client.from('inspo_items').upsert({
        id: item.id,
        name: item.name || item.id,
        image: item.image || null,
        zone: item.zone || null,
        tags: item.tags || []
      }, { onConflict: 'id' })
    ]);
  }

  async function saveFavorite(item, isFavorite) {
    const user = authUser();
    if (!state.client || !user) {
      saveFavoriteFallback(item, isFavorite);
      return { ok: false, fallback: 'localStorage' };
    }
    if (!item?.id) return { ok: false, reason: 'missing_item_id' };
    if (!isFavorite) {
      await tryWrite('inspo_favorites delete', [
        () => state.client.from('inspo_favorites').delete().eq('user_id', user.id).eq('inspo_item_id', item.id),
        () => state.client.from('inspo_favorites').delete().eq('profile_id', user.id).eq('item_id', item.id)
      ]);
      return { ok: true };
    }
    await ensureInspoItem(item);
    const now = new Date().toISOString();
    return tryWrite('inspo_favorites upsert', [
      () => state.client.from('inspo_favorites').upsert({
        user_id: user.id,
        inspo_item_id: item.id,
        item_snapshot: item,
        created_at: now
      }, { onConflict: 'user_id,inspo_item_id' }),
      () => state.client.from('inspo_favorites').insert({
        profile_id: user.id,
        item_id: item.id,
        payload: item,
        created_at: now
      })
    ]);
  }

  async function saveDesignProject(projectData) {
    const user = authUser();
    if (!state.client || !user) {
      saveProjectFallback(projectData);
      return { ok: false, fallback: 'localStorage' };
    }
    const now = new Date().toISOString();
    return tryWrite('design_projects insert', [
      () => state.client.from('design_projects').insert({
        user_id: user.id,
        title: projectData.title || 'PierceMap design',
        status: projectData.status || 'draft',
        payload: projectData,
        created_at: now,
        updated_at: now
      }),
      () => state.client.from('design_projects').insert({
        profile_id: user.id,
        name: projectData.title || 'PierceMap design',
        status: projectData.status || 'draft',
        data: projectData,
        created_at: now
      })
    ]);
  }

  async function createCommunityExperience(experienceData) {
    const user = authUser();
    if (!state.client || !user) {
      window.dispatchEvent(new CustomEvent('alicyn:supabase-login-required', {
        detail: { area: 'community_experiences' }
      }));
      return { ok: false, reason: 'login_required' };
    }
    const now = new Date().toISOString();
    return tryWrite('community_experiences insert', [
      () => state.client.from('community_experiences').insert({
        user_id: user.id,
        piercing_id: experienceData.piercingId,
        pain: experienceData.pain,
        note: experienceData.text || '',
        has_photo: !!experienceData.hasPhoto,
        status: 'pending',
        payload: experienceData,
        created_at: now
      }),
      () => state.client.from('community_experiences').insert({
        profile_id: user.id,
        piercing_id: experienceData.piercingId,
        pain: experienceData.pain,
        text: experienceData.text || '',
        status: 'pending',
        data: experienceData,
        created_at: now
      })
    ]);
  }

  async function init() {
    if (!state.configured) {
      window.alicynSupabase = null;
      updateAuth(null);
      return state;
    }
    const sdkReady = await loadSupabaseScript();
    if (!sdkReady || !window.supabase?.createClient) {
      window.alicynSupabase = null;
      updateAuth(null);
      return state;
    }

    state.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    window.alicynSupabase = state.client;

    const { data, error } = await state.client.auth.getUser();
    if (!error) {
      updateUser(data.user || null);
      if (authUser()) await syncProfile();
    } else {
      console.warn('[Alicyn Supabase] User check failed', error);
      updateUser(null);
    }

    state.client.auth.onAuthStateChange((_event, session) => {
      updateAuth(session || null);
      if (authUser()) syncProfile();
    });

    return state;
  }

  state.ready = init();

  window.loginWithGoogle = loginWithGoogle;
  window.loginWithFacebook = loginWithFacebook;
  window.loginWithApple = loginWithApple;
  window.saveDesignProject = saveDesignProject;
  window.createCommunityExperience = createCommunityExperience;

  // ── INTAKES + CONSENTS · v0.8 MVP migration (Supabase + localStorage fallback) ──
  // Tables: intakes · consents (run supabase/intakes.sql in your Supabase SQL editor)
  const INTAKES_KEY  = 'alicyn.intakes.v1';
  const CONSENTS_KEY = 'alicyn.consents.v1';

  function appendLocal(key, item, limit) {
    if (limit == null) limit = 200;
    try {
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      list.unshift(item);
      localStorage.setItem(key, JSON.stringify(list.slice(0, limit)));
      return true;
    } catch (err) { return false; }
  }

  async function saveIntake(intake) {
    if (!intake || typeof intake !== 'object') return { ok: false, error: 'invalid_intake' };
    var id = intake.id || ('i_' + Date.now());
    var now = new Date().toISOString();
    var localRow = {
      id: id,
      mode: intake.mode || 'standard',
      studio: intake.studio || null,
      intent: intake.intent || null,
      zone: intake.zone || null,
      specific: intake.specific || null,
      refs: intake.refs || [],
      client_name: (intake.data && intake.data.name) || null,
      client_age: (intake.data && intake.data.age) ? Number(intake.data.age) : null,
      client_email: (intake.data && intake.data.email) || null,
      allergies: (intake.data && intake.data.allergies) || null,
      created_at: intake.created_at || now,
      synced: false
    };
    appendLocal(INTAKES_KEY, localRow);
    if (!state.configured || !state.client) return { ok: true, source: 'local', warning: 'supabase_not_ready' };
    var user = authUser();
    var remoteRow = {
      id: id,
      user_id: user ? user.id : null,
      studio_slug: localRow.studio,
      mode: localRow.mode,
      intent: localRow.intent,
      zone: localRow.zone,
      specific: localRow.specific,
      refs: localRow.refs,
      client_name: localRow.client_name,
      client_age: localRow.client_age,
      client_email: localRow.client_email,
      allergies: localRow.allergies,
      created_at: localRow.created_at
    };
    var result = await tryWrite('intakes insert', [
      function () { return state.client.from('intakes').insert(remoteRow); }
    ]);
    if (result.ok) {
      try {
        var list = JSON.parse(localStorage.getItem(INTAKES_KEY) || '[]');
        var i = list.findIndex(function (r) { return r.id === id; });
        if (i >= 0) { list[i].synced = true; localStorage.setItem(INTAKES_KEY, JSON.stringify(list)); }
      } catch (_) {}
      return { ok: true, source: 'both' };
    }
    return { ok: true, source: 'local', warning: 'supabase_write_failed', error: result.error };
  }

  async function saveConsent(consent) {
    if (!consent || typeof consent !== 'object') return { ok: false, error: 'invalid_consent' };
    var id = consent.id || ('c_' + Date.now());
    var now = new Date().toISOString();
    var localRow = {
      id: id,
      intake_id: consent.intake_id || null,
      studio: consent.studio || null,
      version: consent.version || 'v1.0',
      accepted_at: consent.accepted_at || now,
      signature_present: Boolean(consent.signature),
      signature_local: consent.signature || null,
      client_age: consent.client_age || null,
      synced: false
    };
    appendLocal(CONSENTS_KEY, localRow, 100);
    if (!state.configured || !state.client) return { ok: true, source: 'local', warning: 'supabase_not_ready' };
    var user = authUser();
    var remoteRow = {
      id: id,
      user_id: user ? user.id : null,
      intake_id: localRow.intake_id,
      studio_slug: localRow.studio,
      version: localRow.version,
      accepted_at: localRow.accepted_at,
      signature_present: localRow.signature_present,
      client_age: localRow.client_age
    };
    var result = await tryWrite('consents insert', [
      function () { return state.client.from('consents').insert(remoteRow); }
    ]);
    if (result.ok) {
      try {
        var list = JSON.parse(localStorage.getItem(CONSENTS_KEY) || '[]');
        var i = list.findIndex(function (r) { return r.id === id; });
        if (i >= 0) { list[i].synced = true; localStorage.setItem(CONSENTS_KEY, JSON.stringify(list)); }
      } catch (_) {}
      return { ok: true, source: 'both' };
    }
    return { ok: true, source: 'local', warning: 'supabase_write_failed', error: result.error };
  }

  async function listIntakes(opts) {
    opts = opts || {};
    var local = [];
    try { local = JSON.parse(localStorage.getItem(INTAKES_KEY) || '[]'); } catch (_) {}
    if (!state.client || !authUser()) return { ok: true, source: 'local', rows: local };
    try {
      var q = state.client.from('intakes').select('*').order('created_at', { ascending: false }).limit(opts.limit || 50);
      var resp = await q;
      if (resp.error) return { ok: true, source: 'local', rows: local, warning: resp.error.message };
      return { ok: true, source: 'remote', rows: resp.data || [] };
    } catch (err) { return { ok: true, source: 'local', rows: local, warning: String(err) }; }
  }

  // Auto-sync pending intakes on auth
  window.addEventListener('alicyn:supabase-auth', async function () {
    if (!authUser() || !state.client) return;
    try {
      var list = JSON.parse(localStorage.getItem(INTAKES_KEY) || '[]');
      var pending = list.filter(function (r) { return !r.synced; }).slice(0, 20);
      for (var k = 0; k < pending.length; k++) {
        var row = pending[k];
        var r = await tryWrite('intakes backfill', [
          (function (rr) { return function () { return state.client.from('intakes').insert({
            id: rr.id, user_id: authUser().id, studio_slug: rr.studio, mode: rr.mode,
            intent: rr.intent, zone: rr.zone, specific: rr.specific, refs: rr.refs,
            client_name: rr.client_name, client_age: rr.client_age,
            client_email: rr.client_email, allergies: rr.allergies, created_at: rr.created_at
          }); }; })(row)
        ]);
        if (r.ok) row.synced = true;
      }
      localStorage.setItem(INTAKES_KEY, JSON.stringify(list));
    } catch (_) {}
  });


  window.AlicynSupabase = {
    ready: state.ready,
    isConfigured: () => state.configured,
    isSignedIn: () => Boolean(authUser()),
    getClient: () => state.client,
    getSession: () => authState.session,
    getUser: authUser,
    getAuthState: () => authState,
    localUserFromSession,
    syncProfile,
    signIn,
    signOut,
    saveFavorite,
    saveFavoriteFallback,
    saveDesignProject,
    saveProjectFallback,
    createCommunityExperience,
    saveCommunityExperience: createCommunityExperience,
    // v0.8 MVP intake migration:
    saveIntake: saveIntake,
    saveConsent: saveConsent,
    listIntakes: listIntakes
  };
})();
