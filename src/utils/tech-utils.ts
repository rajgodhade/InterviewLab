export const getTechIcons = (tech: string) => {
  const techMap: { [key: string]: string } = {
    'html': '🌐',
    'css': '🎨',
    'javascript': '📜',
    'js': '📜',
    'react': '⚛️',
    'node': '🟢',
    'nodejs': '🟢',
    'python': '🐍',
    'java': '☕',
    'sql': '💾',
    'database': '💾',
    'typescript': '📘',
    'ts': '📘',
    'nextjs': '▲',
    'next': '▲',
    'tailwind': '🌊',
    'ai': '🤖',
    'figma': '🎨',
    'git': '🌿',
    'mongodb': '🍃',
    'postgresql': '🐘',
    'express': '🚂',
    'vue': '🖖',
    'angular': '🅰️'
  };

  if (!tech) return ['💻'];

  const techs = tech.split(/[,&]/).map(t => t.trim().toLowerCase());
  const icons = techs.map(t => techMap[t] || '💻');
  
  // Filter out the default laptop icon if we found specific ones, 
  // unless the laptop is the only thing we found.
  const specificIcons = icons.filter(icon => icon !== '💻');
  
  if (specificIcons.length > 0) {
    return Array.from(new Set(specificIcons));
  }
  
  return ['💻'];
};
