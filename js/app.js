// MacBrew Main Application Logic with i18n (English & Spanish)

import { CATEGORIES, APPS } from './data/apps.js';
import { PRESETS } from './data/presets.js';
import { APP_ICONS } from './data/icons.js';
import { TRANSLATIONS } from './i18n/translations.js';
import { generateOneLiner, generateUninstallOneLiner, generateBrewfile, generateInstallScript } from './utils/generator.js';

class MacBrewApp {
  constructor() {
    // Detect active page language ('en' or 'es')
    const htmlLang = document.documentElement.lang;
    this.lang = (htmlLang === 'es' || window.location.pathname.startsWith('/es')) ? 'es' : 'en';

    this.selectedAppIds = new Set();
    this.installedCaskIds = new Set();
    this.customApps = new Map();
    this.searchQuery = '';
    this.activePresetIds = new Set();
    this.activeTab = 'oneliner';
    this.currentMode = 'install'; // 'install' | 'uninstall'
    this.optZap = false;
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
    this.initNativeIntegration();
  }

  initNativeIntegration() {
    if (window.macbrewNative && window.macbrewNative.isNative) {
      document.body.classList.add('is-desktop-app');
      
      const installAppBtn = document.getElementById('install-app-btn');
      if (installAppBtn) {
        installAppBtn.style.display = 'none';
      }

      const directInstallBtn = document.getElementById('direct-install-btn');
      if (directInstallBtn) {
        directInstallBtn.classList.remove('hidden');
      }

      // Automatically fetch installed casks in Desktop app mode
      if (typeof window.macbrewNative.getInstalledCasks === 'function') {
        window.macbrewNative.getInstalledCasks().then(installedList => {
          if (Array.isArray(installedList) && installedList.length > 0) {
            this.parseInstalledInput(installedList.join('\n'), false);
          }
        }).catch(err => {
          console.warn('Could not auto-fetch installed casks:', err);
        });
      }

      window.macbrewNative.onBrewOutput((data) => {
        const terminalOutput = document.getElementById('terminal-output-content');
        if (!terminalOutput) return;

        if (data.type === 'stdout' || data.type === 'stderr') {
          terminalOutput.textContent += data.text;
        } else if (data.type === 'exit') {
          terminalOutput.textContent += `\n[Process completed with exit code ${data.code}]\n`;
        } else if (data.type === 'error') {
          terminalOutput.textContent += `\n[Error: ${data.text}]\n`;
        }

        const panel = document.getElementById('terminal-execution-panel');
        if (panel) panel.scrollTop = panel.scrollHeight;
      });
    }
  }

  executeNativeInstall() {
    if (!window.macbrewNative) return;

    const panel = document.getElementById('terminal-execution-panel');
    const content = document.getElementById('terminal-output-content');
    if (panel) panel.classList.remove('hidden');

    const selectedApps = this.getAllApps().filter(app => this.selectedAppIds.has(app.id));

    if (this.currentMode === 'uninstall') {
      if (content) content.textContent = '🗑️ Launching Homebrew uninstallation directly on your Mac...\n\n';
      const cmd = generateUninstallOneLiner(selectedApps, this.optZap);
      window.macbrewNative.executeBrew(cmd);
    } else {
      if (content) content.textContent = '🚀 Launching Homebrew installation directly on your Mac...\n\n';
      const cmd = generateInstallScript(selectedApps, this.scriptOptions);
      window.macbrewNative.executeBrew(cmd);
    }
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
          ${pName}
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
    let allApps = this.getAllApps();

    if (this.currentMode === 'uninstall') {
      allApps = allApps.filter(app => this.installedCaskIds.has(app.id));
      if (allApps.length === 0) {
        this.catalogEl.innerHTML = `
          <div class="empty-installed-state">
            <div class="empty-state-icon">📥</div>
            <h3>${this.lang === 'es' ? 'No se han detectado aplicaciones instaladas' : 'No installed apps detected'}</h3>
            <p>${this.lang === 'es' ? 'Haz clic en el botón "Importar Apps" arriba para pegar tus aplicaciones de tu Mac o abre la app de escritorio.' : 'Click "Import Apps" above to paste your installed Mac apps or launch the desktop application.'}</p>
            <button id="empty-import-trigger-btn" class="btn btn-primary">
              <span>${this.t('importAppsBtn')}</span>
            </button>
          </div>
        `;

        const triggerBtn = document.getElementById('empty-import-trigger-btn');
        if (triggerBtn) {
          triggerBtn.addEventListener('click', () => {
            const modal = document.getElementById('import-modal-overlay');
            if (modal) {
              modal.classList.remove('hidden');
              document.body.style.overflow = 'hidden';
            }
          });
        }
        return;
      }
    }

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

    categoriesToRender.push({
      id: 'installed',
      localizedName: this.lang === 'es' ? 'Otras Aplicaciones Instaladas' : 'Other Installed Packages',
      icon: '📦'
    });

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

    // Bottom Search Callout Card when browsing full catalog (hidden in Uninstall Mode)
    const bottomCalloutHtml = this.currentMode === 'uninstall' ? '' : `
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
            ${this.installedCaskIds.has(app.id) ? `<span class="badge-installed">${this.t('badgeInstalled')}</span>` : ''}
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
      const cmd = this.currentMode === 'uninstall'
        ? generateUninstallOneLiner(selectedApps, this.optZap)
        : generateOneLiner(selectedApps);
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
    ['autobrew', 'noquarantine', 'cleanup', 'upgrade', 'zap'].forEach(key => {
      const chk = document.getElementById(`opt-${key}`);
      if (chk) {
        chk.addEventListener('change', (e) => {
          if (key === 'zap') {
            this.optZap = e.target.checked;
          } else {
            this.scriptOptions[key === 'autobrew' ? 'autoBrew' : key === 'noquarantine' ? 'noQuarantine' : key] = e.target.checked;
          }
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

    // Direct Native Install Button
    const directInstallBtn = document.getElementById('direct-install-btn');
    if (directInstallBtn) {
      directInstallBtn.addEventListener('click', () => {
        this.executeNativeInstall();
      });
    }

    // Share Button Header
    if (this.shareBtnEl) {
      this.shareBtnEl.addEventListener('click', () => {
        this.openShareModal();
      });
    }

    // Share Button Floating Bar
    const shareSelectionBtn = document.getElementById('share-selection-btn');
    if (shareSelectionBtn) {
      shareSelectionBtn.addEventListener('click', () => {
        this.openShareModal();
      });
    }

    // Share Modal Close & Copy Events
    const closeShareBtn = document.getElementById('close-share-modal');
    const shareModalOverlay = document.getElementById('share-modal-overlay');
    if (closeShareBtn) {
      closeShareBtn.addEventListener('click', () => {
        this.closeShareModal();
      });
    }
    if (shareModalOverlay) {
      shareModalOverlay.addEventListener('click', (e) => {
        if (e.target === shareModalOverlay) {
          this.closeShareModal();
        }
      });
    }

    const copyShareUrlModalBtn = document.getElementById('copy-share-url-modal-btn');
    if (copyShareUrlModalBtn) {
      copyShareUrlModalBtn.addEventListener('click', () => {
        const input = document.getElementById('share-url-input');
        if (input) {
          input.select();
          this.copyToClipboard(input.value, this.t('toastShareCopied'));
        }
      });
    }

    const shareCopyCmdBtn = document.getElementById('share-copy-cmd-modal-btn');
    if (shareCopyCmdBtn) {
      shareCopyCmdBtn.addEventListener('click', () => {
        const selectedApps = this.getAllApps().filter(app => this.selectedAppIds.has(app.id));
        const cmd = generateOneLiner(selectedApps);
        this.copyToClipboard(cmd, this.t('toastCopied'));
      });
    }

    // Install Desktop App Modal Events (Web Only)
    const installAppBtn = document.getElementById('install-app-btn');
    const closeInstallAppModalBtn = document.getElementById('close-install-app-modal');
    const installAppModalOverlay = document.getElementById('install-app-modal-overlay');
    const copyBrewCaskCmdBtn = document.getElementById('copy-brew-cask-cmd-btn');

    if (installAppBtn) {
      installAppBtn.addEventListener('click', () => {
        if (installAppModalOverlay) {
          installAppModalOverlay.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      });
    }

    if (closeInstallAppModalBtn) {
      closeInstallAppModalBtn.addEventListener('click', () => {
        if (installAppModalOverlay) {
          installAppModalOverlay.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    }

    if (installAppModalOverlay) {
      installAppModalOverlay.addEventListener('click', (e) => {
        if (e.target === installAppModalOverlay) {
          installAppModalOverlay.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    }

    if (copyBrewCaskCmdBtn) {
      copyBrewCaskCmdBtn.addEventListener('click', () => {
        const input = document.getElementById('brew-install-cmd-input');
        if (input) {
          input.select();
          this.copyToClipboard(input.value, this.t('toastCopied'));
        }
      });
    }

    // Mode Switcher Toggle (Install vs Uninstall)
    const modeSwitcher = document.getElementById('mode-switcher');
    if (modeSwitcher) {
      modeSwitcher.addEventListener('click', (e) => {
        const btn = e.target.closest('.mode-btn');
        if (btn && btn.dataset.mode) {
          this.setMode(btn.dataset.mode);
        }
      });
    }

    // Import Installed Apps Modal Events
    const importAppsBtn = document.getElementById('import-apps-btn');
    const closeImportModalBtn = document.getElementById('close-import-modal');
    const importModalOverlay = document.getElementById('import-modal-overlay');
    const copyImportCmdBtn = document.getElementById('copy-import-cmd-btn');
    const pasteClipboardBtn = document.getElementById('paste-clipboard-btn');
    const applyImportBtn = document.getElementById('apply-import-btn');

    if (importAppsBtn) {
      importAppsBtn.addEventListener('click', () => {
        if (importModalOverlay) {
          importModalOverlay.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      });
    }

    if (closeImportModalBtn) {
      closeImportModalBtn.addEventListener('click', () => {
        if (importModalOverlay) {
          importModalOverlay.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    }

    if (importModalOverlay) {
      importModalOverlay.addEventListener('click', (e) => {
        if (e.target === importModalOverlay) {
          importModalOverlay.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    }

    if (copyImportCmdBtn) {
      copyImportCmdBtn.addEventListener('click', () => {
        const input = document.getElementById('import-cmd-input');
        if (input) {
          input.select();
          this.copyToClipboard(input.value, this.t('toastCopied'));
        }
      });
    }

    if (pasteClipboardBtn) {
      pasteClipboardBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          const textarea = document.getElementById('import-text-input');
          if (textarea) {
            textarea.value = text;
          }
          this.parseInstalledInput(text);
          if (importModalOverlay) {
            importModalOverlay.classList.add('hidden');
            document.body.style.overflow = '';
          }
        } catch (err) {
          this.showToast(this.lang === 'es' ? 'Permite el acceso al portapapeles o pega el texto manualmente' : 'Please allow clipboard permission or paste manually');
        }
      });
    }

    if (applyImportBtn) {
      applyImportBtn.addEventListener('click', () => {
        const textarea = document.getElementById('import-text-input');
        const text = textarea ? textarea.value : '';
        this.parseInstalledInput(text);
        if (importModalOverlay) {
          importModalOverlay.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    }
  }

  /**
   * Update Floating Bar and sync state
   */
  updateUIState() {
    const count = this.selectedAppIds.size;
    this.selectedCountEl.textContent = count;

    const openModalBtnSpan = document.querySelector('#open-modal-btn span');
    if (openModalBtnSpan) {
      openModalBtnSpan.textContent = this.currentMode === 'uninstall'
        ? this.t('getUninstaller')
        : this.t('getInstaller');
    }

    if (count > 0) {
      this.floatingBarEl.classList.remove('hidden');
      const pluralS = count > 1 ? (this.lang === 'es' ? 's' : 's') : '';
      this.summaryTitleEl.textContent = this.t('selectedAppsTitle', { count, s: pluralS });
      this.summarySubtitleEl.textContent = this.currentMode === 'uninstall'
        ? this.t('uninstallSelectedSub', { s: pluralS })
        : this.t('selectedAppsSub', { s: pluralS });
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
    const isUninstall = this.currentMode === 'uninstall';
    
    // Update Modal Title and Subtitle
    const titleEl = document.getElementById('modal-title-text');
    const subTitleEl = document.getElementById('modal-subtitle-text');
    if (titleEl) titleEl.textContent = isUninstall ? this.t('uninstallModalTitle') : this.t('modalTitle');
    if (subTitleEl) subTitleEl.textContent = isUninstall ? this.t('uninstallModalSubtitle') : this.t('modalSubtitle');

    const isDesktopApp = window.macbrewNative && window.macbrewNative.isNative;

    // Update Direct Execution Button text and style (ONLY for Desktop App mode)
    const directBtn = document.getElementById('direct-install-btn');
    if (directBtn) {
      if (isDesktopApp) {
        directBtn.classList.remove('hidden');
        const btnSpan = directBtn.querySelector('span');
        if (btnSpan) {
          btnSpan.textContent = isUninstall ? this.t('uninstallRunBtn') : this.t('directInstall');
        }
        directBtn.style.background = isUninstall
          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
          : '';
      } else {
        directBtn.classList.add('hidden');
      }
    }

    // Hide Terminal Execution Panel on Web
    const terminalPanel = document.getElementById('terminal-execution-panel');
    if (terminalPanel && !isDesktopApp) {
      terminalPanel.classList.add('hidden');
    }

    // Update Download Button text
    const downloadScriptBtnSpan = document.querySelector('#download-script-btn span');
    if (downloadScriptBtnSpan) {
      downloadScriptBtnSpan.textContent = isUninstall
        ? this.t('uninstallDownloadScript')
        : this.t('downloadScript');
    }

    // Update Terminal Output status
    const outputContent = document.getElementById('terminal-output-content');
    if (outputContent && !outputContent.textContent.includes('[Process')) {
      outputContent.textContent = isUninstall
        ? this.t('uninstallReadyStatus')
        : (this.lang === 'es' ? 'Listo para ejecutar la instalación de Homebrew...' : 'Ready to execute Homebrew installation...');
    }

    // Toggle Script Options visibility for Uninstall mode
    const optZapContainer = document.getElementById('opt-zap-container');
    const optAutoBrewContainer = document.getElementById('opt-autobrew-container');
    const optNoQuarantineContainer = document.getElementById('opt-noquarantine-container');
    const optUpgradeContainer = document.getElementById('opt-upgrade-container');

    if (optZapContainer) optZapContainer.style.display = isUninstall ? 'flex' : 'none';
    if (optAutoBrewContainer) optAutoBrewContainer.style.display = isUninstall ? 'none' : 'flex';
    if (optNoQuarantineContainer) optNoQuarantineContainer.style.display = isUninstall ? 'none' : 'flex';
    if (optUpgradeContainer) optUpgradeContainer.style.display = isUninstall ? 'none' : 'flex';

    if (isUninstall) {
      const uninstallCmd = generateUninstallOneLiner(selectedApps, this.optZap);
      document.getElementById('code-oneliner').textContent = uninstallCmd;
      document.getElementById('code-brewfile').textContent = uninstallCmd;
      document.getElementById('code-script').textContent = uninstallCmd;
    } else {
      document.getElementById('code-oneliner').textContent = generateOneLiner(selectedApps);
      document.getElementById('code-brewfile').textContent = generateBrewfile(selectedApps);
      document.getElementById('code-script').textContent = generateInstallScript(selectedApps, this.scriptOptions);
    }
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
   * Helper to render exact original app icon (CDN image, SVG vector, or symbol)
   */
  getAppIconHtml(app) {
    const symbol = app.symbol || '🍺';
    const svgIcon = APP_ICONS[app.id];

    if (app.icon && typeof app.icon === 'string' && app.icon.startsWith('http')) {
      const fallbackHtml = svgIcon || symbol;
      return `
        <img src="${app.icon}" class="share-tag-img" alt="${app.name}" loading="lazy"
          onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline-flex';">
        <span class="share-tag-svg-fallback" style="display:none;">${fallbackHtml}</span>
      `;
    } else if (svgIcon) {
      return `<span class="share-tag-svg">${svgIcon}</span>`;
    } else {
      return `<span class="share-tag-fallback">${symbol}</span>`;
    }
  }

  openShareModal() {
    this.syncStateToURL();
    const shareUrl = window.location.href;
    const selectedApps = this.getAllApps().filter(app => this.selectedAppIds.has(app.id));

    const input = document.getElementById('share-url-input');
    if (input) input.value = shareUrl;

    const countEl = document.getElementById('share-preview-count');
    if (countEl) {
      countEl.textContent = this.lang === 'es'
        ? `Aplicaciones Seleccionadas (${selectedApps.length}):`
        : `Selected Apps (${selectedApps.length}):`;
    }

    const tagsContainer = document.getElementById('share-apps-tags');
    if (tagsContainer) {
      if (selectedApps.length > 0) {
        tagsContainer.innerHTML = selectedApps.map(app => `
          <span class="share-app-tag">
            ${this.getAppIconHtml(app)}
            <span>${app.name}</span>
          </span>
        `).join('');
      } else {
        tagsContainer.innerHTML = `<span class="share-tag-empty">${this.lang === 'es' ? 'Todas las aplicaciones (Selección por defecto)' : 'All apps (Default setup)'}</span>`;
      }
    }

    const twitterBtn = document.getElementById('share-twitter-btn');
    if (twitterBtn) {
      const text = this.lang === 'es'
        ? '¡Mira mi selección de aplicaciones para Mac en MacBrew!'
        : 'Check out my custom Mac app setup generated with MacBrew!';
      twitterBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    }

    const whatsappBtn = document.getElementById('share-whatsapp-btn');
    if (whatsappBtn) {
      const text = this.lang === 'es'
        ? `Mira mi selección de apps para Mac en MacBrew: ${shareUrl}`
        : `Check out my custom Mac app setup generated with MacBrew: ${shareUrl}`;
      whatsappBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    }

    const shareModalOverlay = document.getElementById('share-modal-overlay');
    if (shareModalOverlay) {
      shareModalOverlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  closeShareModal() {
    const shareModalOverlay = document.getElementById('share-modal-overlay');
    if (shareModalOverlay) {
      shareModalOverlay.classList.add('hidden');
      if (this.modalOverlayEl.classList.contains('hidden')) {
        document.body.style.overflow = '';
      }
    }
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

  /**
   * Switch between Install Mode and Uninstall Mode
   */
  setMode(mode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    document.body.classList.toggle('mode-uninstall', mode === 'uninstall');

    const heroTitle = document.getElementById('hero-main-title');
    const heroSub = document.getElementById('hero-main-sub');

    if (heroTitle && heroSub) {
      if (mode === 'uninstall') {
        heroTitle.innerHTML = this.lang === 'es'
          ? 'Desinstala software de tu Mac en <span>bloque</span>'
          : 'Uninstall Mac software in <span>bulk</span>';
        heroSub.textContent = this.lang === 'es'
          ? 'Selecciona las aplicaciones instaladas que deseas eliminar y genera tu script de desinstalación de Homebrew en 1 clic.'
          : 'Select installed apps to generate your custom uninstallation script or execute via desktop app.';
      } else {
        heroTitle.innerHTML = this.lang === 'es'
          ? 'Instala todo tu software de Mac en <span>bloque</span>'
          : 'Install all your Mac software in <span>bulk</span>';
        heroSub.textContent = this.lang === 'es'
          ? 'Selecciona tus aplicaciones preferidas y obtén tu script ejecutable o Brewfile al instante usando Homebrew.'
          : 'Select your favorite apps and get your executable script or official Brewfile instantly using Homebrew.';
      }
    }

    const presetsWrapper = document.querySelector('.presets-wrapper');
    if (presetsWrapper) {
      presetsWrapper.style.display = mode === 'uninstall' ? 'none' : 'flex';
    }

    this.renderCatalog();
    this.updateUIState();
  }

  /**
   * Parse user terminal output / clipboard text to detect installed casks
   */
  parseInstalledInput(input, showToast = true) {
    if (!input || typeof input !== 'string') return;

    const rawTokens = input.split(/[\s,;\n\r]+/).map(t => t.trim()).filter(Boolean);
    if (rawTokens.length === 0) return;

    const allApps = this.getAllApps();
    const knownCaskMap = new Map();
    allApps.forEach(app => {
      knownCaskMap.set(app.id.toLowerCase(), app);
      if (app.caskName) knownCaskMap.set(app.caskName.toLowerCase(), app);
      if (app.brew) knownCaskMap.set(app.brew.toLowerCase(), app);
      if (app.name) knownCaskMap.set(app.name.toLowerCase(), app);
    });

    let detectedCount = 0;

    rawTokens.forEach(rawToken => {
      const token = rawToken.toLowerCase();
      // Ignore lines that look like terminal warnings, headers, or paths
      if (token.startsWith('==>') || token.startsWith('warning:') || token.includes('/') || token.startsWith('http')) return;

      if (knownCaskMap.has(token)) {
        const app = knownCaskMap.get(token);
        this.installedCaskIds.add(app.id);
        detectedCount++;
      } else {
        // Register dynamically as a custom installed cask package so it appears in catalog!
        const formattedName = rawToken
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const customApp = {
          id: token,
          name: formattedName,
          brew: token,
          caskName: token,
          type: 'cask',
          category: 'installed',
          description: {
            en: `Installed Homebrew package (${token})`,
            es: `Paquete Homebrew instalado (${token})`
          },
          icon: this.getFaviconUrlForCask(token),
          symbol: '📦',
          color: '#38bdf8'
        };

        this.customApps.set(token, customApp);
        this.installedCaskIds.add(token);
        detectedCount++;
      }
    });

    if (detectedCount > 0) {
      this.renderCatalog();
      if (showToast) {
        this.showToast(this.t('importSuccessToast', { count: detectedCount }));
      }
    } else if (showToast) {
      this.showToast(this.lang === 'es' ? 'No se detectaron aplicaciones coincidentes' : 'No matching apps detected');
    }
  }

  /**
   * Resolve real icon URL for imported Homebrew casks
   */
  getFaviconUrlForCask(token) {
    const domainMap = {
      'ghostty': 'ghostty.org',
      'macbrew': 'macbrew.app',
      'font-jetbrains-mono': 'jetbrains.com',
      'font-fira-code': 'github.com',
      'font-hack-nerd-font': 'nerdfonts.com',
      'vlc': 'videolan.org',
      'spotify': 'spotify.com',
      'discord': 'discord.com',
      'slack': 'slack.com',
      'raycast': 'raycast.com',
      'iterm2': 'iterm2.com',
      'warp': 'warp.dev',
      'postman': 'postman.com',
      'obsidian': 'obsidian.md',
      'transmission': 'transmissionbt.com',
      'rectangle': 'rectangleapp.com',
      'balena-etcher': 'balena.io',
      'steam': 'steampowered.com',
      'signal': 'signal.org',
      'telegram': 'telegram.org',
      'brave-browser': 'brave.com',
      'arc': 'arc.net',
      'firefox': 'firefox.com'
    };

    let domain = domainMap[token];
    if (!domain) {
      const cleanToken = token.replace(/^font-/, '').replace(/-font$/, '');
      domain = `${cleanToken}.com`;
    }

    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }
}

// Instantiate App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MacBrewApp();
});
