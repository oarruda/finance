import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Obtém a chave de API Gemini de várias fontes possíveis:
 * 1. Variáveis de ambiente (GEMINI_API_KEY ou GOOGLE_API_KEY)
 * 2. localStorage (salvo pelo usuário na interface)
 * 3. Retorna null se não encontrar
 */
function getApiKey(): string | null {
  // Tenta variáveis de ambiente primeiro
  if (typeof process !== 'undefined' && process.env) {
    const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (envKey) {
      return envKey;
    }
  }

  // Tenta localStorage (apenas no cliente)
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const localStorageKey = localStorage.getItem('AI_API_KEY');
    if (localStorageKey) {
      return localStorageKey;
    }
  }

  return null;
}

const apiKey = getApiKey();

export const ai = genkit({
  plugins: [googleAI({ apiKey: apiKey || '' })],
  model: 'googleai/gemini-2.5-flash',
});

/**
 * Função para atualizar a chave de API em tempo de execução
 * Útil para recarregar após o usuário salvar uma nova chave
 */
export function updateAIApiKey(newKey: string): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem('AI_API_KEY', newKey);
  }
}
