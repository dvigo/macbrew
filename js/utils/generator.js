// Script, Brewfile, and Command Generator for MacBrew (Homebrew Casks & Formulas)

/**
 * Generates a clean single-line or multi-line terminal command
 */
export function generateOneLiner(selectedApps) {
  if (!selectedApps || selectedApps.length === 0) {
    return '# Selecciona al menos una aplicación para generar el comando';
  }

  const casks = selectedApps.filter(app => app.type === 'cask').map(app => app.brew);
  const formulas = selectedApps.filter(app => app.type === 'formula').map(app => app.brew);

  const parts = [];
  if (casks.length > 0) {
    parts.push(`brew install --cask ${casks.join(' ')}`);
  }
  if (formulas.length > 0) {
    parts.push(`brew install ${formulas.join(' ')}`);
  }

  return parts.join(' && ');
}

/**
 * Generates an official bulk uninstall command for Homebrew Casks & Formulas
 */
export function generateUninstallOneLiner(selectedApps, zap = false) {
  if (!selectedApps || selectedApps.length === 0) {
    return '# Selecciona al menos una aplicación para desinstalar';
  }

  const casks = selectedApps.filter(app => app.type === 'cask').map(app => app.brew);
  const formulas = selectedApps.filter(app => app.type === 'formula').map(app => app.brew);

  const parts = [];
  const zapFlag = zap ? '--zap ' : '';

  if (casks.length > 0) {
    parts.push(`brew uninstall --cask ${zapFlag}${casks.join(' ')}`);
  }
  if (formulas.length > 0) {
    parts.push(`brew uninstall ${formulas.join(' ')}`);
  }

  return parts.join(' && ');
}

/**
 * Generates an executable Bash uninstallation script (uninstall.sh)
 */
export function generateUninstallScript(selectedApps, optZap = false) {
  if (!selectedApps || selectedApps.length === 0) {
    return '#!/bin/bash\necho "No apps selected for uninstallation."\nexit 0\n';
  }

  const casks = selectedApps.filter(app => app.type === 'cask').map(app => app.brew);
  const formulas = selectedApps.filter(app => app.type === 'formula').map(app => app.brew);
  const zapFlag = optZap ? '--zap ' : '';

  const lines = [
    '#!/bin/bash',
    '# =============================================================================',
    '# MacBrew Bulk Uninstallation Script',
    '# Generated via MacBrew (https://macbrew.app)',
    `# Date: ${new Date().toISOString().split('T')[0]}`,
    '# =============================================================================',
    '',
    'set -e',
    '',
    'echo "🗑️ Starting MacBrew bulk uninstallation..."',
    ''
  ];

  if (casks.length > 0) {
    lines.push('# Uninstall Cask Applications');
    lines.push(`echo "Uninstalling casks: ${casks.join(', ')}..."`);
    lines.push(`brew uninstall --cask ${zapFlag}${casks.join(' ')} || true`);
    lines.push('');
  }

  if (formulas.length > 0) {
    lines.push('# Uninstall Formula Packages');
    lines.push(`echo "Uninstalling formulas: ${formulas.join(', ')}..."`);
    lines.push(`brew uninstall ${formulas.join(' ')} || true`);
    lines.push('');
  }

  lines.push('# Run Homebrew cleanup');
  lines.push('echo "Running brew cleanup..."');
  lines.push('brew cleanup || true');
  lines.push('');
  lines.push('echo "✅ MacBrew uninstallation completed successfully!"');

  return lines.join('\n');
}

/**
 * Generates an official Brewfile format
 */
export function generateBrewfile(selectedApps) {
  if (!selectedApps || selectedApps.length === 0) {
    return '# Brewfile generado con MacBrew (https://macbrew.app)\n# Ninguna aplicación seleccionada';
  }

  const casks = selectedApps.filter(app => app.type === 'cask');
  const formulas = selectedApps.filter(app => app.type === 'formula');

  const lines = [
    '# =============================================================================',
    '# Brewfile — Generado con MacBrew (https://macbrew.app)',
    `# Fecha: ${new Date().toISOString().split('T')[0]}`,
    '# =============================================================================',
    '',
    '# Taps principales'
  ];

  if (casks.length > 0) {
    lines.push('tap "homebrew/cask"');
  }

  if (formulas.length > 0) {
    lines.push('\n# Formulas (Herramientas CLI y Runtimes)');
    formulas.forEach(app => {
      lines.push(`brew "${app.brew}"`);
    });
  }

  if (casks.length > 0) {
    lines.push('\n# Casks (Aplicaciones macOS)');
    casks.forEach(app => {
      lines.push(`cask "${app.brew}"`);
    });
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generates an interactive install.sh Bash script
 */
export function generateInstallScript(selectedApps, options = {}) {
  const {
    autoBrew = true,
    noQuarantine = true,
    cleanup = true,
    upgrade = false
  } = options;

  if (!selectedApps || selectedApps.length === 0) {
    return '#!/bin/bash\necho "No hay aplicaciones seleccionadas para instalar."';
  }

  const casks = selectedApps.filter(app => app.type === 'cask');
  const formulas = selectedApps.filter(app => app.type === 'formula');

  const caskFlag = noQuarantine ? ' --no-quarantine' : '';

  return `#!/bin/bash
# =============================================================================
# MacBrew — Script de Instalación Automatizada para macOS
# Generado en: https://macbrew.app
# Aplicaciones a instalar: ${selectedApps.length}
# =============================================================================

# Colores para mensajes en la terminal
BOLD="\\033[1m"
CYAN="\\033[36m"
GREEN="\\033[32m"
YELLOW="\\033[33m"
RED="\\033[31m"
RESET="\\033[0m"

echo -e "\${CYAN}\${BOLD}"
cat << 'EOF'
  __  __            ____                    
 |  \\/  |          |  _ \\                   
 | \\  / | __ _  ___| |_) |_ __ _____      __
 | |\\/| |/ _\` |/ __|  _ <| '__/ _ \\ \\ /\\ / /
 | |  | | (_| | (__| |_) | | |  __/\\ V  V / 
 |_|  |_|\\__,_|\\___|____/|_|  \\___| \\_/\\_/  
EOF
echo -e "\${RESET}"
echo -e "\${BOLD}Iniciando proceso de instalación masiva con MacBrew...\${RESET}\\n"

# Cargar entorno de Homebrew si existe
if [ -f "/opt/homebrew/bin/brew" ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -f "/usr/local/bin/brew" ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

${autoBrew ? `# 1. Verificar si Homebrew está instalado
if ! command -v brew >/dev/null 2>&1; then
  echo -e "\${YELLOW}⚠️  Homebrew no está instalado. Instalando Homebrew primero...\${RESET}"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [ -f "/opt/homebrew/bin/brew" ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -f "/usr/local/bin/brew" ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
else
  echo -e "\${GREEN}✓ Homebrew está listo.\${RESET}"
fi` : '# Homebrew preinstalado asumido'}

echo -e "\\n\${CYAN}🔄 Actualizando catálogo de Homebrew...\${RESET}"
brew update || true

${upgrade ? `echo -e "\\n\${CYAN}🆙 Actualizando paquetes existentes...\${RESET}"
brew upgrade || true
` : ''}
${formulas.length > 0 ? `# 2. Instalación de Formulas (CLI Tools & Runtimes)
echo -e "\\n\${CYAN}📦 Instalando herramientas de consola (${formulas.length})...\${RESET}"
FORMULAS=(${formulas.map(a => `"${a.brew}"`).join(' ')})

for formula in "\${FORMULAS[@]}"; do
  if brew list "$formula" >/dev/null 2>&1; then
    echo -e "  \${YELLOW}➜ $formula ya está instalado.\${RESET}"
  else
    echo -e "  \${GREEN}➜ Instalando $formula...\${RESET}"
    brew install "$formula" || echo -e "  \${RED}❌ Error al instalar $formula\${RESET}"
  fi
done
` : ''}
${casks.length > 0 ? `# 3. Instalación de Casks (Aplicaciones macOS)
echo -e "\\n\${CYAN}🖥️  Instalando aplicaciones GUI (${casks.length})...\${RESET}"
CASKS=(${casks.map(a => `"${a.brew}"`).join(' ')})

for cask in "\${CASKS[@]}"; do
  if brew list --cask "$cask" >/dev/null 2>&1; then
    echo -e "  \${YELLOW}➜ $cask ya está instalado.\${RESET}"
  else
    echo -e "  \${GREEN}➜ Instalando $cask...\${RESET}"
    brew install --cask${caskFlag} "$cask" || echo -e "  \${RED}❌ Error al instalar $cask\${RESET}"
  fi
done
` : ''}
${cleanup ? `# 4. Limpieza de archivos temporales
echo -e "\\n\${CYAN}🧹 Limpiando caché de instalación...\${RESET}"
brew cleanup || true
` : ''}
echo -e "\\n\${GREEN}\${BOLD}🎉 ¡Proceso de MacBrew completado con éxito!\${RESET}"
echo -e "Todas las aplicaciones seleccionadas han sido procesadas.\\n"
`;
}
