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

document.addEventListener('DOMContentLoaded', () => {

// Core Application State
let state = {
currentUser: null,
lessons: [],
currentLessonIndex: 0,
viewMode: 'player' // 'player' | 'admin'
};

// Default Seed Syllabus
const DEFAULT_LESSONS = [
{
id: 'l1',
title: '01 - Platform Architecture & Design Strategy',
url: 'Ke90Tje7VS0',
duration: '12:45',
desc: 'Introduction to modular full-stack strategy, software styling conventions, clean design models, and architecture mapping.'
},
{
id: 'l2',
title: '02 - High-Performance Layouts with CSS Grid',
url: 'jV8B94X2cpg',
duration: '18:20',
desc: 'Deep dive into standard application shell development, advanced responsive containers, aligning tracks, and micro-interactions.'
},
{
id: 'l3',
title: '03 - Asynchronous Logic Operations',
url: 'Vn2A7MhydX4',
duration: '22:15',
desc: 'Mastering execution cycles, lifecycle management, runtime memory control, state storage patterns, and standard operations handling.'
},
{
id: 'l4',
title: '04 - Building Enterprise Production APIs',
url: '30LWjhZzg50',
duration: '25:40',
desc: 'Designing safe end-points, handling high traffic data validation operations, data lifecycle security, and persistence workflows.'
}
];

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
adminLessonsTbody: document.getElementById('admin-lessons-tbody')
};

// System Orchestration & Launch
function init() {
loadLessons();
setupEventListeners();
checkSession();
}

// Storage Management Logic (Lessons only — unrelated to Auth)
function loadLessons() {
const localData = localStorage.getItem('eduflix_lessons');
if (localData) {
state.lessons = JSON.parse(localData);
} else {
state.lessons = [...DEFAULT_LESSONS];
localStorage.setItem('eduflix_lessons', JSON.stringify(state.lessons));
}
}

function saveLessonsToStorage() {
localStorage.setItem('eduflix_lessons', JSON.stringify(state.lessons));
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
if (state.currentUser.email === 'admin@test.com') {
elements.adminBadge.classList.remove('hidden');
elements.btnToggleAdmin.classList.remove('hidden');
elements.premiumBadge.classList.add('hidden');
elements.btnSubscribe.classList.add('hidden');
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
if (mode === 'admin') {
elements.viewPlayer.classList.add('hidden');
elements.viewAdmin.classList.remove('hidden');
elements.btnToggleAdmin.classList.add('hidden');
elements.btnToggleCourse.classList.remove('hidden');
} else {
elements.viewAdmin.classList.add('hidden');
elements.viewPlayer.classList.remove('hidden');
elements.btnToggleCourse.classList.add('hidden');
if (state.currentUser && state.currentUser.email === 'admin@test.com') {
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

const isSubscribed = state.currentUser && (state.currentUser.subscribed || state.currentUser.email === 'admin@test.com');

state.lessons.forEach((lesson, index) => {
const item = document.createElement('div');
item.className = `lesson-item ${index === state.currentLessonIndex ? 'active' : ''}`;

// First item always unlocked, rest depends on access tier status
const isLocked = index > 0 && !isSubscribed;

item.innerHTML = `
<div class="lesson-item-left">
<span class="lesson-title">${lesson.title}</span>
<span class="lesson-duration">${lesson.duration}</span>
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
<td>${lesson.duration}</td>
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
elements.currentLessonDesc.textContent = lesson.desc;

// Subscription restriction gates
const isSubscribed = state.currentUser && (state.currentUser.subscribed || state.currentUser.email === 'admin@test.com');
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
if (urlStr.length === 11) return urlStr;
try {
const url = new URL(urlStr);
if (url.hostname === 'youtu.be') {
return url.pathname.substring(1);
}
if (url.hostname.includes('youtube.com')) {
return url.searchParams.get('v');
}
} catch(e) {
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

state.currentUser = profile;

if (profile.email === 'admin@test.com') {
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
const email = elements.registerEmail.value.trim();
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

// Syllabus Content Mutations (Admin Pane)
elements.adminLessonForm.addEventListener('submit', (e) => {
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

if (id) {
// Mutate item records
const targetIndex = state.lessons.findIndex(l => l.id === id);
if (targetIndex !== -1) {
state.lessons[targetIndex] = { id, title, url: parsedVideoId, duration, desc };
showToast('Lesson variables successfully saved.', 'success');
}
} else {
// Push new array records
const newLesson = {
id: 'l_' + Date.now(),
title,
url: parsedVideoId,
duration,
desc
};
state.lessons.push(newLesson);
showToast('New lesson integrated successfully into course track layout.', 'success');
}

saveLessonsToStorage();
resetAdminForm();

// Direct structural check to avoid app crash state
if (state.lessons.length === 1) {
selectLesson(0);
} else {
selectLesson(state.currentLessonIndex);
}
});

elements.btnAdminCancel.addEventListener('click', resetAdminForm);
}

// Dynamic Panel Reset Workers
function startEditLesson(lesson) {
elements.adminLessonId.value = lesson.id;
elements.adminTitle.value = lesson.title;
elements.adminVideoUrl.value = `https://www.youtube.com/watch?v=${lesson.url}`;
elements.adminDuration.value = lesson.duration;
elements.adminDesc.value = lesson.desc;

elements.btnAdminCancel.classList.remove('hidden');
elements.btnAdminSubmit.textContent = 'Apply Updates';
elements.adminTitle.focus();
}

function deleteLesson(id) {
if (!confirm('Are you sure you want to remove this course track option item data permanently?')) return;

state.lessons = state.lessons.filter(l => l.id !== id);
showToast('Lesson deleted successfully.', 'success');

// Boundaries checks and active layout adaptations
if (state.currentLessonIndex >= state.lessons.length) {
state.currentLessonIndex = Math.max(0, state.lessons.length - 1);
}

saveLessonsToStorage();

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
