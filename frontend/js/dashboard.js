let dashboardSection = 'overview';

async function loadDashboard() {
  const user = Auth.getUser();
  if (!user || !Auth.hasRole('organizer', 'admin')) { showAuthModal('login'); Router.navigate('home'); return; }
  const dashAvatar = document.getElementById('dash-avatar');
  const dashName = document.getElementById('dash-user-name');
  const dashRole = document.getElementById('dash-user-role');
  if (dashAvatar) dashAvatar.textContent = user.name.charAt(0).toUpperCase();
  if (dashName) dashName.textContent = user.name;
  if (dashRole) dashRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  renderDashboardNav();
  loadDashboardSection('overview');
}

function renderDashboardNav() {
  const sidebarEl = document.getElementById('dashboard-sidebar');
  if (!sidebarEl) return;
  const items = [
    { key: 'overview', icon: '📊', label: 'Overview' },
    { key: 'my-events', icon: '🎭', label: Auth.hasRole('admin') ? 'All Events' : 'My Events' },
    { key: 'create-event', icon: '➕', label: 'Create Event' },
    { key: 'attendance', icon: '📋', label: 'Attendance' },
    ...(Auth.hasRole('admin') ? [{ key: 'all-registrations', icon: '📝', label: 'Registrations' }] : []),
  ];
  sidebarEl.innerHTML = items.map(item => `
    <button class="sidebar-link ${item.key === dashboardSection ? 'active' : ''}" onclick="loadDashboardSection('${item.key}')">
      <span class="icon">${item.icon}</span>${item.label}
    </button>`).join('');
}

function loadDashboardSection(section) {
  dashboardSection = section;
  document.querySelectorAll('.sidebar-link').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(btn => { if (btn.textContent.trim().toLowerCase().includes(section.replace(/-/g,' '))) btn.classList.add('active'); });
  switch(section) {
    case 'overview': loadDashboardOverview(); break;
    case 'my-events': loadMyEvents(); break;
    case 'create-event': showCreateEventForm(); break;
    case 'attendance': showAttendanceSection(); break;
    case 'all-registrations': loadAllRegistrations(); break;
  }
}

async function loadDashboardOverview() {
  const contentEl = document.getElementById('dashboard-content');
  contentEl.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading stats...</span></div>`;
  try {
    const data = await apiRequest('/events/stats');
    const stats = data.stats;
    contentEl.innerHTML = `
      <div class="section-header mb-6">
        <h2 class="section-title">Dashboard Overview</h2>
        <span class="text-secondary" style="font-size:0.875rem;">Welcome, ${Auth.getUser()?.name?.split(' ')[0]}!</span>
      </div>
      <div class="dashboard-grid">
        <div class="dash-stat" data-icon="🎭"><div class="dash-stat-label">Total Events</div><div class="dash-stat-value indigo">${stats.totalEvents}</div></div>
        <div class="dash-stat" data-icon="📅"><div class="dash-stat-label">Upcoming</div><div class="dash-stat-value gold">${stats.upcomingEvents}</div></div>
        <div class="dash-stat" data-icon="✅"><div class="dash-stat-label">Completed</div><div class="dash-stat-value emerald">${stats.completedEvents}</div></div>
        <div class="dash-stat" data-icon="👥"><div class="dash-stat-label">Registrations</div><div class="dash-stat-value sky">${stats.totalRegistrations}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;">
        <div class="card">
          <h4 style="margin-bottom:16px;font-size:1rem;">📊 Events by Category</h4>
          ${stats.categoryStats.length ? stats.categoryStats.map(c => `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <span style="font-size:0.875rem;">${Format.categoryIcon(c._id)} ${c._id}</span>
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:80px;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
                  <div style="height:100%;width:${Math.round((c.count/stats.totalEvents)*100)}%;background:var(--indigo);border-radius:3px;"></div>
                </div>
                <span style="font-size:0.8rem;font-weight:700;color:var(--indigo-light);">${c.count}</span>
              </div>
            </div>`).join('') : '<p class="text-muted" style="font-size:0.875rem;">No data yet</p>'}
        </div>
        <div class="card">
          <h4 style="margin-bottom:16px;font-size:1rem;">📈 Monthly Registrations</h4>
          ${stats.monthlyTrend.length ? renderMonthlyChart(stats.monthlyTrend) : '<p class="text-muted" style="font-size:0.875rem;">No registration data yet</p>'}
        </div>
      </div>`;
  } catch (error) {
    document.getElementById('dashboard-content').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>${error.message}</h3></div>`;
  }
}

function renderMonthlyChart(data) {
  if (!data.length) return '';
  const max = Math.max(...data.map(d => d.count));
  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `<div style="display:flex;align-items:flex-end;gap:6px;height:80px;">${data.map(d => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
      <span style="font-size:0.65rem;color:var(--text-muted);">${d.count}</span>
      <div style="width:100%;height:${Math.round((d.count/max)*60)+4}px;background:var(--indigo);border-radius:3px;opacity:0.8;"></div>
      <span style="font-size:0.65rem;color:var(--text-muted);">${months[d._id.month]}</span>
    </div>`).join('')}</div>`;
}

async function loadMyEvents() {
  const contentEl = document.getElementById('dashboard-content');
  contentEl.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
  try {
    const data = await apiRequest('/events?limit=50');
    contentEl.innerHTML = `
      <div class="section-header mb-6">
        <h2 class="section-title">${Auth.hasRole('admin') ? 'All Events' : 'My Events'}</h2>
        <button class="btn btn-primary btn-sm" onclick="loadDashboardSection('create-event')">+ New Event</button>
      </div>
      <div class="table-container">
        <table>
          <thead><tr><th>Event</th><th>Date</th><th>Category</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
          <tbody>
            ${data.events.length ? data.events.map(e => `
              <tr>
                <td><div style="font-weight:600;color:var(--text-primary);font-size:0.875rem;">${e.title}</div><div style="font-size:0.75rem;color:var(--text-muted);">📍 ${e.venue}</div></td>
                <td style="font-size:0.8rem;">${Format.date(e.date)}<br><span class="text-muted">${e.time}</span></td>
                <td><span class="event-category-badge" style="margin:0;">${Format.categoryIcon(e.category)} ${e.category}</span></td>
                <td>${Format.statusBadge(e.status)}</td>
                <td><span style="font-weight:600;">${e.registeredCount}</span><span class="text-muted">/${e.capacity}</span></td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button class="btn btn-outline btn-sm" onclick="showEditEventForm('${e._id}')">✏️ Edit</button>
                    <button class="btn btn-outline btn-sm" onclick="loadEventRegistrations('${e._id}','${escapeHtml(e.title)}')">👥 Regs</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEvent('${e._id}','${escapeHtml(e.title)}')">🗑️</button>
                  </div>
                </td>
              </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No events yet. Create your first event!</td></tr>'}
          </tbody>
        </table>
      </div>`;
  } catch (error) {
    document.getElementById('dashboard-content').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>${error.message}</h3></div>`;
  }
}

function showCreateEventForm(eventData = null) {
  const contentEl = document.getElementById('dashboard-content');
  const isEdit = !!eventData;
  contentEl.innerHTML = `
    <div class="section-header mb-6">
      <h2 class="section-title">${isEdit ? 'Edit Event' : 'Create New Event'}</h2>
      <button class="btn btn-outline btn-sm" onclick="loadDashboardSection('my-events')">← Back</button>
    </div>
    <div style="max-width:720px;">
      <form id="event-form" onsubmit="submitEventForm(event,'${eventData?._id || ''}')">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Event Title *</label><input type="text" class="form-control" id="ef-title" placeholder="e.g. Annual Tech Fest" value="${eventData?.title || ''}" required></div>
          <div class="form-group"><label class="form-label">Category *</label>
            <select class="form-control" id="ef-category" required>
              ${['Academic','Cultural','Sports','Technical','Workshop','Seminar','Other'].map(c => `<option value="${c}" ${eventData?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Description *</label><textarea class="form-control" id="ef-description" rows="4" placeholder="Describe the event..." required>${eventData?.description || ''}</textarea></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Date *</label><input type="date" class="form-control" id="ef-date" value="${eventData?.date ? new Date(eventData.date).toISOString().split('T')[0] : ''}" required></div>
          <div class="form-group"><label class="form-label">Time *</label><input type="time" class="form-control" id="ef-time" value="${eventData?.time || ''}" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Venue *</label><input type="text" class="form-control" id="ef-venue" placeholder="e.g. Main Auditorium" value="${eventData?.venue || ''}" required></div>
          <div class="form-group"><label class="form-label">Capacity *</label><input type="number" class="form-control" id="ef-capacity" min="1" placeholder="e.g. 200" value="${eventData?.capacity || ''}" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Registration Deadline</label><input type="date" class="form-control" id="ef-deadline" value="${eventData?.registrationDeadline ? new Date(eventData.registrationDeadline).toISOString().split('T')[0] : ''}"></div>
          <div class="form-group"><label class="form-label">Status</label>
            <select class="form-control" id="ef-status">
              ${['upcoming','ongoing','completed','cancelled'].map(s => `<option value="${s}" ${eventData?.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Tags (comma-separated)</label><input type="text" class="form-control" id="ef-tags" placeholder="e.g. coding, hackathon, prizes" value="${eventData?.tags?.join(', ') || ''}"></div>
        <div style="display:flex;gap:12px;margin-top:8px;">
          <button type="submit" class="btn btn-primary btn-lg">${isEdit ? 'Update Event' : 'Create Event'}</button>
          <button type="button" class="btn btn-outline" onclick="loadDashboardSection('my-events')">Cancel</button>
        </div>
      </form>
    </div>`;
}

async function showEditEventForm(eventId) {
  try { const data = await apiRequest(`/events/${eventId}`); showCreateEventForm(data.event); }
  catch (error) { Toast.error(error.message); }
}

async function submitEventForm(e, eventId) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const tagsRaw = document.getElementById('ef-tags').value;
  const payload = {
    title: document.getElementById('ef-title').value.trim(),
    description: document.getElementById('ef-description').value.trim(),
    category: document.getElementById('ef-category').value,
    date: document.getElementById('ef-date').value,
    time: document.getElementById('ef-time').value,
    venue: document.getElementById('ef-venue').value.trim(),
    capacity: Number(document.getElementById('ef-capacity').value),
    status: document.getElementById('ef-status').value,
    registrationDeadline: document.getElementById('ef-deadline').value || undefined,
    tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [],
  };
  btn.disabled = true; btn.textContent = eventId ? 'Updating...' : 'Creating...';
  try {
    if (eventId) { await apiRequest(`/events/${eventId}`, { method: 'PUT', body: payload }); Toast.success('Event updated!'); }
    else { await apiRequest('/events', { method: 'POST', body: payload }); Toast.success('Event created!'); }
    loadDashboardSection('my-events');
  } catch (error) { Toast.error(error.message || 'Failed to save event'); btn.disabled = false; btn.textContent = eventId ? 'Update Event' : 'Create Event'; }
}

async function deleteEvent(eventId, title) {
  if (!confirm(`Delete "${title}"? This will also remove all registrations.`)) return;
  try { await apiRequest(`/events/${eventId}`, { method: 'DELETE' }); Toast.success('Event deleted'); loadMyEvents(); }
  catch (error) { Toast.error(error.message); }
}

async function loadEventRegistrations(eventId, eventTitle) {
  const contentEl = document.getElementById('dashboard-content');
  contentEl.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
  try {
    const data = await apiRequest(`/events/${eventId}/registrations`);
    contentEl.innerHTML = `
      <div class="section-header mb-6">
        <div><h2 class="section-title">Registrations</h2><p class="text-secondary" style="font-size:0.875rem;">${eventTitle}</p></div>
        <div style="display:flex;gap:10px;"><span class="badge badge-upcoming">Total: ${data.count}</span><span class="badge badge-ongoing">Attended: ${data.attended}</span><button class="btn btn-outline btn-sm" onclick="loadDashboardSection('my-events')">← Back</button></div>
      </div>
      <div class="table-container">
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Dept/ID</th><th>Registered</th><th>Status</th></tr></thead>
          <tbody>
            ${data.registrations.length ? data.registrations.map((r,i) => `
              <tr>
                <td style="font-size:0.8rem;color:var(--text-muted);">${i+1}</td>
                <td style="font-weight:600;color:var(--text-primary);font-size:0.875rem;">${r.name}</td>
                <td style="font-size:0.8rem;">${r.email}</td>
                <td style="font-size:0.8rem;color:var(--text-muted);">${r.department || '-'} · ${r.studentId || '-'}</td>
                <td style="font-size:0.78rem;color:var(--text-muted);">${Format.dateTime(r.createdAt)}</td>
                <td>${r.attended ? '<span class="badge badge-ongoing">✅ Attended</span>' : '<span class="badge badge-upcoming">⏳ Pending</span>'}</td>
              </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No registrations yet</td></tr>'}
          </tbody>
        </table>
      </div>`;
  } catch (error) { Toast.error(error.message); }
}

function showAttendanceSection() {
  document.getElementById('dashboard-content').innerHTML = `
    <div class="section-header mb-6"><h2 class="section-title">📋 Attendance Tracking</h2></div>
    <div style="max-width:500px;">
      <div class="card">
        <h4 style="margin-bottom:6px;">Mark Attendance by QR Token</h4>
        <p class="text-secondary" style="font-size:0.875rem;margin-bottom:20px;">Paste the QR token from a student's registration to mark attendance.</p>
        <div class="form-group"><label class="form-label">QR Token</label><input type="text" class="form-control" id="qr-token-input" placeholder="Paste QR token here..."></div>
        <button class="btn btn-primary w-full" onclick="markAttendanceByToken()">✅ Mark Attendance</button>
      </div>
      <div id="attendance-result" style="margin-top:16px;"></div>
    </div>`;
}

async function markAttendanceByToken() {
  const token = document.getElementById('qr-token-input').value.trim();
  const resultEl = document.getElementById('attendance-result');
  if (!token) { Toast.error('Please enter a QR token'); return; }
  try {
    const data = await apiRequest('/registrations/attendance', { method: 'POST', body: { qrToken: token } });
    resultEl.innerHTML = `<div class="card" style="border-color:rgba(16,185,129,0.4);background:rgba(16,185,129,0.08);"><div style="font-size:24px;margin-bottom:8px;">✅</div><h4 style="color:var(--emerald);margin-bottom:6px;">Attendance Marked!</h4><p style="font-size:0.875rem;color:var(--text-secondary);"><strong>${data.registration.name}</strong> marked present</p></div>`;
    document.getElementById('qr-token-input').value = '';
  } catch (error) {
    resultEl.innerHTML = `<div class="card" style="border-color:rgba(244,63,94,0.4);background:rgba(244,63,94,0.08);"><div style="font-size:24px;margin-bottom:8px;">❌</div><h4 style="color:var(--rose);">Error</h4><p style="font-size:0.875rem;color:var(--text-secondary);">${error.message}</p></div>`;
  }
}

async function loadAllRegistrations() {
  const contentEl = document.getElementById('dashboard-content');
  contentEl.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
  try {
    const data = await apiRequest('/registrations?limit=50');
    contentEl.innerHTML = `
      <div class="section-header mb-6"><h2 class="section-title">All Registrations</h2><span class="badge badge-upcoming">Total: ${data.total}</span></div>
      <div class="table-container">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Event</th><th>Registered</th><th>Status</th></tr></thead>
          <tbody>
            ${data.registrations.map(r => `
              <tr>
                <td style="font-weight:600;font-size:0.875rem;">${r.name}</td>
                <td style="font-size:0.8rem;">${r.email}</td>
                <td style="font-size:0.8rem;">${r.event?.title || 'N/A'}</td>
                <td style="font-size:0.78rem;color:var(--text-muted);">${Format.dateTime(r.createdAt)}</td>
                <td>${r.attended ? '<span class="badge badge-ongoing">✅ Attended</span>' : '<span class="badge badge-upcoming">⏳ Pending</span>'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (error) {
    document.getElementById('dashboard-content').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>${error.message}</h3></div>`;
  }
}
