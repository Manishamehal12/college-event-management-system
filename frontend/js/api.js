const API_BASE = 'http://localhost:3000/api';

const Auth = {
  setToken(token, user) { localStorage.setItem('cem_token', token); localStorage.setItem('cem_user', JSON.stringify(user)); },
  getToken() { return localStorage.getItem('cem_token'); },
  getUser() { const u = localStorage.getItem('cem_user'); return u ? JSON.parse(u) : null; },
  isLoggedIn() { return !!this.getToken(); },
  logout() { localStorage.removeItem('cem_token'); localStorage.removeItem('cem_user'); },
  hasRole(...roles) { const user = this.getUser(); return user && roles.includes(user.role); },
};

async function apiRequest(endpoint, options = {}) {
  const config = { headers: { 'Content-Type': 'application/json' }, ...options };
  const token = Auth.getToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (config.body && typeof config.body === 'object') config.body = JSON.stringify(config.body);
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);
    return data;
  } catch (error) { throw error; }
}

const Toast = {
  show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  warning: (msg) => Toast.show(msg, 'warning'),
  info: (msg) => Toast.show(msg, 'info'),
};

const Modal = {
  open(id) { const o = document.getElementById(id); if (o) { o.classList.add('open'); document.body.style.overflow = 'hidden'; } },
  close(id) { const o = document.getElementById(id); if (o) { o.classList.remove('open'); document.body.style.overflow = ''; } },
  closeAll() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open')); document.body.style.overflow = ''; },
};

document.addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) Modal.closeAll(); });

const Format = {
  date(dateStr) { if (!dateStr) return 'N/A'; return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); },
  dateTime(dateStr) { if (!dateStr) return 'N/A'; return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); },
  categoryIcon(cat) { const icons = { Academic: '📚', Cultural: '🎭', Sports: '⚽', Technical: '💻', Workshop: '🛠️', Seminar: '🎤', Other: '📌' }; return icons[cat] || '📌'; },
  statusBadge(status) { const map = { upcoming: '<span class="badge badge-upcoming">🔵 Upcoming</span>', ongoing: '<span class="badge badge-ongoing">🟢 Ongoing</span>', completed: '<span class="badge badge-completed">⚪ Completed</span>', cancelled: '<span class="badge badge-cancelled">🔴 Cancelled</span>' }; return map[status] || status; },
};

function setLoadingState(container) {
  container.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading...</span></div>`;
}

function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }

const Router = {
  currentPage: 'home',
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) { pageEl.classList.add('active'); this.currentPage = page; window.scrollTo({ top: 0, behavior: 'smooth' }); }
    const navLink = document.querySelector(`[data-page="${page}"]`);
    if (navLink) navLink.classList.add('active');
    this.onNavigate(page);
  },
  onNavigate(page) {
    switch(page) {
      case 'home': loadHomeStats(); break;
      case 'events': loadEvents(); break;
      case 'dashboard': loadDashboard(); break;
      case 'users': loadUsers(); break;
      case 'reports': loadReports(); break;
    }
  },
};
