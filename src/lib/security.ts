// Memória em cache para Rate Limiting (Brute Force Protection)
// Obs: em um ambiente Serverless (Vercel), essa memória é resetada a cada cold start, 
// mas é suficiente para mitigar ataques de força bruta rápidos no mesmo container.

type RateLimitData = {
  count: number;
  blockedUntil: number | null;
};

const loginAttempts = new Map<string, RateLimitData>();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

export function checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const record = loginAttempts.get(ip);
  
  if (!record) {
    return { allowed: true };
  }

  if (record.blockedUntil && Date.now() < record.blockedUntil) {
    const remainingMinutes = Math.ceil((record.blockedUntil - Date.now()) / 60000);
    return { 
      allowed: false, 
      reason: `Muitas tentativas falhas. Acesso bloqueado por segurança. Tente novamente em ${remainingMinutes} minuto(s).` 
    };
  }

  // Se o tempo de bloqueio já passou, libera o acesso (a contagem será resetada se der sucesso, ou incrementada se falhar)
  if (record.blockedUntil && Date.now() >= record.blockedUntil) {
    record.blockedUntil = null;
    record.count = 0;
  }

  return { allowed: true };
}

export function registerFailedAttempt(ip: string): void {
  const record = loginAttempts.get(ip) || { count: 0, blockedUntil: null };
  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = Date.now() + BLOCK_DURATION_MS;
  }

  loginAttempts.set(ip, record);
}

export function registerSuccessfulLogin(ip: string): void {
  loginAttempts.delete(ip);
}
