// Pre-configured application bundles for quick selection in MacBrew

export const PRESETS = [
  {
    id: 'fullstack',
    name: '💻 Full-Stack Dev',
    description: 'El entorno imprescindible para desarrollo web y backend',
    appIds: ['visual-studio-code', 'google-chrome', 'iterm2', 'docker', 'postman', 'slack', 'git', 'node', 'python']
  },
  {
    id: 'devops',
    name: '☁️ DevOps & Cloud',
    description: 'Herramientas de contenedores, CLI y automatización',
    appIds: ['warp', 'orbstack', 'docker', 'git', 'python', 'go', 'jq', 'ripgrep', 'gh', '1password']
  },
  {
    id: 'creative',
    name: '🎨 Diseñador / Creativo',
    description: 'Suite de diseño UI, multimedia y comunicación',
    appIds: ['figma', 'blender', 'obs', 'spotify', 'notion', 'slack', 'google-chrome', 'iina']
  },
  {
    id: 'poweruser',
    name: '⚡ Mac Power User',
    description: 'Atajos, organización de ventanas, seguridad y utilidades avanzadas',
    appIds: ['raycast', 'rectangle', 'notion', 'obsidian', '1password', 'keka', 'appcleaner', 'arc']
  },
  {
    id: 'minimalist',
    name: '🌱 Esencial Minimalista',
    description: 'Las herramientas básicas indispensables para cualquier Mac nuevo',
    appIds: ['brave-browser', 'visual-studio-code', 'iterm2', 'rectangle', 'git']
  }
];
