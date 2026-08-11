// MacBrew Main Application Logic

import { CATEGORIES, APPS } from './data/apps.js';
import { PRESETS } from './data/presets.js';
import { APP_ICONS } from './data/icons.js';
import { generateOneLiner, generateBrewfile, generateInstallScript } from './utils/generator.js';

class MacBrewApp {
  constructor() {
    this.selectedAppIds = new Set();
    this.customApps = new Map(); // Store user-added custom Homebrew packages
    this.searchQuery = '';
    this.activePreset = null;
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
    this.loadStateFromURL();
    this.renderPresets();
    this.renderCatalog();
    this.bindEvents();
    this.updateUIState();
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
  addCustomPackage(brewName, type = 'formula', description = 'Paquete de Homebrew personalizado') {
    const cleanName = brewName.trim().toLowerCase();
    if (!cleanName) return;

    const id = `custom-${cleanName.replace(/[^a-z0-9-]/g, '')}`;
    const customApp = {
      id,
      name: cleanName,
      type,
      brew: cleanName,
      category: 'custom',
      description,
      color: type === 'cask' ? '#38bdf8' : '#10b981',
      symbol: type === 'cask' ? '🖥️' : '⚙️'
    };

    this.customApps.set(id, customApp);
    this.selectedAppIds.add(id);
    this.showToast(`Paquete "${cleanName}" añadido como ${type}`);
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
          // Format custom: "cask:vlc" or "brew:ffmpeg"
          const parts = id.split(':');
          const type = parts[0] === 'cask' ? 'cask' : 'formula';
          const name = parts[1];
          this.addCustomPackage(name, type, 'Añadido desde enlace compartido');
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
   * Render Preset Pill Buttons
   */
  renderPresets() {
    this.presetsContainerEl.innerHTML = PRESETS.map(preset => `
      <button class="preset-pill ${this.activePreset === preset.id ? 'active' : ''}" data-preset-id="${preset.id}" title="${preset.description}">
        ${preset.name}
      </button>
    `).join('');
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
          desc: data.desc || 'Cask oficial de Homebrew'
        });
      }
      if (formulaRes && formulaRes.ok) {
        const data = await formulaRes.json();
        results.push({
          brew: data.name,
          name: data.name,
          type: 'formula',
          desc: data.desc || 'Formula oficial de Homebrew'
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
      return (
        app.name.toLowerCase().includes(query) ||
        app.brew.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query)
      );
    });

    const categoriesToRender = [...CATEGORIES];
    if (this.customApps.size > 0) {
      categoriesToRender.unshift({ id: 'custom', name: 'Paquetes Personalizados de Homebrew', icon: '⭐' });
    }

    // Build Universal Homebrew Search / Custom Add card HTML
    const universalCardHtml = `
      <section class="category-group universal-search-section">
        <div class="universal-search-card">
          <div class="universal-card-header">
            <span class="universal-icon">🌐</span>
            <div>
              <h3>Buscar o añadir cualquier paquete de Homebrew (11,000+ disponibles)</h3>
              <p>Si no encuentras el paquete en el catálogo destacado, puedes añadirlo por su nombre en Homebrew (ej: <code>ffmpeg</code>, <code>neovim</code>, <code>htop</code>, <code>tmux</code>, <code>nvm</code>).</p>
            </div>
          </div>

          ${this.brewApiResults.length > 0 ? `
            <div class="brew-api-results">
              <span class="api-results-label">✓ Encontrado en la API oficial de Homebrew:</span>
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
                      + Añadir
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="custom-add-box">
            <div class="custom-input-group">
              <input type="text" id="custom-pkg-input" value="${query}" placeholder="Nombre del paquete (ej: ffmpeg, neovim, htop)...">
              <button id="add-as-formula-btn" class="btn btn-secondary">
                <span>+ Añadir Formula</span>
              </button>
              <button id="add-as-cask-btn" class="btn btn-outline">
                <span>+ Añadir Cask</span>
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
          <h2>🔍 "${query}" no está en el catálogo destacado</h2>
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
              <span>${category.name}</span>
            </h2>
            <button class="select-all-btn" data-category-id="${category.id}">
              ${allCategorySelected ? 'Desmarcar categoría' : 'Seleccionar categoría'}
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
              <h3>¿No encuentras lo que buscas en el catálogo?</h3>
              <p>MacBrew puede instalar <strong>cualquier aplicación o herramienta de Homebrew (11,000+ paquetes disponibles)</strong>. Prueba a buscar por su nombre.</p>
            </div>
          </div>
          <div class="callout-action-group">
            <div class="callout-search-inline">
              <input type="text" id="callout-inline-search" placeholder="Escribe el nombre de la app (ej: ffmpeg, htop, neovim)..." autocomplete="off">
              <button id="callout-search-btn" class="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <span>Probar Buscador</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    `;

    // If searching, append compact universal card below matching results
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
          <p class="app-desc">${app.description}</p>
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
        this.activePreset = null;
        this.renderPresets();
        this.renderCatalog();
        this.updateUIState();
      }
    });

    // Preset pills click
    this.presetsContainerEl.addEventListener('click', (e) => {
      const pill = e.target.closest('.preset-pill');
      if (!pill) return;

      const presetId = pill.dataset.presetId;
      const preset = PRESETS.find(p => p.id === presetId);
      if (!preset) return;

      if (this.activePreset === presetId) {
        this.activePreset = null;
        preset.appIds.forEach(id => this.selectedAppIds.delete(id));
      } else {
        this.activePreset = presetId;
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
      this.copyToClipboard(cmd, '¡Comando copiado al portapapeles!');
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
        this.copyToClipboard(codeText, '¡Código copiado al portapapeles!');
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
      this.copyToClipboard(window.location.href, '¡Enlace de selección copiado para compartir!');
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
      this.summaryTitleEl.textContent = `${count} paquete${count > 1 ? 's' : ''} seleccionado${count > 1 ? 's' : ''}`;
      this.summarySubtitleEl.textContent = `Listo${count > 1 ? 's' : ''} para instalar con Homebrew`;
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
  async copyToClipboard(text, message = 'Copiado al portapapeles') {
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
    this.showToast(`Archivo ${filename} descargado`);
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
