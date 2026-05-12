function updateNavbar() {
  const user = Auth.getUser();
  const guestActions = document.getElementById('guest-actions');
  const userActions = document.getElementById('user-actions');
  const userNameEl = document.getElementById('user-name');
  const userAvatarEl = document.getElementById('user-avatar');
  const dashLink = document.getElementById('nav-dashboard');
  const usersLink = document.getElementById('nav-users');
  const reportsLink = document.getElementById('nav-reports');
  if (user) {
    guestActions?.classList.add('hidden');
    userActions?.classList.remove('hidden');
    if (userNameEl) userNameEl.textContent = user.name.split(' ')[0];
    if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
    if (dashLink) dashLink.classList.toggle('hidden', !Auth.hasRole('organizer', 'admin'));
    if (usersLink) usersLink.classList.toggle('hidden', !Auth.hasRole('admin'));
    if (reportsLink) reportsLink.classList.toggle('hidden', !Auth.hasRole('admin'));
  } else {
    guestActions?.classList.remove('hidden');
    userActions?.classList.add('hidden');
    dashLink?.classList.add('hidden');
    usersLink?.classList.add('hidden');
    reportsLink?.classList.add('hidden');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const email = form.querySelector('#login-email').value.trim();
  const password = form.querySelector('#login-password').value;
  if (!email || !password) { Toast.error('Please enter email and password'); return; }
  btn.disabled = true; btn.textContent = 'Signing in...';
  try {
    const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    Auth.setToken(data.token, data.user);
    Toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
    Modal.closeAll();
    updateNavbar();
    if (Auth.hasRole('admin', 'organizer')) Router.navigate('dashboard');
  } catch (error) {
    Toast.error(error.message || 'Login failed');
  } finally { btn.disabled = false; btn.textContent = 'Sign In'; }
}

async function handleRegisterAccount(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const data = {
    name: form.querySelector('#reg-name').value.trim(),
    email: form.querySelector('#reg-email').value.trim(),
    password: form.querySelector('#reg-password').value,
    role: form.querySelector('#reg-role').value,
    department: form.querySelector('#reg-department').value.trim(),
    studentId: form.querySelector('#reg-studentid').value.trim(),
  };
  if (!data.name || !data.email || !data.password) { Toast.error('Please fill in all required fields'); return; }
  if (data.password.length < 6) { Toast.error('Password must be at least 6 characters'); return; }
  btn.disabled = true; btn.textContent = 'Creating account...';
  try {
    const result = await apiRequest('/auth/register', { method: 'POST', body: data });
    Auth.setToken(result.token, result.user);
    Toast.success('Account created successfully!');
    Modal.closeAll();
    updateNavbar();
  } catch (error) {
    Toast.error(error.message || 'Registration failed');
  } finally { btn.disabled = false; btn.textContent = 'Create Account'; }
}

function handleLogout() {
  Auth.logout();
  updateNavbar();
  Router.navigate('home');
  Toast.info('You have been logged out');
}

function showAuthModal(mode = 'login') {
  Modal.open('auth-modal');
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form-wrapper');
  const registerForm = document.getElementById('register-form-wrapper');
  if (mode === 'login') {
    loginTab?.classList.add('active'); registerTab?.classList.remove('active');
    loginForm?.classList.remove('hidden'); registerForm?.classList.add('hidden');
  } else {
    registerTab?.classList.add('active'); loginTab?.classList.remove('active');
    registerForm?.classList.remove('hidden'); loginForm?.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  document.getElementById('form-login')?.addEventListener('submit', handleLogin);
  document.getElementById('form-register')?.addEventListener('submit', handleRegisterAccount);
  document.getElementById('tab-login')?.addEventListener('click', () => showAuthModal('login'));
  document.getElementById('tab-register')?.addEventListener('click', () => showAuthModal('register'));
});
