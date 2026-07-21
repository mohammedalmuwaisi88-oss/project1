// ============================================================================
// EduFlix — Core Engine Architecture
// ============================================================================
// IMPORTANT: This file requires the Supabase JS client library to be loaded
// BEFORE this script in your HTML, e.g.:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="script.js"></script>
// ============================================================================
 
// Supabase Connection Configuration
const SUPABASE_URL = "https://raklpfmsglgytqvvrxft.supabase.co";
const SUPABASE_KEY = "sb_publishable_YGZLapsWUvCsgNSJkuV8iA_tMMVK_r5";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
 
// Admin identity — كل مقارنات الأدمن تمر من هنا فقط (حتى لا تتكرر الأخطاء)
const ADMIN_EMAIL = 'admin@test.com';
function isAdminUser(user) {
  return !!(user && user.email && user.email.trim().toLowerCase() === ADMIN_EMAIL);
}
 
document.addEventListener('DOMContentLoaded', () => {
 
// Core Application State
let state = {
  currentUser: null,
  lessons: [],
  currentLessonIndex: 0,
  viewMode: 'player', // 'player' | 'admin'
  users: [],
  userSearchTerm: ''
};
 
// DOM Selectors
const elements = {
  toast: document.getElementById('toast'),
  authContainer: document.getElementById('auth-container'),
  appContainer: document.getElementById('app-container'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  toRegister: document.getElementById('to-register'),
  toLogin: document.getElementById('to-login'),
  authSubtitle: document.getElementById('auth-subtitle'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  registerName: document.getElementById('register-name'),
  registerEmail: document.getElementById('register-email'),
  registerPassword: document.getElementById('register-password'),
 
  userDisplayName: document.getElementById('user-display-name'),
  adminBadge: document.getElementById('admin-badge'),
  premiumBadge: document.getElementById('premium-badge'),
  btnSubscribe: document.getElementById('btn-subscribe'),
  btnToggleAdmin: document.getElementById('btn-toggle-admin'),
  btnFounder: document.getElementById('btn-founder'),
  viewFounder: document.getElementById('view-founder'),
  btnToggleCourse: document.getElementById('btn-toggle-course'),
  btnLogout: document.getElementById('btn-logout'),
  logoClick: document.getElementById('logo-click'),
 
  lessonListContainer: document.getElementById('lesson-list-container'),
  courseProgressText: document.getElementById('course-progress-text'),
 
  viewPlayer: document.getElementById('view-player'),
  viewAdmin: document.getElementById('view-admin'),
 
  playerLock: document.getElementById('player-lock'),
  videoContainer: document.getElementById('video-container'),
  videoPlayer: document.getElementById('video-player'),
  btnLockSubscribe: document.getElementById('btn-lock-subscribe'),
 
  btnPrevLesson: document.getElementById('btn-prev-lesson'),
  btnNextLesson: document.getElementById('btn-next-lesson'),
  currentLessonTitle: document.getElementById('current-lesson-title'),
  currentLessonDesc: document.getElementById('current-lesson-desc'),
 
  adminLessonForm: document.getElementById('admin-lesson-form'),
  adminLessonId: document.getElementById('admin-lesson-id'),
  adminTitle: document.getElementById('admin-title'),
  adminVideoUrl: document.getElementById('admin-video-url'),
  adminDuration: document.getElementById('admin-duration'),
  adminDesc: document.getElementById('admin-desc'),
  btnAdminCancel: document.getElementById('btn-admin-cancel'),
  btnAdminSubmit: document.getElementById('btn-admin-submit'),
  adminLessonsTbody: document.getElementById('admin-lessons-tbody'),
 
  // Admin Tabs
  tabBtnLessons: document.getElementById('tab-btn-lessons'),
  tabBtnUsers: document.getElementById('tab-btn-users'),
  adminTabLessons: document.getElementById('admin-tab-lessons'),
  adminTabUsers: document.getElementById('admin-tab-users'),
 
  // User Management
  userSearch: document.getElementById('user-search'),
  adminUsersTbody: document.getElementById('admin-users-tbody'),
  btnOpenAddUser: document.getElementById('btn-open-add-user'),
 
  addUserModal: document.getElementById('add-user-modal'),
  addUserForm: document.getElementById('add-user-form'),
  addUserName: document.getElementById('add-user-name'),
  addUserEmail: document.getElementById('add-user-email'),
  addUserPassword: document.getElementById('add-user-password'),
  addUserSubscribed: document.getElementById('add-user-subscribed'),
  btnAddUserSubmit: document.getElementById('btn-add-user-submit'),
  btnAddUserCancel: document.getElementById('btn-add-user-cancel'),
 
  editUserModal: document.getElementById('edit-user-modal'),
  editUserForm: document.getElementById('edit-user-form'),
  editUserId: document.getElementById('edit-user-id'),
  editUserName: document.getElementById('edit-user-name'),
  editUserEmail: document.getElementById('edit-user-email'),
  editUserSubscribed: document.getElementById('edit-user-subscribed'),
  editUserActive: document.getElementById('edit-user-active'),
  btnEditUserCancel: document.getElementById('btn-edit-user-cancel')
};
 
// System Orchestration & Launch
async function init() {
  await loadLessons();
  setupEventListeners();
  checkSession();
}
 
// -----------------------------------------------------------------------
// Lessons — الآن تُقرأ وتُكتب مباشرة من/إلى Supabase
// -----------------------------------------------------------------------
 
async function loadLessons() {
  const { data, error } = await supabaseClient
    .from('lessons')
    .select('*')
    .order('sort_order', { ascending: true });
 
  if (error) {
    console.error('Error loading lessons from Supabase:', error);
    state.lessons = [];
    return;
  }
 
  state.lessons = (data || []).map(row => ({
    id: row.id,
    title: row.title,
    url: row.video_id,
    duration: row.duration,
    desc: row.description
  }));
}
 
async function refreshLessons() {
  await loadLessons();
  renderLessonSidebar();
  renderAdminLessonsTable();
}
 
// -----------------------------------------------------------------------
// Supabase Auth Helpers
// -----------------------------------------------------------------------
 
async function fetchUserProfile(userId) {
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
 
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
 
  return data;
}
 
async function checkSession() {
  const { data, error } = await supabaseClient.auth.getSession();
 
  if (error) {
    console.error('Error retrieving session:', error);
    showAuthScreen();
    return;
  }
 
  const session = data.session;
 
  if (session && session.user) {
    const profile = await fetchUserProfile(session.user.id);
    if (profile) {
      if (profile.is_active === false && !isAdminUser(profile)) {
        await supabaseClient.auth.signOut();
        showToast('This account has been disabled. Contact the administrator.', 'error');
        showAuthScreen();
        return;
      }
      state.currentUser = profile;
      launchApp();
      return;
    }
  }
 
  showAuthScreen();
}
 
// Screen View Controllers
function showAuthScreen() {
  elements.authContainer.classList.remove('hidden');
  elements.appContainer.classList.add('hidden');
}
 
function launchApp() {
  elements.authContainer.classList.add('hidden');
  elements.appContainer.classList.remove('hidden');
 
  elements.userDisplayName.textContent = state.currentUser.name;
 
  // Setup specialized access paths
  if (isAdminUser(state.currentUser)) {
    elements.adminBadge.classList.remove('hidden');
    elements.btnToggleAdmin.classList.remove('hidden');
    elements.premiumBadge.classList.add('hidden');
    elements.btnSubscribe.classList.add('hidden');
    loadUsers().then(() => renderUsersTable());
  } else {
    elements.adminBadge.classList.add('hidden');
    elements.btnToggleAdmin.classList.add('hidden');
    elements.btnToggleCourse.classList.add('hidden');
 
    if (state.currentUser.subscribed) {
      elements.premiumBadge.classList.remove('hidden');
      elements.btnSubscribe.classList.add('hidden');
    } else {
      elements.premiumBadge.classList.add('hidden');
      elements.btnSubscribe.classList.remove('hidden');
    }
  }
 
  renderLessonSidebar();
  renderAdminLessonsTable();
  setView('player');
 
  // Boot first lesson if available
  if (state.lessons.length > 0) {
    selectLesson(0);
  } else {
    clearPlayerDisplay();
  }
}
 
function setView(mode) {
  state.viewMode = mode;
 
  // إخفاء كل الصفحات أول شي
  elements.viewPlayer.classList.add('hidden');
  elements.viewAdmin.classList.add('hidden');
  elements.viewFounder.classList.add('hidden');
  elements.btnToggleAdmin.classList.add('hidden');
  elements.btnToggleCourse.classList.add('hidden');
 
  if (mode === 'admin') {
    elements.viewAdmin.classList.remove('hidden');
    elements.btnToggleCourse.classList.remove('hidden');
  } else if (mode === 'founder') {
    elements.viewFounder.classList.remove('hidden');
    elements.btnToggleCourse.classList.remove('hidden');
  } else {
    elements.viewPlayer.classList.remove('hidden');
    if (isAdminUser(state.currentUser)) {
      elements.btnToggleAdmin.classList.remove('hidden');
    }
  }
}
 
// Dynamic UI Rendering Architecture
function renderLessonSidebar() {
  elements.lessonListContainer.innerHTML = '';
 
  if (state.lessons.length === 0) {
    elements.lessonListContainer.innerHTML = '<p class="form-help" style="padding:16px;">No lessons inside database.</p>';
    elements.courseProgressText.textContent = '0/0 Lessons Complete';
    return;
  }
 
  const isSubscribed = state.currentUser && (state.currentUser.subscribed || isAdminUser(state.currentUser));
 
  state.lessons.forEach((lesson, index) => {
    const item = document.createElement('div');
    item.className = `lesson-item ${index === state.currentLessonIndex ? 'active' : ''}`;
 
    // First item always unlocked, rest depends on access tier status
    const isLocked = index > 0 && !isSubscribed;
 
    item.innerHTML = `
      <div class="lesson-item-left">
        <span class="lesson-title">${lesson.title}</span>
        <span class="lesson-duration">${lesson.duration || ''}</span>
      </div>
      ${isLocked ? `
      <div class="lock-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </div>
      ` : ''}
    `;
 
    item.addEventListener('click', () => {
      selectLesson(index);
    });
 
    elements.lessonListContainer.appendChild(item);
  });
 
  elements.courseProgressText.textContent = `${isSubscribed ? state.lessons.length : 1} / ${state.lessons.length} Accessible Lessons`;
}
 
function renderAdminLessonsTable() {
  elements.adminLessonsTbody.innerHTML = '';
 
  if (state.lessons.length === 0) {
    elements.adminLessonsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;" class="form-help">Syllabus is completely empty.</td></tr>';
    return;
  }
 
  state.lessons.forEach((lesson, index) => {
    const tr = document.createElement('tr');
 
    tr.innerHTML = `
      <td style="font-weight:600; color:var(--color-accent);"># ${(index + 1).toString().padStart(2, '0')}</td>
      <td><div style="font-weight:500; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${lesson.title}</div></td>
      <td>${lesson.duration || ''}</td>
      <td>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-edit-lesson" data-id="${lesson.id}" style="padding:6px 10px; font-size:12px;">Edit</button>
          <button class="btn btn-danger btn-delete-lesson" data-id="${lesson.id}" style="padding:6px 10px; font-size:12px;">Delete</button>
        </div>
      </td>
    `;
 
    tr.querySelector('.btn-edit-lesson').addEventListener('click', () => startEditLesson(lesson));
    tr.querySelector('.btn-delete-lesson').addEventListener('click', () => deleteLesson(lesson.id));
 
    elements.adminLessonsTbody.appendChild(tr);
  });
}
 
// -----------------------------------------------------------------------
// User Management (Admin Only)
// -----------------------------------------------------------------------
 
async function loadUsers() {
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .order('name', { ascending: true });
 
  if (error) {
    console.error('Error loading users from Supabase:', error);
    state.users = [];
    return;
  }
 
  state.users = data || [];
}
 
function renderUsersTable() {
  if (!elements.adminUsersTbody) return;
 
  elements.adminUsersTbody.innerHTML = '';
 
  const term = state.userSearchTerm.trim().toLowerCase();
  const filtered = state.users.filter(u => {
    if (!term) return true;
    return (u.name && u.name.toLowerCase().includes(term)) ||
           (u.email && u.email.toLowerCase().includes(term));
  });
 
  if (filtered.length === 0) {
    elements.adminUsersTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;" class="form-help">No users found.</td></tr>';
    return;
  }
 
  filtered.forEach(user => {
    const tr = document.createElement('tr');
    const isActive = user.is_active !== false; // treat missing column as active
    const isAdmin = isAdminUser(user);
 
    tr.innerHTML = `
      <td><div style="font-weight:500;">${user.name || ''}</div></td>
      <td>${user.email || ''}</td>
      <td><span class="badge ${user.subscribed || isAdmin ? 'badge-premium' : 'badge-free'}">${isAdmin ? 'Admin' : (user.subscribed ? 'Premium' : 'Free')}</span></td>
      <td><span class="badge ${isActive ? 'badge-active' : 'badge-disabled'}">${isActive ? 'Active' : 'Disabled'}</span></td>
      <td>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-edit-user" data-id="${user.id}" style="padding:6px 10px; font-size:12px;">Edit</button>
          <button class="btn ${isActive ? 'btn-outline' : 'btn-accent'} btn-toggle-user" data-id="${user.id}" style="padding:6px 10px; font-size:12px;">${isActive ? 'Disable' : 'Enable'}</button>
          <button class="btn btn-danger btn-delete-user" data-id="${user.id}" style="padding:6px 10px; font-size:12px;">Delete</button>
        </div>
      </td>
    `;
 
    tr.querySelector('.btn-edit-user').addEventListener('click', () => openEditUserModal(user));
    tr.querySelector('.btn-toggle-user').addEventListener('click', () => toggleUserActive(user));
    tr.querySelector('.btn-delete-user').addEventListener('click', () => deleteUserAccount(user));
 
    elements.adminUsersTbody.appendChild(tr);
  });
}
 
function openAddUserModal() {
  elements.addUserForm.reset();
  elements.addUserModal.classList.remove('hidden');
}
 
function closeAddUserModal() {
  elements.addUserModal.classList.add('hidden');
}
 
function openEditUserModal(user) {
  elements.editUserId.value = user.id;
  elements.editUserName.value = user.name || '';
  elements.editUserEmail.value = user.email || '';
  elements.editUserSubscribed.checked = !!user.subscribed;
  elements.editUserActive.checked = user.is_active !== false;
  elements.editUserModal.classList.remove('hidden');
}
 
function closeEditUserModal() {
  elements.editUserModal.classList.add('hidden');
}
 
// Creates a brand new user account without disturbing the currently
// signed-in admin session. We use a separate, non-persistent Supabase
// client so the admin's own session in localStorage is never overwritten.
async function adminCreateUser({ name, email, password, subscribed }) {
  const tempClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
 
  const { data, error } = await tempClient.auth.signUp({ email, password });
 
  if (error) {
    return { error };
  }
 
  if (data.user) {
    const { error: insertError } = await tempClient
      .from('users')
      .insert([{
        id: data.user.id,
        name: name,
        email: email,
        subscribed: !!subscribed,
        is_active: true
      }]);
 
    if (insertError) {
      return { error: insertError };
    }
  }
 
  return { data };
}
 
async function toggleUserActive(user) {
  if (isAdminUser(user)) {
    showToast('Cannot disable the primary admin account.', 'error');
    return;
  }
 
  const nextActive = !(user.is_active !== false);
 
  const { error } = await supabaseClient
    .from('users')
    .update({ is_active: nextActive })
    .eq('id', user.id);
 
  if (error) {
    console.error('Error updating user status:', error);
    showToast('Failed to update user status.', 'error');
    return;
  }
 
  showToast(`User ${nextActive ? 'enabled' : 'disabled'} successfully.`, 'success');
  await loadUsers();
  renderUsersTable();
}
 
async function deleteUserAccount(user) {
  if (isAdminUser(user)) {
    showToast('Cannot delete the primary admin account.', 'error');
    return;
  }
 
  if (state.currentUser && user.id === state.currentUser.id) {
    showToast('You cannot delete your own account.', 'error');
    return;
  }
 
  if (!confirm(`Are you sure you want to delete ${user.name || user.email}? This removes their profile and access permanently.`)) return;
 
  const { error } = await supabaseClient
    .from('users')
    .delete()
    .eq('id', user.id);
 
  if (error) {
    console.error('Error deleting user:', error);
    showToast('Failed to delete user. Check admin permissions.', 'error');
    return;
  }
 
  showToast('User profile deleted successfully.', 'success');
  await loadUsers();
  renderUsersTable();
}
 
// Media Logic Controllers
function selectLesson(index) {
  if (index < 0 || index >= state.lessons.length) return;
 
  state.currentLessonIndex = index;
 
  // Visual refresh
  const activeItem = elements.lessonListContainer.querySelector('.lesson-item.active');
  if (activeItem) activeItem.classList.remove('active');
 
  const items = elements.lessonListContainer.querySelectorAll('.lesson-item');
  if (items[index]) items[index].classList.add('active');
 
  const lesson = state.lessons[index];
  elements.currentLessonTitle.textContent = lesson.title;
  elements.currentLessonDesc.textContent = lesson.desc || 'No description available.';
 
  // Subscription restriction gates
  const isSubscribed = state.currentUser && (state.currentUser.subscribed || isAdminUser(state.currentUser));
  const requiresLock = index > 0 && !isSubscribed;
 
  if (requiresLock) {
    elements.playerLock.classList.remove('hidden');
    elements.videoContainer.classList.add('hidden');
    elements.videoPlayer.src = "";
  } else {
    elements.playerLock.classList.add('hidden');
    elements.videoContainer.classList.remove('hidden');
    elements.videoPlayer.src = `https://www.youtube.com/embed/${lesson.url}?autoplay=0&rel=0`;
  }
 
  // Toggle directional states
  elements.btnPrevLesson.disabled = index === 0;
  elements.btnNextLesson.disabled = index === state.lessons.length - 1;
}
 
function clearPlayerDisplay() {
  elements.currentLessonTitle.textContent = "No Lessons Available";
  elements.currentLessonDesc.textContent = "Please sign in to admin dashboard panel to assemble syllabus courses.";
  elements.videoPlayer.src = "";
  elements.btnPrevLesson.disabled = true;
  elements.btnNextLesson.disabled = true;
}
 
// Parsing Helper
function parseYoutubeId(urlStr) {
  if (urlStr.length === 11 && !urlStr.includes('/') && !urlStr.includes('.')) return urlStr;
  try {
    const url = new URL(urlStr);
    if (url.hostname === 'youtu.be') {
      return url.pathname.substring(1);
    }
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/embed/')[1];
      }
      return url.searchParams.get('v');
    }
  } catch (e) {
    // Error parsing fallback
  }
  return urlStr;
}
 
// Interactive Action Bindings
function setupEventListeners() {
  // Auth Toggle Paths
  elements.toRegister.addEventListener('click', (e) => {
    e.preventDefault();
    elements.loginForm.classList.add('hidden');
    elements.registerForm.classList.remove('hidden');
    if (elements.authSubtitle) {
      elements.authSubtitle.textContent = 'Create a global study account';
    }
  });
 
  elements.toLogin.addEventListener('click', (e) => {
    e.preventDefault();
    elements.registerForm.classList.add('hidden');
    elements.loginForm.classList.remove('hidden');
    if (elements.authSubtitle) {
      elements.authSubtitle.textContent = 'Sign in to start learning';
    }
  });
 
  // Authentication Submission Handling (Supabase)
  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
 
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });
 
    if (error || !data || !data.user) {
      console.error('Supabase signIn error:', error ? error.message : 'no user returned', error);
      showToast('Invalid access verification configuration or bad key values.', 'error');
      return;
    }
 
    const profile = await fetchUserProfile(data.user.id);
 
    if (!profile) {
      showToast('Unable to load user profile record.', 'error');
      return;
    }
 
    if (profile.is_active === false && !isAdminUser(profile)) {
      await supabaseClient.auth.signOut();
      showToast('This account has been disabled. Contact the administrator.', 'error');
      return;
    }
 
    state.currentUser = profile;
 
    if (isAdminUser(profile)) {
      showToast('Welcome Back Director.', 'success');
    } else {
      showToast(`Access authorization clear. Welcome back ${profile.name}.`, 'success');
    }
 
    launchApp();
    elements.loginForm.reset();
  });
 
  elements.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = elements.registerName.value.trim();
    const email = elements.registerEmail.value.trim().toLowerCase();
    const password = elements.registerPassword.value;
 
    if (password.length < 6) {
      showToast('Password validation failed: Must exceed 5 elements.', 'error');
      return;
    }
 
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });
 
    if (error) {
      console.error('Supabase signUp error:', error.message, error);
      showToast(`Registration failed: ${error.message}`, 'error');
      return;
    }
 
    if (data.user) {
      const { error: insertError } = await supabaseClient
        .from('users')
        .insert([{
          id: data.user.id,
          name: name,
          email: email,
          subscribed: false
        }]);
 
      if (insertError) {
        console.error('Error creating user profile row:', insertError);
        showToast('Account created, but profile record setup failed.', 'error');
        return;
      }
    }
 
    showToast('Account profile deployment completed successfully.', 'success');
    elements.registerForm.reset();
    elements.toLogin.click();
  });
 
  // Access Plan Configuration Switch
  const handleSubscribeAction = async () => {
    if (!state.currentUser) return;
 
    const { error } = await supabaseClient
      .from('users')
      .update({ subscribed: true })
      .eq('id', state.currentUser.id);
 
    if (error) {
      console.error('Error updating subscription status:', error);
      showToast('Failed to update subscription status.', 'error');
      return;
    }
 
    state.currentUser.subscribed = true;
    elements.btnSubscribe.classList.add('hidden');
    elements.premiumBadge.classList.remove('hidden');
 
    showToast('Premium license verified. Core paths fully accessible.', 'success');
    renderLessonSidebar();
    selectLesson(state.currentLessonIndex);
  };
 
  elements.btnSubscribe.addEventListener('click', handleSubscribeAction);
  elements.btnLockSubscribe.addEventListener('click', handleSubscribeAction);
 
  // Core Layout Nav Actions
  elements.btnLogout.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
 
    if (error) {
      console.error('Error signing out:', error);
    }
 
    state.currentUser = null;
    showToast('Global execution environment session disconnected.', 'success');
    showAuthScreen();
  });
 
  elements.btnToggleAdmin.addEventListener('click', () => setView('admin'));
  elements.btnFounder.addEventListener('click', () => setView('founder'));
  elements.btnToggleCourse.addEventListener('click', () => setView('player'));
  elements.logoClick.addEventListener('click', () => setView('player'));
 
  // Core Linear Sequence Step Triggers
  elements.btnPrevLesson.addEventListener('click', () => {
    if (state.currentLessonIndex > 0) {
      selectLesson(state.currentLessonIndex - 1);
    }
  });
 
  elements.btnNextLesson.addEventListener('click', () => {
    if (state.currentLessonIndex < state.lessons.length - 1) {
      selectLesson(state.currentLessonIndex + 1);
    }
  });
 
  // Syllabus Content Mutations (Admin Pane) — الآن تكتب مباشرة في Supabase
  elements.adminLessonForm.addEventListener('submit', async (e) => {
    e.preventDefault();
 
    const id = elements.adminLessonId.value;
    const title = elements.adminTitle.value.trim();
    const rawUrl = elements.adminVideoUrl.value.trim();
    const duration = elements.adminDuration.value.trim();
    const desc = elements.adminDesc.value.trim();
 
    const parsedVideoId = parseYoutubeId(rawUrl);
    if (!parsedVideoId) {
      showToast('Could not validate dynamic YouTube target key structures.', 'error');
      return;
    }
 
    elements.btnAdminSubmit.disabled = true;
 
    if (id) {
      // تحديث درس موجود
      const { error } = await supabaseClient
        .from('lessons')
        .update({
          title: title,
          video_id: parsedVideoId,
          duration: duration,
          description: desc
        })
        .eq('id', id);
 
      elements.btnAdminSubmit.disabled = false;
 
      if (error) {
        console.error('Error updating lesson:', error);
        showToast('Failed to update lesson. Check admin permissions.', 'error');
        return;
      }
 
      showToast('Lesson variables successfully saved.', 'success');
    } else {
      // إضافة درس جديد
      const nextOrder = state.lessons.length;
 
      const { error } = await supabaseClient
        .from('lessons')
        .insert([{
          title: title,
          video_id: parsedVideoId,
          duration: duration,
          description: desc,
          sort_order: nextOrder
        }]);
 
      elements.btnAdminSubmit.disabled = false;
 
      if (error) {
        console.error('Error creating lesson:', error);
        showToast('Failed to add lesson. Check admin permissions.', 'error');
        return;
      }
 
      showToast('New lesson integrated successfully into course track layout.', 'success');
    }
 
    await refreshLessons();
    resetAdminForm();
 
    if (state.lessons.length === 1) {
      selectLesson(0);
    } else {
      selectLesson(state.currentLessonIndex);
    }
  });
 
  elements.btnAdminCancel.addEventListener('click', resetAdminForm);
 
  // Admin Tabs Switching
  elements.tabBtnLessons.addEventListener('click', () => {
    elements.tabBtnLessons.classList.add('active');
    elements.tabBtnUsers.classList.remove('active');
    elements.adminTabLessons.classList.remove('hidden');
    elements.adminTabUsers.classList.add('hidden');
  });
 
  elements.tabBtnUsers.addEventListener('click', async () => {
    elements.tabBtnUsers.classList.add('active');
    elements.tabBtnLessons.classList.remove('active');
    elements.adminTabUsers.classList.remove('hidden');
    elements.adminTabLessons.classList.add('hidden');
    await loadUsers();
    renderUsersTable();
  });
 
  // User Search Filter
  elements.userSearch.addEventListener('input', (e) => {
    state.userSearchTerm = e.target.value;
    renderUsersTable();
  });
 
  // Add User Modal Controls
  elements.btnOpenAddUser.addEventListener('click', openAddUserModal);
  elements.btnAddUserCancel.addEventListener('click', closeAddUserModal);
  elements.addUserModal.addEventListener('click', (e) => {
    if (e.target === elements.addUserModal) closeAddUserModal();
  });
 
  elements.addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
 
    const name = elements.addUserName.value.trim();
    const email = elements.addUserEmail.value.trim().toLowerCase();
    const password = elements.addUserPassword.value;
    const subscribed = elements.addUserSubscribed.checked;
 
    if (password.length < 6) {
      showToast('Password validation failed: Must exceed 5 elements.', 'error');
      return;
    }
 
    elements.btnAddUserSubmit.disabled = true;
    const { error } = await adminCreateUser({ name, email, password, subscribed });
    elements.btnAddUserSubmit.disabled = false;
 
    if (error) {
      console.error('Error creating user:', error);
      showToast(`Failed to create user: ${error.message}`, 'error');
      return;
    }
 
    showToast('User account created successfully.', 'success');
    closeAddUserModal();
    await loadUsers();
    renderUsersTable();
  });
 
  // Edit User Modal Controls
  elements.btnEditUserCancel.addEventListener('click', closeEditUserModal);
  elements.editUserModal.addEventListener('click', (e) => {
    if (e.target === elements.editUserModal) closeEditUserModal();
  });
 
  elements.editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
 
    const id = elements.editUserId.value;
    const name = elements.editUserName.value.trim();
    const subscribed = elements.editUserSubscribed.checked;
    const isActive = elements.editUserActive.checked;
 
    const { error } = await supabaseClient
      .from('users')
      .update({ name: name, subscribed: subscribed, is_active: isActive })
      .eq('id', id);
 
    if (error) {
      console.error('Error updating user:', error);
      showToast('Failed to update user. Check admin permissions.', 'error');
      return;
    }
 
    showToast('User updated successfully.', 'success');
    closeEditUserModal();
    await loadUsers();
    renderUsersTable();
 
    // Keep current session in sync if admin edited their own row
    if (state.currentUser && state.currentUser.id === id) {
      state.currentUser.name = name;
      state.currentUser.subscribed = subscribed;
      elements.userDisplayName.textContent = name;
    }
  });
}
 
// Dynamic Panel Reset Workers
function startEditLesson(lesson) {
  elements.adminLessonId.value = lesson.id;
  elements.adminTitle.value = lesson.title;
  elements.adminVideoUrl.value = `https://www.youtube.com/watch?v=${lesson.url}`;
  elements.adminDuration.value = lesson.duration || '';
  elements.adminDesc.value = lesson.desc || '';
 
  elements.btnAdminCancel.classList.remove('hidden');
  elements.btnAdminSubmit.textContent = 'Apply Updates';
  elements.adminTitle.focus();
}
 
async function deleteLesson(id) {
  if (!confirm('Are you sure you want to remove this course track option item data permanently?')) return;
 
  const { error } = await supabaseClient
    .from('lessons')
    .delete()
    .eq('id', id);
 
  if (error) {
    console.error('Error deleting lesson:', error);
    showToast('Failed to delete lesson. Check admin permissions.', 'error');
    return;
  }
 
  showToast('Lesson deleted successfully.', 'success');
 
  await refreshLessons();
 
  if (state.currentLessonIndex >= state.lessons.length) {
    state.currentLessonIndex = Math.max(0, state.lessons.length - 1);
  }
 
  if (state.lessons.length > 0) {
    selectLesson(state.currentLessonIndex);
  } else {
    clearPlayerDisplay();
  }
}
 
function resetAdminForm() {
  elements.adminLessonForm.reset();
  elements.adminLessonId.value = '';
  elements.btnAdminCancel.classList.add('hidden');
  elements.btnAdminSubmit.textContent = 'Save Lesson';
}
 
// Toast Prompt Alert System Component
function showToast(msg, type = 'info') {
  elements.toast.textContent = msg;
  elements.toast.className = `toast ${type}`;
  elements.toast.classList.remove('hidden');
 
  clearTimeout(elements.toast.timeoutId);
  elements.toast.timeoutId = setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 4000);
}
 
// System Startup Execution Trigger
init();
});
