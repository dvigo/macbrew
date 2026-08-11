// MacBrew Main Application Logic with i18n (English & Spanish)

import { CATEGORIES, APPS } from './data/apps.js';
import { PRESETS } from './data/presets.js';
import { APP_ICONS } from './data/icons.js';
import { TRANSLATIONS } from './i18n/translations.js';
import { generateOneLiner, generateBrewfile, generateInstallScript } from './utils/generator.js';

class MacBrewApp {
  constructor() {
    // Detect active page language ('en' or 'es')
    const htmlLang = document.documentElement.lang;
    this.lang = (htmlLang === 'es' || window.location.pathname.startsWith('/es')) ? 'es' : 'en';

    this.selectedAppIds = new Set();
    this.customApps = new Map();
    this.searchQuery = '';
    this.activePresetIds = new Set();
    this.activeTab = 'oneliner';
    this.brewApiResults = [];
    this.searchDebounceTimer = null;

    this.scriptOptions = {
      autoBrew: true,
      noQuarantine: true,
      cleanup: true,
      upgrade: false
    };

    // Cache DOM Elements
    this.catalogEl = document.getElementById('catalog');
    this.presetsContainerEl = document.getElementById('presets-container');
    this.searchInputEl = document.getElementById('search-input');
    this.clearSearchEl = document.getElementById('clear-search');
    this.floatingBarEl = document.getElementById('floating-bar');
    this.selectedCountEl = document.getElementById('selected-count');
    this.summaryTitleEl = document.getElementById('summary-title');
    this.summarySubtitleEl = document.getElementById('summary-subtitle');
    this.modalOverlayEl = document.getElementById('modal-overlay');
    this.toastContainerEl = document.getElementById('toast-container');
    this.shareBtnEl = document.getElementById('share-btn');

    this.init();
  }

  init() {
    this.initTheme();
    this.loadStateFromURL();
    this.renderPresets();
    this.renderCatalog();
    this.bindEvents();
    this.updateUIState();
  }

  initTheme() {
    const savedTheme = localStorage.getItem('macbrew-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    this.setTheme(savedTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const isLight = document.body.classList.contains('light');
        this.setTheme(isLight ? 'dark' : 'light');
      });
    }
  }

  setTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
      localStorage.setItem('macbrew-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
      localStorage.setItem('macbrew-theme', 'dark');
    }
    this.updateThemeButtonIcon();
  }

  updateThemeButtonIcon() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;
    const isLight = document.body.classList.contains('light');
    themeBtn.innerHTML = isLight
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> <span>Dark</span>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> <span>Light</span>`;
  }

  /**
   * Helper translation function
   */
  t(key, params = {}) {
    const dict = TRANSLATIONS[this.lang] || TRANSLATIONS.en;
    let str = dict[key] || TRANSLATIONS.en[key] || key;
    
    Object.keys(params).forEach(pKey => {
      str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), params[pKey]);
    });
    return str;
  }

  /**
   * Returns merged array of curated APPS and user custom added apps
   */
  getAllApps() {
    return [...APPS, ...Array.from(this.customApps.values())];
  }

  /**
   * Add custom Homebrew formula or cask package
   */
  addCustomPackage(brewName, type = 'formula', description = null) {
    const cleanName = brewName.trim().toLowerCase();
    if (!cleanName) return;

    const id = `custom-${cleanName.replace(/[^a-z0-9-]/g, '')}`;
    const descText = description || (this.lang === 'es' ? 'Paquete de Homebrew personalizado' : 'Custom Homebrew package');

    const customApp = {
      id,
      name: cleanName,
      type,
      brew: cleanName,
      category: 'custom',
      description: { en: descText, es: descText },
      color: type === 'cask' ? '#38bdf8' : '#10b981',
      symbol: type === 'cask' ? '🖥️' : '⚙️'
    };

    this.customApps.set(id, customApp);
    this.selectedAppIds.add(id);
    this.showToast(this.lang === 'es' ? `Paquete "${cleanName}" añadido` : `Package "${cleanName}" added`);
    this.updateUIState();
    this.renderCatalog();
  }

  /**
   * Load initial app selections from URL query string
   */
  loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    const appsParam = params.get('apps');
    if (appsParam) {
      const ids = appsParam.split(',').map(id => id.trim());
      ids.forEach(id => {
        if (APPS.some(app => app.id === id)) {
          this.selectedAppIds.add(id);
        } else if (id.startsWith('cask:') || id.startsWith('brew:')) {
          const parts = id.split(':');
          const type = parts[0] === 'cask' ? 'cask' : 'formula';
          const name = parts[1];
          this.addCustomPackage(name, type, 'Added via share link');
        }
      });
    }
  }

  /**
   * Sync current selection state to URL query string
   */
  syncStateToURL() {
    const url = new URL(window.location.href);
    if (this.selectedAppIds.size > 0) {
      const serialized = Array.from(this.selectedAppIds).map(id => {
        if (id.startsWith('custom-')) {
          const app = this.customApps.get(id);
          return app ? `${app.type}:${app.brew}` : id;
        }
        return id;
      });
      url.searchParams.set('apps', serialized.join(','));
    } else {
      url.searchParams.delete('apps');
    }
    window.history.replaceState({}, '', url.toString());
  }

  /**
   * Render Preset Pill Buttons (Multiple Active Presets Supported)
   */
  renderPresets() {
    this.presetsContainerEl.innerHTML = PRESETS.map(preset => {
      const pName = typeof preset.name === 'object' ? (preset.name[this.lang] || preset.name.en) : preset.name;
      const pDesc = typeof preset.description === 'object' ? (preset.description[this.lang] || preset.description.en) : preset.description;
      const isActive = this.activePresetIds.has(preset.id) || (preset.appIds.length > 0 && preset.appIds.every(id => this.selectedAppIds.has(id)));

      return `
        <button class="preset-pill ${isActive ? 'active' : ''}" data-preset-id="${preset.id}" title="${pDesc}">
          <span class="preset-check ${isActive ? 'visible' : ''}">✓</span>
          <span>${pName}</span>
        </button>
      `;
    }).join('');
  }

  /**
   * Search Homebrew official API
   */
  async searchHomebrewAPI(query) {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery || cleanQuery.length < 2) {
      this.brewApiResults = [];
      this.renderCatalog();
      return;
    }

    try {
      const caskRes = await fetch(`https://formulae.brew.sh/api/cask/${cleanQuery}.json`).catch(() => null);
      const formulaRes = await fetch(`https://formulae.brew.sh/api/formula/${cleanQuery}.json`).catch(() => null);

      const results = [];
      if (caskRes && caskRes.ok) {
        const data = await caskRes.json();
        results.push({
          brew: data.token,
          name: (data.name && data.name[0]) || data.token,
          type: 'cask',
          desc: data.desc || (this.lang === 'es' ? 'Cask oficial de Homebrew' : 'Official Homebrew Cask')
        });
      }
      if (formulaRes && formulaRes.ok) {
        const data = await formulaRes.json();
        results.push({
          brew: data.name,
          name: data.name,
          type: 'formula',
          desc: data.desc || (this.lang === 'es' ? 'Formula oficial de Homebrew' : 'Official Homebrew Formula')
        });
      }

      this.brewApiResults = results;
    } catch (e) {
      this.brewApiResults = [];
    }

    this.renderCatalog();
  }

  /**
   * Render Main Catalog grouped by categories + Compact Instant Search
   */
  renderCatalog() {
    const query = this.searchQuery.toLowerCase().trim();
    const allApps = this.getAllApps();

    // Filter apps by search
    const filteredApps = allApps.filter(app => {
      if (!query) return true;
      const desc = typeof app.description === 'object' ? (app.description[this.lang] || app.description.en) : app.description;
      return (
        app.name.toLowerCase().includes(query) ||
        app.brew.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query)
      );
    });

    const categoriesToRender = CATEGORIES.map(cat => ({
      ...cat,
      localizedName: typeof cat.name === 'object' ? (cat.name[this.lang] || cat.name.en) : cat.name
    }));

    if (this.customApps.size > 0) {
      const customCatName = this.t('categories.custom');
      categoriesToRender.unshift({ id: 'custom', localizedName: customCatName, icon: '⭐' });
    }

    // Build Universal Homebrew Search / Custom Add card HTML
    const universalCardHtml = `
      <section class="category-group universal-search-section">
        <div class="universal-search-card">
          <div class="universal-card-header">
            <span class="universal-icon">🌐</span>
            <div>
              <h3>${this.t('universalTitle')}</h3>
              <p>${this.t('universalSubtitle')}</p>
            </div>
          </div>

          ${this.brewApiResults.length > 0 ? `
            <div class="brew-api-results">
              <span class="api-results-label">${this.t('apiResultLabel')}</span>
              <div class="apps-grid">
                ${this.brewApiResults.map(res => `
                  <div class="app-card api-result-card" data-api-brew="${res.brew}" data-api-type="${res.type}" data-api-desc="${res.desc}">
                    <div class="app-icon-wrapper">
                      <div class="app-icon-fallback" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
                        ${res.type === 'cask' ? '🖥️' : '⚙️'}
                      </div>
                    </div>
                    <div class="app-info">
                      <div class="app-name-row">
                        <h3 class="app-name">${res.brew}</h3>
                        <span class="app-type-badge ${res.type === 'cask' ? 'type-cask' : 'type-formula'}">${res.type}</span>
                      </div>
                      <p class="app-desc">${res.desc}</p>
                    </div>
                    <button class="btn btn-primary btn-sm add-api-pkg-btn">
                      ${this.t('addBtn')}
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="custom-add-box">
            <div class="custom-input-group">
              <input type="text" id="custom-pkg-input" value="${query}" placeholder="${this.t('calloutPlaceholder')}">
              <button id="add-as-formula-btn" class="btn btn-secondary">
                <span>${this.t('addFormulaBtn')}</span>
              </button>
              <button id="add-as-cask-btn" class="btn btn-outline">
                <span>${this.t('addCaskBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    `;

    // CASE 1: Searching and NO matches found in curated list -> Show Universal Search FIRST at top!
    if (query && filteredApps.length === 0) {
      this.catalogEl.innerHTML = `
        <div class="search-top-banner">
          <h2>🔍 "${query}"</h2>
        </div>
        ${universalCardHtml}
      `;
      return;
    }

    // CASE 2: Normal catalog rendering or search matches
    let catalogHtml = categoriesToRender.map(category => {
      const categoryApps = filteredApps.filter(app => app.category === category.id);
      if (categoryApps.length === 0) return '';

      const allCategorySelected = categoryApps.every(app => this.selectedAppIds.has(app.id));

      return `
        <section class="category-group" id="cat-${category.id}">
          <div class="category-header">
            <h2 class="category-title">
              <span class="category-icon">${category.icon}</span>
              <span>${category.localizedName}</span>
            </h2>
            <button class="select-all-btn" data-category-id="${category.id}">
              ${allCategorySelected ? this.t('deselectAll') : this.t('selectAll')}
            </button>
          </div>

          <div class="apps-grid">
            ${categoryApps.map(app => this.renderAppCard(app)).join('')}
          </div>
        </section>
      `;
    }).join('');

    // Bottom Search Callout Card when browsing full catalog
    const bottomCalloutHtml = `
      <section class="bottom-search-callout">
        <div class="callout-glass-card">
          <div class="callout-content">
            <div class="callout-icon-badge">💡</div>
            <div class="callout-text-group">
              <h3>${this.t('calloutTitle')}</h3>
              <p>${this.t('calloutDesc')}</p>
            </div>
          </div>
          <div class="callout-action-group">
            <div class="callout-search-inline">
              <input type="text" id="callout-inline-search" placeholder="${this.t('calloutPlaceholder')}" autocomplete="off">
              <button id="callout-search-btn" class="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <span>${this.t('calloutSearchBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    `;

    if (query) {
      catalogHtml = catalogHtml + universalCardHtml;
    } else {
      catalogHtml = catalogHtml + bottomCalloutHtml;
    }

    this.catalogEl.innerHTML = catalogHtml;
  }

  /**
   * Render individual App Card HTML with official logos
   */
  renderAppCard(app) {
    const isSelected = this.selectedAppIds.has(app.id);
    const color = app.color || '#38bdf8';
    const symbol = app.symbol || app.name.charAt(0);
    const descText = typeof app.description === 'object' ? (app.description[this.lang] || app.description.en) : app.description;

    let iconContent = '';
    if (app.icon && app.icon.startsWith('http')) {
      iconContent = `
        <img src="${app.icon}" alt="${app.name}" class="app-icon" loading="lazy" 
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="app-icon-fallback" style="display:none; background: linear-gradient(135deg, ${color}25, ${color}45); border: 1px solid ${color}55; color: ${color}; font-size: 1.15rem;">
          ${APP_ICONS[app.id] || symbol}
        </div>
      `;
    } else if (APP_ICONS[app.id]) {
      iconContent = APP_ICONS[app.id];
    } else {
      iconContent = `
        <div class="app-icon-fallback" style="background: linear-gradient(135deg, ${color}25, ${color}45); border: 1px solid ${color}55; color: ${color}; font-size: 1.15rem;">
          ${app.icon || symbol}
        </div>
      `;
    }

    return `
      <div class="app-card ${isSelected ? 'selected' : ''}" data-app-id="${app.id}" style="--app-brand-color: ${color};">
        <div class="app-icon-wrapper">
          ${iconContent}
        </div>
        <div class="app-info">
          <div class="app-name-row">
            <h3 class="app-name">${app.name}</h3>
            <span class="app-type-badge ${app.type === 'cask' ? 'type-cask' : 'type-formula'}">${app.type}</span>
          </div>
          <p class="app-desc">${descText}</p>
        </div>
        <div class="checkbox-custom" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
    `;
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    // Search input
    this.searchInputEl.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.clearSearchEl.classList.toggle('hidden', !this.searchQuery);
      this.renderCatalog();

      clearTimeout(this.searchDebounceTimer);
      if (this.searchQuery.length >= 2) {
        this.searchDebounceTimer = setTimeout(() => {
          this.searchHomebrewAPI(this.searchQuery);
        }, 400);
      } else {
        this.brewApiResults = [];
      }
    });

    this.clearSearchEl.addEventListener('click', () => {
      this.searchInputEl.value = '';
      this.searchQuery = '';
      this.brewApiResults = [];
      this.clearSearchEl.classList.add('hidden');
      this.renderCatalog();
    });

    // Catalog delegation
    this.catalogEl.addEventListener('click', (e) => {
      // Bottom Callout search trigger
      if (e.target.closest('#callout-search-btn')) {
        const inlineInput = document.getElementById('callout-inline-search');
        const queryText = inlineInput ? inlineInput.value.trim() : '';
        
        if (queryText) {
          this.searchInputEl.value = queryText;
          this.searchQuery = queryText;
          this.clearSearchEl.classList.remove('hidden');
          this.renderCatalog();
          this.searchHomebrewAPI(queryText);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          this.searchInputEl.focus();
          this.searchInputEl.parentElement.classList.add('search-highlight');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            this.searchInputEl.parentElement.classList.remove('search-highlight');
          }, 1500);
        }
        return;
      }

      // Add custom formula
      if (e.target.closest('#add-as-formula-btn')) {
        const input = document.getElementById('custom-pkg-input');
        if (input && input.value) {
          this.addCustomPackage(input.value, 'formula');
        }
        return;
      }

      // Add custom cask
      if (e.target.closest('#add-as-cask-btn')) {
        const input = document.getElementById('custom-pkg-input');
        if (input && input.value) {
          this.addCustomPackage(input.value, 'cask');
        }
        return;
      }

      // Add from Homebrew API Result Card
      const apiCardBtn = e.target.closest('.add-api-pkg-btn');
      if (apiCardBtn) {
        const card = e.target.closest('.api-result-card');
        if (card) {
          const brew = card.dataset.apiBrew;
          const type = card.dataset.apiType;
          const desc = card.dataset.apiDesc;
          this.addCustomPackage(brew, type, desc);
        }
        return;
      }

      // Select All Category
      const selectAllBtn = e.target.closest('.select-all-btn');
      if (selectAllBtn) {
        const catId = selectAllBtn.dataset.categoryId;
        const catApps = this.getAllApps().filter(app => app.category === catId);
        const allSelected = catApps.every(app => this.selectedAppIds.has(app.id));

        if (allSelected) {
          catApps.forEach(app => this.selectedAppIds.delete(app.id));
        } else {
          catApps.forEach(app => this.selectedAppIds.add(app.id));
        }

        this.renderCatalog();
        this.updateUIState();
        return;
      }

      // Regular App Card Toggle
      const card = e.target.closest('.app-card');
      if (card && !card.classList.contains('api-result-card')) {
        const appId = card.dataset.appId;
        if (this.selectedAppIds.has(appId)) {
          this.selectedAppIds.delete(appId);
        } else {
          this.selectedAppIds.add(appId);
        }
        this.renderPresets();
        this.renderCatalog();
        this.updateUIState();
      }
    });

    // Preset pills click (Multiple presets selection)
    this.presetsContainerEl.addEventListener('click', (e) => {
      const pill = e.target.closest('.preset-pill');
      if (!pill) return;

      const presetId = pill.dataset.presetId;
      const preset = PRESETS.find(p => p.id === presetId);
      if (!preset) return;

      if (this.activePresetIds.has(preset.id)) {
        this.activePresetIds.delete(preset.id);
        preset.appIds.forEach(id => {
          const neededByOther = Array.from(this.activePresetIds).some(otherId => {
            const p = PRESETS.find(pr => pr.id === otherId);
            return p && p.appIds.includes(id);
          });
          if (!neededByOther) {
            this.selectedAppIds.delete(id);
          }
        });
      } else {
        this.activePresetIds.add(preset.id);
        preset.appIds.forEach(id => this.selectedAppIds.add(id));
      }

      this.renderPresets();
      this.renderCatalog();
      this.updateUIState();
    });

    // Floating Bar Quick Copy Command
    document.getElementById('quick-copy-cmd').addEventListener('click', () => {
      const selectedApps = this.getAllApps().filter(app => this.selectedAppIds.has(app.id));
      const cmd = generateOneLiner(selectedApps);
      this.copyToClipboard(cmd, this.t('toastCopied'));
    });

    // Open Modal
    document.getElementById('open-modal-btn').addEventListener('click', () => {
      this.openModal();
    });

    // Close Modal
    document.getElementById('close-modal-btn').addEventListener('click', () => {
      this.closeModal();
    });

    this.modalOverlayEl.addEventListener('click', (e) => {
      if (e.target === this.modalOverlayEl) {
        this.closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modalOverlayEl.classList.contains('hidden')) {
        this.closeModal();
      }
    });

    // Modal Tabs Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.target.dataset.tab;
        this.activeTab = targetTab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.add('active');
      });
    });

    // Modal Copy Buttons
    document.querySelectorAll('.copy-code-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.currentTarget.dataset.target;
        const codeText = document.getElementById(targetId).textContent;
        this.copyToClipboard(codeText, this.t('toastCopied'));
      });
    });

    // Script Options Checkboxes
    ['autobrew', 'noquarantine', 'cleanup', 'upgrade'].forEach(key => {
      const chk = document.getElementById(`opt-${key}`);
      if (chk) {
        chk.addEventListener('change', (e) => {
          this.scriptOptions[key === 'autobrew' ? 'autoBrew' : key === 'noquarantine' ? 'noQuarantine' : key] = e.target.checked;
          this.updateModalContent();
        });
      }
    });

    // Download Brewfile
    document.getElementById('download-brewfile-btn').addEventListener('click', () => {
      const selectedApps = this.getAllApps().filter(app => this.selectedAppIds.has(app.id));
      const content = generateBrewfile(selectedApps);
      this.downloadFile('Brewfile', content);
    });

    // Download Script
    document.getElementById('download-script-btn').addEventListener('click', () => {
      const selectedApps = this.getAllApps().filter(app => this.selectedAppIds.has(app.id));
      const content = generateInstallScript(selectedApps, this.scriptOptions);
      this.downloadFile('install.sh', content);
    });

    // Share Button
    this.shareBtnEl.addEventListener('click', () => {
      this.syncStateToURL();
      this.copyToClipboard(window.location.href, this.t('toastShareCopied'));
    });
  }

  /**
   * Update Floating Bar and sync state
   */
  updateUIState() {
    const count = this.selectedAppIds.size;
    this.selectedCountEl.textContent = count;

    if (count > 0) {
      this.floatingBarEl.classList.remove('hidden');
      const pluralS = count > 1 ? (this.lang === 'es' ? 's' : 's') : '';
      this.summaryTitleEl.textContent = this.t('selectedAppsTitle', { count, s: pluralS });
      this.summarySubtitleEl.textContent = this.t('selectedAppsSub', { s: pluralS });
    } else {
      this.floatingBarEl.classList.add('hidden');
    }

    this.syncStateToURL();
    this.updateModalContent();
  }

  /**
   * Render updated modal contents
   */
  updateModalContent() {
    const selectedApps = this.getAllApps().filter(app => this.selectedAppIds.has(app.id));
    
    document.getElementById('code-oneliner').textContent = generateOneLiner(selectedApps);
    document.getElementById('code-brewfile').textContent = generateBrewfile(selectedApps);
    document.getElementById('code-script').textContent = generateInstallScript(selectedApps, this.scriptOptions);
  }

  openModal() {
    this.updateModalContent();
    this.modalOverlayEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modalOverlayEl.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /**
   * Copy text to clipboard and show toast
   */
  async copyToClipboard(text, message = 'Copied to clipboard') {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast(message);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast(message);
    }
  }

  /**
   * Download generated file in browser
   */
  downloadFile(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    this.showToast(this.t('toastDownloaded', { file: filename }));
  }

  /**
   * Toast notification display
   */
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span class="toast-icon">✓</span>
      <span>${message}</span>
    `;
    this.toastContainerEl.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }
}

// Instantiate App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MacBrewApp();
});
