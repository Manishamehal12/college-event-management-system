async function loadUsers() {
  if (!Auth.hasRole('admin')) { showAuthModal('login'); Router.navigate('home'); return; }
  const container = document.getElementById('users-content');
  if (!container) return;
  setLoadingState(container);
  try {
    const data = await apiRequest('/users?limit=100');
    renderUsersPage(data.users, data.total);
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>${error.message}</h3></div>`;
  }
}

function renderUsersPage(users, total) {
  const container = document.getElementById('users-content');
  if (!container) return;
  const byRole = { admin: users.filter(u => u.role==='admin').length, organizer: users.filter(u => u.role==='organizer').length, student: users.filter(u => u.role==='student').length };
  container.innerHTML = `
    <div class="dashboard-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:28px;">
      <div class="dash-stat" data-icon="👑"><div class="dash-stat-label">Admins</div><div class="dash-stat-value indigo">${byRole.admin}</div></div>
      <div class="dash-stat" data-icon="🎭"><div class="dash-stat-label">Organizers</div><div class="dash-stat-value gold">${byRole.organizer}</div></div>
      <div class="dash-stat" data-icon="🎓"><div class="dash-stat-label">Students</div><div class="dash-stat-value emerald">${byRole.student}</div></div>
    </div>
    <div class="table-container">
      <div class="table-header">
        <span class="table-title">All Users (${total})</span>
        <input type="text" placeholder="Search users..." class="form-control" style="width:200px;padding:7px 12px;" oninput="filterUsersTable(this.value)">
      </div>
      <table id="users-table">
        <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Department</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr data-user-name="${u.name.toLowerCase()}" data-user-email="${u.email.toLowerCase()}">
              <td><div style="display:flex;align-items:center;gap:10px;"><div class="avatar">${u.name.charAt(0).toUpperCase()}</div><span style="font-weight:600;font-size:0.875rem;">${u.name}</span></div></td>
              <td style="font-size:0.8rem;">${u.email}</td>
              <td><span class="badge ${u.role==='admin'?'badge-cancelled':u.role==='organizer'?'badge-ongoing':'badge-upcoming'}">${u.role.charAt(0).toUpperCase()+u.role.slice(1)}</span></td>
              <td style="font-size:0.8rem;color:var(--text-muted);">${u.department||'-'}</td>
              <td style="font-size:0.78rem;color:var(--text-muted);">${Format.date(u.createdAt)}</td>
              <td><span class="badge ${u.isActive?'badge-ongoing':'badge-cancelled'}">${u.isActive?'✅ Active':'❌ Inactive'}</span></td>
              <td>
                <div style="display:flex;gap:6px;">
                  <select class="form-control" style="padding:4px 8px;font-size:0.78rem;width:120px;" onchange="updateUserRole('${u._id}',this.value)">
                    ${['student','organizer','admin'].map(r=>`<option value="${r}" ${r===u.role?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join('')}
                  </select>
                  <button class="btn btn-danger btn-sm" onclick="deleteUser('${u._id}','${escapeHtml(u.name)}')">🗑️</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function filterUsersTable(query) {
  const rows = document.querySelectorAll('#users-table tbody tr');
  const q = query.toLowerCase();
  rows.forEach(row => {
    const name = row.getAttribute('data-user-name') || '';
    const email = row.getAttribute('data-user-email') || '';
    row.style.display = name.includes(q) || email.includes(q) ? '' : 'none';
  });
}

async function updateUserRole(userId, newRole) {
  try { await apiRequest(`/users/${userId}`, { method: 'PUT', body: { role: newRole } }); Toast.success(`Role updated to ${newRole}`); }
  catch (error) { Toast.error(error.message); }
}

async function deleteUser(userId, name) {
  if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
  try { await apiRequest(`/users/${userId}`, { method: 'DELETE' }); Toast.success('User deleted'); loadUsers(); }
  catch (error) { Toast.error(error.message); }
}

async function loadReports() {
  if (!Auth.hasRole('admin')) { showAuthModal('login'); Router.navigate('home'); return; }
  const container = document.getElementById('reports-content');
  if (!container) return;
  setLoadingState(container);
  try {
    const data = await apiRequest('/users/reports/summary');
    renderReports(data.report);
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>${error.message}</h3></div>`;
  }
}

function renderReports(report) {
  const container = document.getElementById('reports-content');
  if (!container) return;
  container.innerHTML = `
    <div class="dashboard-grid" style="margin-bottom:28px;">
      <div class="dash-stat" data-icon="👥"><div class="dash-stat-label">Total Users</div><div class="dash-stat-value indigo">${report.totalUsers}</div></div>
      <div class="dash-stat" data-icon="🎭"><div class="dash-stat-label">Total Events</div><div class="dash-stat-value gold">${report.totalEvents}</div></div>
      <div class="dash-stat" data-icon="📝"><div class="dash-stat-label">Registrations</div><div class="dash-stat-value emerald">${report.totalRegistrations}</div></div>
      <div class="dash-stat" data-icon="✅"><div class="dash-stat-label">Attendance Rate</div><div class="dash-stat-value sky">${report.attendanceRate}%</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div class="card">
        <h4 style="margin-bottom:16px;font-family:'Playfair Display',serif;">👥 Users by Role</h4>
        ${report.usersByRole.map(r => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
            <span style="font-size:0.875rem;text-transform:capitalize;">${r._id}</span>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:100px;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${Math.round((r.count/report.totalUsers)*100)}%;background:var(--indigo);border-radius:3px;"></div>
              </div>
              <strong style="color:var(--indigo-light);">${r.count}</strong>
            </div>
          </div>`).join('')}
      </div>
      <div class="card">
        <h4 style="margin-bottom:16px;font-family:'Playfair Display',serif;">🏆 Top 5 Events</h4>
        ${report.topEvents.length ? report.topEvents.map((e,i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
            <div>
              <div style="font-size:0.875rem;font-weight:600;">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} ${e.title}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${e.category}</div>
            </div>
            <span class="badge badge-upcoming">${e.count} regs</span>
          </div>`).join('') : '<p class="text-muted" style="font-size:0.875rem;">No data yet</p>'}
      </div>
    </div>
    <div class="card mt-6">
      <h4 style="font-family:'Playfair Display',serif;margin-bottom:20px;">📊 Attendance Summary</h4>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;text-align:center;">
        <div><div style="font-size:2rem;font-weight:700;color:var(--indigo-light);">${report.totalRegistrations}</div><div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">Total Registrations</div></div>
        <div><div style="font-size:2rem;font-weight:700;color:var(--emerald);">${report.attended}</div><div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">Attended</div></div>
        <div><div style="font-size:2rem;font-weight:700;color:var(--gold);">${report.attendanceRate}%</div><div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">Attendance Rate</div></div>
      </div>
      <div style="margin-top:20px;height:10px;background:rgba(255,255,255,0.06);border-radius:5px;overflow:hidden;">
        <div style="height:100%;width:${report.attendanceRate}%;background:linear-gradient(90deg,var(--indigo),var(--emerald));border-radius:5px;"></div>
      </div>
    </div>`;
}

async function loadHomeStats() {
  try {
    const data = await apiRequest('/events?limit=1');
    const el = document.getElementById('stat-events');
    if (el) el.textContent = data.total;
  } catch (error) {}
}
