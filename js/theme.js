// MacBrew Global Floating Bottom-Right Theme Switcher (Dark / Light)

(function () {
  function getPreferredTheme() {
    const saved = localStorage.getItem('macbrew-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    const isLight = theme === 'light';
    if (isLight) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      if (document.body) document.body.classList.add('light');
      localStorage.setItem('macbrew-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      if (document.body) document.body.classList.remove('light');
      localStorage.setItem('macbrew-theme', 'dark');
    }
    updateButtons();
  }

  function updateButtons() {
    const isLight = document.documentElement.classList.contains('light') || (document.body && document.body.classList.contains('light'));
    const buttons = document.querySelectorAll('.floating-theme-toggle, .theme-toggle-btn, #theme-toggle-btn');
    
    buttons.forEach(btn => {
      btn.innerHTML = isLight
        ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      btn.setAttribute('aria-label', isLight ? 'Switch to Dark mode' : 'Switch to Light mode');
      btn.setAttribute('title', isLight ? 'Switch to Dark mode' : 'Switch to Light mode');
    });
  }

  function init() {
    const initialTheme = getPreferredTheme();
    applyTheme(initialTheme);
    updateButtons();

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.floating-theme-toggle, .theme-toggle-btn, #theme-toggle-btn');
      if (btn) {
        const isLight = document.documentElement.classList.contains('light');
        applyTheme(isLight ? 'dark' : 'light');
      }
    });
  }

  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', updateButtons);
})();
