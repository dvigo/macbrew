// Curated catalog of macOS applications & command-line tools for MacBrew (Bilingual)

export const CATEGORIES = [
  { id: 'browsers', name: { en: 'Web Browsers', es: 'Navegadores Web' }, icon: '🌐' },
  { id: 'dev', name: { en: 'Developer Tools', es: 'Herramientas de Desarrollo' }, icon: '⚡' },
  { id: 'messaging', name: { en: 'Communication & Messaging', es: 'Comunicación y Mensajería' }, icon: '💬' },
  { id: 'productivity', name: { en: 'Productivity & Notes', es: 'Productividad y Notas' }, icon: '📝' },
  { id: 'media', name: { en: 'Design & Multimedia', es: 'Diseño y Multimedia' }, icon: '🎨' },
  { id: 'utilities', name: { en: 'Utilities & System', es: 'Utilidades y Sistema' }, icon: '🛠️' },
  { id: 'cli', name: { en: 'CLI Tools & Runtimes', es: 'CLI Tools & Runtimes' }, icon: '💻' }
];

const BASE_ICON_URL = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png';

export const APPS = [
  // --- Web Browsers ---
  {
    id: 'google-chrome',
    name: 'Google Chrome',
    type: 'cask',
    brew: 'google-chrome',
    category: 'browsers',
    description: {
      en: 'The most popular web browser developed by Google.',
      es: 'El navegador web más popular desarrollado por Google.'
    },
    icon: `${BASE_ICON_URL}/google-chrome.png`,
    color: '#4285F4',
    symbol: '🌐'
  },
  {
    id: 'visual-studio-code',
    name: 'VS Code',
    type: 'cask',
    brew: 'visual-studio-code',
    category: 'dev',
    description: {
      en: 'Lightweight and powerful source code editor by Microsoft.',
      es: 'Editor de código fuente ligero y potente creado por Microsoft.'
    },
    icon: `${BASE_ICON_URL}/visual-studio-code.png`,
    color: '#007ACC',
    symbol: '⚡'
  },
  {
    id: 'firefox',
    name: 'Mozilla Firefox',
    type: 'cask',
    brew: 'firefox',
    category: 'browsers',
    description: {
      en: 'Fast, private, and open-source web browser.',
      es: 'Navegador rápido, privado y de código abierto.'
    },
    icon: `${BASE_ICON_URL}/firefox.png`,
    color: '#FF7139',
    symbol: '🦊'
  },
  {
    id: 'brave-browser',
    name: 'Brave',
    type: 'cask',
    brew: 'brave-browser',
    category: 'browsers',
    description: {
      en: 'Privacy-focused browser blocking ads and trackers by default.',
      es: 'Navegador centrado en la privacidad y bloqueo de rastreadores.'
    },
    icon: `${BASE_ICON_URL}/brave.png`,
    color: '#FF1B2D',
    symbol: '🦁'
  },
  {
    id: 'arc',
    name: 'Arc Browser',
    type: 'cask',
    brew: 'arc',
    category: 'browsers',
    description: {
      en: 'The browser reimagined with spatial organization and spaces.',
      es: 'El navegador reinventado con espacios de trabajo y organización espacial.'
    },
    icon: `${BASE_ICON_URL}/arc.png`,
    color: '#FF73B3',
    symbol: '🌐'
  },
  {
    id: 'tor-browser',
    name: 'Tor Browser',
    type: 'cask',
    brew: 'tor-browser',
    category: 'browsers',
    description: {
      en: 'Anonymous browsing and protection against tracking and surveillance.',
      es: 'Navegación anónima y protección contra la vigilancia.'
    },
    icon: `${BASE_ICON_URL}/tor-browser.png`,
    color: '#7D4698',
    symbol: '🧅'
  },

  // --- Developer Tools ---
  {
    id: 'cursor',
    name: 'Cursor AI',
    type: 'cask',
    brew: 'cursor',
    category: 'dev',
    description: {
      en: 'AI-first code editor built on top of VS Code.',
      es: 'Editor de código potenciado por Inteligencia Artificial basado en VS Code.'
    },
    icon: `${BASE_ICON_URL}/cursor.png`,
    color: '#38BDF8',
    symbol: '⚡'
  },
  {
    id: 'iterm2',
    name: 'iTerm2',
    type: 'cask',
    brew: 'iterm2',
    category: 'dev',
    description: {
      en: 'Advanced Terminal replacement for macOS with split panes & tabs.',
      es: 'Reemplazo avanzado para la aplicación Terminal predeterminada de macOS.'
    },
    icon: `${BASE_ICON_URL}/iterm2.png`,
    color: '#4E9F3D',
    symbol: '🐚'
  },
  {
    id: 'warp',
    name: 'Warp Terminal',
    type: 'cask',
    brew: 'warp',
    category: 'dev',
    description: {
      en: 'Modern Rust-based terminal with AI auto-completion & blocks.',
      es: 'Terminal moderna impulsada por Rust con autocompletado y funciones de IA.'
    },
    icon: `${BASE_ICON_URL}/warp.png`,
    color: '#00D2FF',
    symbol: '🌀'
  },
  {
    id: 'docker',
    name: 'Docker Desktop',
    type: 'cask',
    brew: 'docker',
    category: 'dev',
    description: {
      en: 'Complete containerization environment to build and run containers.',
      es: 'Entorno de contenedorización completo para crear y ejecutar contenedores.'
    },
    icon: `${BASE_ICON_URL}/docker.png`,
    color: '#2496ED',
    symbol: '🐳'
  },
  {
    id: 'postman',
    name: 'Postman',
    type: 'cask',
    brew: 'postman',
    category: 'dev',
    description: {
      en: 'Leading API platform for building, testing, and documenting APIs.',
      es: 'Plataforma líder para desarrollo, pruebas y documentación de APIs.'
    },
    icon: `${BASE_ICON_URL}/postman.png`,
    color: '#FF6C37',
    symbol: '🚀'
  },
  {
    id: 'orbstack',
    name: 'OrbStack',
    type: 'cask',
    brew: 'orbstack',
    category: 'dev',
    description: {
      en: 'Fast, light, and simple container & Linux VM runner for macOS.',
      es: 'Alternativa ultrarrápida y ligera a Docker Desktop para macOS.'
    },
    icon: `${BASE_ICON_URL}/orbstack.png`,
    color: '#6366F1',
    symbol: '🛸'
  },
  {
    id: 'jetbrains-toolbox',
    name: 'JetBrains Toolbox',
    type: 'cask',
    brew: 'jetbrains-toolbox',
    category: 'dev',
    description: {
      en: 'Manager to update and launch JetBrains IDEs (WebStorm, PyCharm, IntelliJ).',
      es: 'Gestor para actualizar y lanzar IDEs de JetBrains (WebStorm, PyCharm, IntelliJ).'
    },
    icon: `${BASE_ICON_URL}/jetbrains.png`,
    color: '#F97316',
    symbol: '🧰'
  },
  {
    id: 'gitkraken',
    name: 'GitKraken',
    type: 'cask',
    brew: 'gitkraken',
    category: 'dev',
    description: {
      en: 'Intuitive and powerful GUI Git client for developers.',
      es: 'Cliente gráfico de Git intuitivo y lleno de funciones para desarrolladores.'
    },
    icon: `${BASE_ICON_URL}/gitkraken.png`,
    color: '#17C6B8',
    symbol: '🐙'
  },
  {
    id: 'sublime-text',
    name: 'Sublime Text',
    type: 'cask',
    brew: 'sublime-text',
    category: 'dev',
    description: {
      en: 'Sophisticated text editor for code, markup and prose.',
      es: 'Editor de texto sofisticado para código, marcado y prosa.'
    },
    icon: `${BASE_ICON_URL}/sublime-text.png`,
    color: '#FF9800',
    symbol: '📝'
  },

  // --- Communication & Messaging ---
  {
    id: 'slack',
    name: 'Slack',
    type: 'cask',
    brew: 'slack',
    category: 'messaging',
    description: {
      en: 'Team communication and collaboration platform.',
      es: 'Plataforma de comunicación y colaboración para equipos de trabajo.'
    },
    icon: `${BASE_ICON_URL}/slack.png`,
    color: '#E01E5A',
    symbol: '💬'
  },
  {
    id: 'discord',
    name: 'Discord',
    type: 'cask',
    brew: 'discord',
    category: 'messaging',
    description: {
      en: 'Voice, video, and text communication for communities & developers.',
      es: 'Voz, vídeo y texto para comunidades y comunidades de desarrolladores.'
    },
    icon: `${BASE_ICON_URL}/discord.png`,
    color: '#5865F2',
    symbol: '🎮'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    type: 'cask',
    brew: 'telegram',
    category: 'messaging',
    description: {
      en: 'Pure instant messaging — simple, fast, secure, and synced.',
      es: 'Aplicación de mensajería instantánea enfocada en la velocidad y la seguridad.'
    },
    icon: `${BASE_ICON_URL}/telegram.png`,
    color: '#26A5E4',
    symbol: '✈️'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    type: 'cask',
    brew: 'whatsapp',
    category: 'messaging',
    description: {
      en: 'Official WhatsApp desktop messaging application for Mac.',
      es: 'Aplicación oficial de mensajería de WhatsApp para escritorio de Mac.'
    },
    icon: `${BASE_ICON_URL}/whatsapp.png`,
    color: '#25D366',
    symbol: '📞'
  },
  {
    id: 'zoom',
    name: 'Zoom',
    type: 'cask',
    brew: 'zoom',
    category: 'messaging',
    description: {
      en: 'Video conferencing, online meetings, and chat.',
      es: 'Plataforma para reuniones virtuales, llamadas y seminarios web.'
    },
    icon: `${BASE_ICON_URL}/zoom.png`,
    color: '#2D8CFF',
    symbol: '📹'
  },
  {
    id: 'signal',
    name: 'Signal',
    type: 'cask',
    brew: 'signal',
    category: 'messaging',
    description: {
      en: 'End-to-end encrypted private messaging application.',
      es: 'Mensajería privada cifrada de extremo a extremo.'
    },
    icon: `${BASE_ICON_URL}/signal.png`,
    color: '#3A76F0',
    symbol: '🔒'
  },

  // --- Productivity & Notes ---
  {
    id: 'notion',
    name: 'Notion',
    type: 'cask',
    brew: 'notion',
    category: 'productivity',
    description: {
      en: 'All-in-one workspace for notes, docs, tasks, and databases.',
      es: 'Espacio de trabajo todo en uno para notas, documentos, tareas y bases de datos.'
    },
    icon: `${BASE_ICON_URL}/notion.png`,
    color: '#FFFFFF',
    symbol: '📓'
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    type: 'cask',
    brew: 'obsidian',
    category: 'productivity',
    description: {
      en: 'Private and flexible knowledge base over local Markdown files.',
      es: 'Base de conocimiento privada y flexible almacenada en archivos Markdown locales.'
    },
    icon: `${BASE_ICON_URL}/obsidian.png`,
    color: '#7A3EE8',
    symbol: '💎'
  },
  {
    id: 'raycast',
    name: 'Raycast',
    type: 'cask',
    brew: 'raycast',
    category: 'productivity',
    description: {
      en: 'Blazing fast Spotlight replacement with power extensions.',
      es: 'Lanzador ultrarrápido y extensible que reemplaza a Spotlight con extensiones.'
    },
    icon: `${BASE_ICON_URL}/raycast.png`,
    color: '#FF6363',
    symbol: '🚀'
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    type: 'cask',
    brew: 'rectangle',
    category: 'productivity',
    description: {
      en: 'Move and resize windows in macOS using keyboard shortcuts.',
      es: 'Gestor de ventanas mediante atajos de teclado o arrastre de bordes.'
    },
    icon: `${BASE_ICON_URL}/rectangle.png`,
    color: '#38BDF8',
    symbol: '🪟'
  },
  {
    id: '1password',
    name: '1Password',
    type: 'cask',
    brew: '1password',
    category: 'productivity',
    description: {
      en: 'Password manager for individuals, families, and teams.',
      es: 'Gestor de contraseñas seguro para familias y equipos.'
    },
    icon: `${BASE_ICON_URL}/1password.png`,
    color: '#0094F5',
    symbol: '🔑'
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden',
    type: 'cask',
    brew: 'bitwarden',
    category: 'productivity',
    description: {
      en: 'Open-source password management for all devices.',
      es: 'Gestor de contraseñas de código abierto para todos tus dispositivos.'
    },
    icon: `${BASE_ICON_URL}/bitwarden.png`,
    color: '#175DDC',
    symbol: '🛡️'
  },

  // --- Design & Multimedia ---
  {
    id: 'figma',
    name: 'Figma',
    type: 'cask',
    brew: 'figma',
    category: 'media',
    description: {
      en: 'Collaborative interface design and prototyping tool.',
      es: 'Herramienta colaborativa de diseño de interfaz de usuario y prototipado.'
    },
    icon: `${BASE_ICON_URL}/figma.png`,
    color: '#F24E1E',
    symbol: '🎨'
  },
  {
    id: 'spotify',
    name: 'Spotify',
    type: 'cask',
    brew: 'spotify',
    category: 'media',
    description: {
      en: 'Digital music, podcast, and video streaming service.',
      es: 'Reproductor de música en streaming, podcasts y listas de reproducción.'
    },
    icon: `${BASE_ICON_URL}/spotify.png`,
    color: '#1ED760',
    symbol: '🎵'
  },
  {
    id: 'vlc',
    name: 'VLC Media Player',
    type: 'cask',
    brew: 'vlc',
    category: 'media',
    description: {
      en: 'Free and open-source cross-platform multimedia player.',
      es: 'Reproductor multimedia compatible con prácticamente cualquier formato.'
    },
    icon: `${BASE_ICON_URL}/vlc.png`,
    color: '#FF8800',
    symbol: '📙'
  },
  {
    id: 'iina',
    name: 'IINA',
    type: 'cask',
    brew: 'iina',
    category: 'media',
    description: {
      en: 'The modern media player designed specifically for macOS.',
      es: 'El reproductor de vídeo moderno diseñado específicamente para macOS.'
    },
    icon: `${BASE_ICON_URL}/iina.png`,
    color: '#EC4899',
    symbol: '🎬'
  },

  // --- Utilities & System ---
  {
    id: 'appcleaner',
    name: 'AppCleaner',
    type: 'cask',
    brew: 'appcleaner',
    category: 'utilities',
    description: {
      en: 'Small application to thoroughly uninstall apps without leftovers.',
      es: 'Pequeña aplicación que te permite desinstalar aplicaciones sin dejar rastros.'
    },
    icon: `${BASE_ICON_URL}/appcleaner.png`,
    color: '#10B981',
    symbol: '🧹'
  },
  {
    id: 'keka',
    name: 'Keka',
    type: 'cask',
    brew: 'keka',
    category: 'utilities',
    description: {
      en: 'The macOS file archiver (7z, ISO, RAR, ZIP, TAR).',
      es: 'El compresor y descompresor de archivos de macOS (7z, ISO, RAR, ZIP, TAR).'
    },
    icon: `${BASE_ICON_URL}/keka.png`,
    color: '#F59E0B',
    symbol: '📦'
  },

  // --- CLI Tools & Runtimes ---
  {
    id: 'git',
    name: 'Git',
    type: 'formula',
    brew: 'git',
    category: 'cli',
    description: {
      en: 'Distributed version control system standard.',
      es: 'Sistema de control de versiones distribuido estándar en la industria.'
    },
    icon: `${BASE_ICON_URL}/git.png`,
    color: '#F05032',
    symbol: '🌱'
  },
  {
    id: 'node',
    name: 'Node.js',
    type: 'formula',
    brew: 'node',
    category: 'cli',
    description: {
      en: 'JavaScript runtime environment built on Chrome V8.',
      es: 'Entorno de ejecución para JavaScript del lado del servidor.'
    },
    icon: `${BASE_ICON_URL}/nodejs.png`,
    color: '#5FA04E',
    symbol: '🟢'
  },
  {
    id: 'python',
    name: 'Python 3',
    type: 'formula',
    brew: 'python',
    category: 'cli',
    description: {
      en: 'High-level programming language for general-purpose programming.',
      es: 'Lenguaje de programación versátil ampliamente utilizado en web y data science.'
    },
    icon: `${BASE_ICON_URL}/python.png`,
    color: '#3776AB',
    symbol: '🐍'
  },
  {
    id: 'go',
    name: 'Go',
    type: 'formula',
    brew: 'go',
    category: 'cli',
    description: {
      en: 'Fast, concurrent, open-source programming language created by Google.',
      es: 'Lenguaje de programación rápido y concurrente creado por Google.'
    },
    icon: `${BASE_ICON_URL}/go.png`,
    color: '#00ADD8',
    symbol: '🐹'
  },
  {
    id: 'rust',
    name: 'Rust',
    type: 'formula',
    brew: 'rust',
    category: 'cli',
    description: {
      en: 'Empowering everyone to build reliable and efficient software.',
      es: 'Lenguaje de programación de sistemas centrado en la seguridad y el rendimiento.'
    },
    icon: `${BASE_ICON_URL}/rust.png`,
    color: '#DEA584',
    symbol: '🦀'
  }
];
