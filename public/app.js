(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const privateDialog = document.getElementById('privateDialog');
  const privateCard = document.getElementById('privateCard');
  const privateSideButton = document.getElementById('privateSideButton');
  const privateSideButton2 = document.getElementById('privateSideButton2');
  const privateSideButton3 = document.getElementById('privateSideButton3');
  const privateSideButtonDevices = document.getElementById('privateSideButtonDevices');
  const privateSideButtonWorks = document.getElementById('privateSideButtonWorks');
  const projectList = document.getElementById('projectList');
  const projectEmpty = document.getElementById('projectEmpty');
  let privateUnlocked = false;
  const dialogClose = document.getElementById('dialogClose');
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('passwordInput');
  const loginMessage = document.getElementById('loginMessage');
  const showPassword = document.getElementById('showPassword');
  const navLinks = [...document.querySelectorAll('a[href^="#"]')];
  const androidMode = document.getElementById('androidMode');
  const iosMode = document.getElementById('iosMode');
  const platformTransition = document.getElementById('platformTransition');

  const savedTheme = localStorage.getItem('aswin-theme');
  const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(savedTheme || 'light', false);

  const savedPlatform = localStorage.getItem('aswin-platform') || 'android';
  setPlatform(savedPlatform, false);

  function setTheme(theme, persist = true) {
    root.classList.toggle('dark', theme === 'dark');
    if (persist) localStorage.setItem('aswin-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggle.title = theme === 'dark' ? 'Light mode' : 'Dark mode';
  }
  themeToggle.addEventListener('click', () => setTheme(root.classList.contains('dark') ? 'light' : 'dark'));

  function setPlatform(mode, persist = true, animate = false) {
    const ios = mode === 'ios';
    if (animate && platformTransition) {
      platformTransition.classList.remove('run');
      void platformTransition.offsetWidth;
      platformTransition.classList.add('run');
      window.setTimeout(() => platformTransition.classList.remove('run'), 720);
    }
    root.classList.toggle('ios-mode', ios);
    androidMode.classList.toggle('active', !ios);
    iosMode.classList.toggle('active', ios);
    androidMode.setAttribute('aria-pressed', String(!ios));
    iosMode.setAttribute('aria-pressed', String(ios));
    if (persist) localStorage.setItem('aswin-platform', mode);
  }
  androidMode.addEventListener('click', () => setPlatform('android', true, true));
  iosMode.addEventListener('click', () => setPlatform('ios', true, true));

  function openPrivate() {
    loginMessage.textContent = '';
    passwordInput.value = '';
    if (typeof privateDialog.showModal === 'function') privateDialog.showModal();
    else privateDialog.setAttribute('open', '');
    setTimeout(() => passwordInput.focus(), 80);
  }
  [privateCard, privateSideButton, privateSideButton2, privateSideButton3, privateSideButtonDevices, privateSideButtonWorks].filter(Boolean).forEach(el => el.addEventListener('click', openPrivate));
  dialogClose.addEventListener('click', () => privateDialog.close());
  privateDialog.addEventListener('click', e => { if (e.target === privateDialog) privateDialog.close(); });
  showPassword.addEventListener('click', () => {
    const visible = passwordInput.type === 'text';
    passwordInput.type = visible ? 'password' : 'text';
    showPassword.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMessage.textContent = 'Checking…';
    try {
      const res = await fetch('/api/self-hosted/login', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({password:passwordInput.value}) });
      const data = await res.json();
      if (!res.ok) { loginMessage.textContent = data.message || 'That password didn’t work.'; return; }
      const projects = await fetch('/api/self-hosted/projects');
      if (!projects.ok) { loginMessage.textContent = 'Unlocked, but the project list could not be loaded.'; return; }
      const projectData = await projects.json();
      privateUnlocked = true;
      renderProjects(projectData.projects || []);
      privateDialog.close();
      location.hash = '#self-hosted';
    } catch { loginMessage.textContent = 'Could not reach the private area. Try again.'; }
  });

  function route() {
    const hash = location.hash || '#home';
    if (hash === '#self-hosted' && !privateUnlocked) {
      location.hash = '#home';
      openPrivate();
      return;
    }
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const target = document.querySelector(hash);
    (target || document.querySelector('#home')).classList.add('active');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  const icons = {
    gdrive: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#0F9D58" d="M17.1 7h13.8l10.5 18.2-6.9 12H20.7l6.9-12L17.1 7Z"/><path fill="#4285F4" d="M17.1 7 6.6 25.2l6.9 12h13.8l6.9-12L17.1 7Z" opacity=".98"/><path fill="#F4B400" d="M6.6 25.2h20.7l-6.9 12H13.5l-6.9-12Z"/></svg>',
    tv: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="10" width="38" height="28" rx="8" fill="none" stroke="currentColor" stroke-width="3"/><path d="m17 6 7 7 7-7M14 32h20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    vpn: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5 39 11v10c0 10.2-6.2 17.8-15 22C15.2 38.8 9 31.2 9 21V11l15-6Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M15 24h18M24 15v18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    torrent: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="3"/><path d="M16 17h16M16 24h16M16 31h10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="m31 29 5 5-5 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ai: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7c3.6 0 5.9 2.3 7 5.2 3.6-.8 6.9.6 8.4 3.3 1.8 3.1.7 6.1-1.8 8.1 2.5 2.1 3.6 5.1 1.8 8.2-1.5 2.7-4.8 4.1-8.4 3.3-1.1 2.9-3.4 5.2-7 5.2s-5.9-2.3-7-5.2c-3.6.8-6.9-.6-8.4-3.3-1.8-3.1-.7-6.1 1.8-8.2-2.5-2-3.6-5-1.8-8.1 1.5-2.7 4.8-4.1 8.4-3.3C18.1 9.3 20.4 7 24 7Z" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="18" cy="24" r="2" fill="currentColor"/><circle cx="30" cy="24" r="2" fill="currentColor"/><path d="M19 30c3 2 7 2 10 0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
    book: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 9c7-3 13-2 16 2v28c-3-4-9-5-16-2V9ZM40 9c-7-3-13-2-16 2v28c3-4 9-5 16-2V9Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
    stremio: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="currentColor"/><path d="M19 14v20l16-10-16-10Z" fill="var(--surface-solid)"/></svg>'
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  }

  function renderProjects(projects) {
    if (!projectList) return;
    projectList.innerHTML = '';
    projectEmpty.hidden = projects.length > 0;
    projects.forEach((project, index) => {
      const link = document.createElement('a');
      link.href = project.link;
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
      link.className = `project-card project-${project.icon || 'default'}`;
      link.style.setProperty('--project-delay', `${index * 45}ms`);
      link.innerHTML = `<span class="social-avatar project-avatar" aria-hidden="true">${icons[project.icon] || icons.book}</span><span><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.description)}</small></span><span>↗</span>`;
      projectList.appendChild(link);
    });
  }

  async function restorePrivateSession() {
    try {
      const res = await fetch('/api/self-hosted/status');
      const data = await res.json();
      if (!data.authenticated) return;
      const projects = await fetch('/api/self-hosted/projects');
      if (!projects.ok) return;
      const payload = await projects.json();
      privateUnlocked = true;
      renderProjects(payload.projects || []);
      if (location.hash === '#self-hosted') route();
    } catch {}
  }

  window.addEventListener('hashchange', route);
  navLinks.forEach(link => link.addEventListener('click', () => setTimeout(route, 0)));
  route();
  restorePrivateSession();
})();

// Expressive touch/pointer response: cards subtly tilt toward the finger/cursor.
document.querySelectorAll('.expressive-card').forEach(card => {
  const reset = () => {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.classList.remove('is-pressed');
  };
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    card.style.setProperty('--rx', `${(-y * 4).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${(x * 5).toFixed(2)}deg`);
  });
  card.addEventListener('pointerleave', reset);
  card.addEventListener('pointerdown', () => card.classList.add('is-pressed'));
  card.addEventListener('pointerup', () => setTimeout(() => card.classList.remove('is-pressed'), 110));
  card.addEventListener('pointercancel', reset);
});
