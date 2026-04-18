import { questionBank, QuestionBankItem } from './questions';

function normalizeTech(technology: string): string[] {
  const tech = technology.toLowerCase();
  const matched: string[] = [];
  
  // Mapping of common tech names to bank keys
  const mapping: Record<string, string> = {
    'html5': 'html',
    'css3': 'css',
    'js': 'javascript',
    'node': 'nodejs',
    'bootstrap 5': 'bootstrap',
    'net': 'dotnet',
    '.net': 'dotnet',
    'c#': 'csharp',
    'c++': 'cpp',
    'ts': 'typescript'
  };

  // Check mapping first
  for (const [key, value] of Object.entries(mapping)) {
    if (tech.includes(key)) matched.push(value);
  }

  // Check direct keys
  for (const key of Object.keys(questionBank)) {
    if (tech.includes(key)) matched.push(key);
  }

  // Return unique matches or default to javascript
  const uniqueMatches = Array.from(new Set(matched));
  return uniqueMatches.length > 0 ? uniqueMatches : ['javascript'];
}

export function getFallbackQuestions(technology: string, difficulty: string, count: number): QuestionBankItem[] {
  const matchedKeys = normalizeTech(technology);
  let pool: QuestionBankItem[] = [];
  
  for (const key of matchedKeys) {
    const techQuestions = questionBank[key] || [];
    
    // Filter by difficulty if possible, otherwise take all
    const filteredByDifficulty = techQuestions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    
    if (filteredByDifficulty.length > 0) {
      pool = pool.concat(filteredByDifficulty);
    } else {
      pool = pool.concat(techQuestions);
    }
  }

  // Shuffle the pool
  const shuffled = pool.sort(() => Math.random() - 0.5);
  
  // If we still don't have enough, add more from the full tech pool
  if (shuffled.length < count) {
    for (const key of matchedKeys) {
      const techQuestions = questionBank[key] || [];
      shuffled.push(...techQuestions.filter(q => !shuffled.includes(q)));
    }
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}
