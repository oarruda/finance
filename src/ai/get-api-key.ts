/**
 * Função para obter a chave de API da IA a partir do Firestore ou variáveis de ambiente
 */

export async function getAIApiKey(): Promise<string | null> {
  // Primeiro, tenta obter a chave do localStorage (salva na sessão do cliente)
  if (typeof window !== 'undefined') {
    const savedKey = localStorage.getItem('AI_API_KEY');
    if (savedKey) {
      return savedKey;
    }
  }

  // Se estiver no servidor ou não encontrou no localStorage, tenta variáveis de ambiente
  const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (envKey) {
    return envKey;
  }

  return null;
}

/**
 * Salva a chave de API no localStorage (lado do cliente)
 */
export function saveAIApiKeyToClient(apiKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('AI_API_KEY', apiKey);
  }
}

/**
 * Remove a chave de API do localStorage
 */
export function removeAIApiKeyFromClient(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('AI_API_KEY');
  }
}
