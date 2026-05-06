/* ============================================================================
   ALICYN SUPABASE CLIENT
   Frontend-only foundation for GitHub Pages.
   Paste the public project URL and anon public key below. Never use service keys.
   ============================================================================ */
(function () {
  'use strict';

  const SUPABASE_URL = https://pejggyicajjfcvrtjraf.supabase.co/rest/v1/;
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlamdneWljYWpqZmN2cnRqcmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDUyMTUsImV4cCI6MjA5MzYyMTIxNX0.DHMhj3jYTt7YsfXx0EvPdCnrsTKRGqhiYREtiVrdstg;

  const FAVORITES_KEY = 'alicyn.inspoFavorites.v1';
  const DESIGN_PROJECTS_KEY = 'alicyn.designProjects.v1';
  const NOT_READY_MESSAGE = 'Disponible proximamente';

  const configured = Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL !== https://pejggyicajjfcvrtjraf.supabase.co/rest/v1/ &&
    SUPABASE_ANON_KEY !== eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlamdneWljYWpqZmN2cnRqcmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDUyMTUsImV4cCI6MjA5MzYyMTIxNX0.DHMhj3jYTt7YsfXx0EvPdCnrsTKRGqhiYREtiVrdstg &&
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

  function authUser() {
    return authState.user || authState.session?.user || null;
  }

  function displayName(user = authUser()) {
    if (!user) return '';
    return user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      'Alicyn user';
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
    if (!state.configured || !state.client) return { ok: false, reason: 'not_configured' };
    const redirectTo = window.location.origin + window.location.pathname;
    const { data, error } = await state.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (error) {
      console.warn('[Alicyn Supabase] Google OAuth error', error);
      return { ok: false, error };
    }
    return { ok: true, data };
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
    if (provider === 'google') return loginWithGoogle();
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
        title: projectData.title || 'Alicyn ear design',
        status: projectData.status || 'draft',
        payload: projectData,
        created_at: now,
        updated_at: now
      }),
      () => state.client.from('design_projects').insert({
        profile_id: user.id,
        name: projectData.title || 'Alicyn ear design',
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
    if (!state.configured || !window.supabase?.createClient) {
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

    const { data, error } = await state.client.auth.getSession();
    if (!error) {
      updateAuth(data.session || null);
      if (authUser()) await syncProfile();
    } else {
      console.warn('[Alicyn Supabase] Session check failed', error);
      updateAuth(null);
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
    saveCommunityExperience: createCommunityExperience
  };
})();
