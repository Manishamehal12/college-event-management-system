let eventsState = { events: [], page: 1, totalPages: 1, category: 'all', status: 'all', search: '' };

async function loadEvents(page = 1) {
  const container = document.getElementById('events-list');
  if (!container) return;
  eventsState.page = page;
  setLoadingState(container);
  try {
    const params = new URLSearchParams({ page: eventsState.page, limit: 9 });
    if (eventsState.category !== 'all') params.set('category', eventsState.category);
    if (eventsState.status !== 'all') params.set('status', eventsState.status);
    if (eventsState.search) params.set('search', eventsState.search);
    const data = await apiRequest(`/events?${params.toString()}`);
    eventsState.events = data.events;
    eventsState.totalPages = data.pages;
    renderEvents(data.events, data.total);
    renderEventsPagination(data.pages, page);
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load events</h3><p>${error.message}</p><button class="btn btn-primary mt-4" onclick="loadEvents()">Retry</button></div>`;
  }
}

function renderEvents(events, total) {
  const container = document.getElementById('events-list');
  const countEl = document.getElementById('events-count');
  if (countEl) countEl.textContent = `${total} event${total !== 1 ? 's' : ''} found`;
  if (!events.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🎭</div><h3>No events found</h3><p>Try adjusting your filters or check back later.</p></div>`;
    return;
  }
  container.innerHTML = events.map(event => renderEventCard(event)).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderEventCard(event) {
  const fillPercent = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));
  const isFull = event.registeredCount >= event.capacity;
  const fillClass = fillPercent >= 90 ? 'full' : fillPercent >= 70 ? 'warning' : '';
  const isPast = new Date(event.date) < new Date() && event.status !== 'ongoing';
  return `
    <div class="event-card" onclick="showEventDetail('${event._id}')">
      <div class="event-card-banner ${event.category}"></div>
      <div class="event-card-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <span class="event-category-badge">${Format.categoryIcon(event.category)} ${event.category}</span>
          ${Format.statusBadge(event.status)}
        </div>
        <h3 class="event-title">${event.title}</h3>
        <div class="event-meta">
          <div class="event-meta-item"><span class="icon">📅</span><span>${Format.date(event.date)} at ${event.time}</span></div>
          <div class="event-meta-item"><span class="icon">📍</span><span>${event.venue}</span></div>
          <div class="event-meta-item"><span class="icon">👤</span><span>By ${event.organizerName || event.organizer?.name || 'College'}</span></div>
        </div>
        <div class="event-footer">
          <div class="capacity-bar">
            <div class="capacity-label"><span>${event.registeredCount}/${event.capacity} registered</span><span>${isFull ? 'FULL' : `${event.capacity - event.registeredCount} left`}</span></div>
            <div class="capacity-track"><div class="capacity-fill ${fillClass}" style="width:${fillPercent}%"></div></div>
          </div>
          <button class="btn btn-primary btn-sm" ${isFull || isPast ? 'disabled' : ''} onclick="event.stopPropagation();openRegisterModal('${event._id}','${escapeHtml(event.title)}')">
            ${isFull ? 'Full' : isPast ? 'Ended' : 'Register'}
          </button>
        </div>
      </div>
    </div>`;
}

function renderEventsPagination(totalPages, currentPage) {
  const container = document.getElementById('events-pagination');
  if (!container || totalPages <= 1) { if (container) container.innerHTML = ''; return; }
  let html = `<button class="page-btn" onclick="loadEvents(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadEvents(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="text-muted" style="padding:0 4px">...</span>`;
    }
  }
  html += `<button class="page-btn" onclick="loadEvents(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
  container.innerHTML = html;
}

async function showEventDetail(eventId) {
  const body = document.getElementById('event-detail-body');
  if (!body) return;
  body.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading...</span></div>`;
  Modal.open('event-detail-modal');
  try {
    const data = await apiRequest(`/events/${eventId}`);
    const event = data.event;
    const isFull = event.registeredCount >= event.capacity;
    const isPast = new Date(event.date) < new Date() && event.status !== 'ongoing';
    body.innerHTML = `
      <div class="event-card-banner ${event.category}" style="height:6px;border-radius:4px;margin-bottom:20px;"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
        <span class="event-category-badge">${Format.categoryIcon(event.category)} ${event.category}</span>
        ${Format.statusBadge(event.status)}
      </div>
      <h2 style="font-size:1.6rem;margin-bottom:12px;">${event.title}</h2>
      <p style="color:var(--text-secondary);margin-bottom:24px;line-height:1.7;">${event.description}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div class="card" style="padding:16px;"><div class="text-muted" style="font-size:0.75rem;text-transform:uppercase;margin-bottom:6px;">Date & Time</div><div style="font-weight:600;">📅 ${Format.date(event.date)}</div><div style="color:var(--text-secondary);font-size:0.875rem;">🕐 ${event.time}</div></div>
        <div class="card" style="padding:16px;"><div class="text-muted" style="font-size:0.75rem;text-transform:uppercase;margin-bottom:6px;">Venue</div><div style="font-weight:600;">📍 ${event.venue}</div></div>
        <div class="card" style="padding:16px;"><div class="text-muted" style="font-size:0.75rem;text-transform:uppercase;margin-bottom:6px;">Organizer</div><div style="font-weight:600;">👤 ${event.organizerName || event.organizer?.name}</div></div>
        <div class="card" style="padding:16px;"><div class="text-muted" style="font-size:0.75rem;text-transform:uppercase;margin-bottom:6px;">Capacity</div><div style="font-weight:600;">👥 ${event.registeredCount}/${event.capacity}</div><div style="color:var(--text-secondary);font-size:0.875rem;">${isFull ? '❌ Full' : `✅ ${event.capacity - event.registeredCount} seats left`}</div></div>
      </div>
      <button class="btn btn-gold btn-lg w-full" ${isFull || isPast ? 'disabled' : ''} onclick="Modal.closeAll();openRegisterModal('${event._id}','${escapeHtml(event.title)}')">
        ${isFull ? '❌ Event Full' : isPast ? '⏱️ Registration Closed' : '🎟️ Register for this Event'}
      </button>`;
  } catch (error) {
    body.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load event</h3></div>`;
  }
}

function openRegisterModal(eventId, eventTitle) {
  document.getElementById('reg-event-id').value = eventId;
  document.getElementById('reg-event-title').textContent = eventTitle;
  const user = Auth.getUser();
  if (user) {
    const nameField = document.getElementById('reg-student-name');
    const emailField = document.getElementById('reg-student-email');
    if (nameField) nameField.value = user.name;
    if (emailField) emailField.value = user.email;
  }
  Modal.open('register-modal');
}

async function handleEventRegistration(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const payload = {
    eventId: document.getElementById('reg-event-id').value,
    name: form.querySelector('#reg-student-name').value.trim(),
    email: form.querySelector('#reg-student-email').value.trim(),
    phone: form.querySelector('#reg-student-phone').value.trim(),
    department: form.querySelector('#reg-student-dept').value.trim(),
    studentId: form.querySelector('#reg-student-id').value.trim(),
  };
  if (!payload.name || !payload.email) { Toast.error('Name and email are required'); return; }
  btn.disabled = true; btn.textContent = 'Registering...';
  try {
    const data = await apiRequest('/registrations', { method: 'POST', body: payload });
    form.reset();
    Modal.close('register-modal');
    showRegistrationSuccess(data.registration);
    loadEvents(eventsState.page);
  } catch (error) {
    Toast.error(error.message || 'Registration failed');
  } finally { btn.disabled = false; btn.textContent = 'Complete Registration'; }
}

function showRegistrationSuccess(reg) {
  const body = document.getElementById('success-body');
  if (!body) return;
  body.innerHTML = `
    <div class="success-card">
      <span class="success-icon">🎉</span>
      <h2 style="margin-bottom:8px;">You're Registered!</h2>
      <p style="color:var(--text-secondary);margin-bottom:24px;">Your spot has been confirmed.</p>
      <div style="background:rgba(255,255,255,0.05);border-radius:var(--radius);padding:20px;text-align:left;margin-bottom:20px;">
        <div style="display:grid;gap:10px;font-size:0.875rem;">
          <div class="flex justify-between"><span class="text-muted">Registration #</span><strong>${reg.registrationNumber}</strong></div>
          <div class="flex justify-between"><span class="text-muted">Name</span><span>${reg.name}</span></div>
          <div class="flex justify-between"><span class="text-muted">Event</span><span>${reg.event}</span></div>
          <div class="flex justify-between"><span class="text-muted">Date</span><span>${Format.date(reg.date)}</span></div>
          <div class="flex justify-between"><span class="text-muted">Venue</span><span>${reg.venue}</span></div>
        </div>
      </div>
      <div style="margin-bottom:20px;">
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;">Your Attendance QR Code</p>
        <div class="qr-display"><img src="${reg.qrCode}" alt="QR Code"/><p style="color:#333;font-size:0.75rem;margin-top:8px;">Show this at the event entrance</p></div>
      </div>
      <button class="btn btn-outline w-full" onclick="Modal.close('success-modal')">Close</button>
    </div>`;
  Modal.open('success-modal');
}

async function lookupMyRegistrations() {
  const email = document.getElementById('lookup-email').value.trim();
  if (!email) { Toast.error('Please enter your email'); return; }
  const container = document.getElementById('my-registrations-list');
  setLoadingState(container);
  try {
    const data = await apiRequest(`/registrations/my?email=${encodeURIComponent(email)}`);
    if (!data.registrations.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>No registrations found</h3></div>`;
      return;
    }
    container.innerHTML = data.registrations.map(reg => `
      <div class="card" style="margin-bottom:12px;">
        <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:10px;">
          <div>
            <h4 style="font-size:1rem;margin-bottom:4px;">${reg.event?.title || 'Event'}</h4>
            <div style="font-size:0.8rem;color:var(--text-muted);">📅 ${Format.date(reg.event?.date)} · 📍 ${reg.event?.venue || 'N/A'}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            ${reg.attended ? '<span class="badge badge-ongoing">✅ Attended</span>' : '<span class="badge badge-upcoming">⏳ Pending</span>'}
            ${Format.statusBadge(reg.event?.status || 'upcoming')}
          </div>
        </div>
      </div>`).join('');
  } catch (error) {
    Toast.error(error.message);
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>${error.message}</h3></div>`;
  }
}

function setEventCategory(category, btn) {
  eventsState.category = category;
  document.querySelectorAll('.events-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadEvents(1);
}

const debouncedSearch = debounce((value) => { eventsState.search = value; loadEvents(1); }, 400);
