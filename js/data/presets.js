// Pre-configured application bundles for quick selection in MacBrew (Bilingual: en & es)

export const PRESETS = [
  {
    id: 'fullstack',
    name: {
      en: '💻 Full-Stack Dev',
      es: '💻 Full-Stack Dev'
    },
    description: {
      en: 'Essential environment for web and backend development',
      es: 'El entorno imprescindible para desarrollo web y backend'
    },
    appIds: ['visual-studio-code', 'google-chrome', 'iterm2', 'docker', 'postman', 'slack', 'git', 'node', 'python']
  },
  {
    id: 'devops',
    name: {
      en: '☁️ DevOps & Cloud',
      es: '☁️ DevOps & Cloud'
    },
    description: {
      en: 'Containers, CLI tools, and automation suite',
      es: 'Herramientas de contenedores, CLI y automatización'
    },
    appIds: ['warp', 'orbstack', 'docker', 'git', 'python', 'go', '1password']
  },
  {
    id: 'creative',
    name: {
      en: '🎨 Designer / Creative',
      es: '🎨 Diseñador / Creativo'
    },
    description: {
      en: 'UI design, multimedia, and team communication suite',
      es: 'Suite de diseño UI, multimedia y comunicación'
    },
    appIds: ['figma', 'spotify', 'notion', 'slack', 'google-chrome', 'iina']
  },
  {
    id: 'poweruser',
    name: {
      en: '⚡ Mac Power User',
      es: '⚡ Mac Power User'
    },
    description: {
      en: 'Shortcuts, window management, security, and power utilities',
      es: 'Atajos, organización de ventanas, seguridad y utilidades avanzadas'
    },
    appIds: ['raycast', 'rectangle', 'notion', 'obsidian', '1password', 'keka', 'appcleaner', 'arc']
  },
  {
    id: 'minimalist',
    name: {
      en: '🌱 Minimalist Essential',
      es: '🌱 Esencial Minimalista'
    },
    description: {
      en: 'Indispensable core apps for any fresh Mac setup',
      es: 'Las herramientas básicas indispensables para cualquier Mac nuevo'
    },
    appIds: ['brave-browser', 'visual-studio-code', 'iterm2', 'rectangle', 'git']
  }
];
