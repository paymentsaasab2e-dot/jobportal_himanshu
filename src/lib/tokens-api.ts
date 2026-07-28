import { getApiBaseUrl } from '@/lib/api-base';
import { getAuthHeaders } from '@/lib/auth-storage';

export type TokenServiceItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: string;
};

export type TokenPack = {
  id: string;
  name: string;
  priceLabel: string;
  priceAmount: number;
  currency: string;
  tokens: number;
  popular?: boolean;
};

export type TokenEarnTask = {
  id: string;
  name: string;
  description: string;
  tokens: number;
  category: string;
  order?: number;
  stage?: string;
  auto?: boolean;
  href?: string;
  baseTokens?: number;
  nextTokens?: number;
  cycle?: number;
  repeat?: boolean;
  reopenable?: boolean;
  done?: boolean;
  status?: 'done' | 'pending';
};

export type EarnLifecycleTask = TokenEarnTask & {
  status: 'done' | 'pending';
  done: boolean;
  baseTokens?: number;
  nextTokens?: number;
  cycle?: number;
  repeat?: boolean;
  reopenable?: boolean;
};

export type TokenCatalog = {
  services: TokenServiceItem[];
  packs: TokenPack[];
  earnTasks?: TokenEarnTask[];
  earnLifecycle?: EarnLifecycleTask[];
  welcomeAmount: number;
  tokenBalance: number;
  freeTokensGrantedAt: string | null;
  claimedEarnKeys?: string[];
  lifecycleGranted?: Array<{ earnKey?: string; amount?: number }>;
};

export type TokenBalance = {
  tokenBalance: number;
  freeTokensGrantedAt: string | null;
  welcomeAmount: number;
};

export class InsufficientTokensError extends Error {
  code = 'INSUFFICIENT_TOKENS' as const;
  balance: number;
  required: number;
  shortfall: number;
  service?: string;

  constructor(payload: {
    message?: string;
    balance?: number;
    required?: number;
    shortfall?: number;
    service?: string;
  }) {
    super(payload.message || 'Insufficient tokens');
    this.balance = payload.balance ?? 0;
    this.required = payload.required ?? 0;
    this.shortfall = payload.shortfall ?? Math.max(0, this.required - this.balance);
    this.service = payload.service;
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  return response.json().catch(() => ({} as T));
}

export async function fetchTokenBalance(signal?: AbortSignal): Promise<TokenBalance | null> {
  const response = await fetch(`${getApiBaseUrl()}/tokens/balance`, {
    method: 'GET',
    headers: getAuthHeaders(),
    signal,
  });
  const payload = await parseJson<{ success?: boolean; data?: TokenBalance; message?: string }>(
    response,
  );
  if (!response.ok || !payload.success || !payload.data) return null;
  return payload.data;
}

export async function fetchTokenCatalog(signal?: AbortSignal): Promise<TokenCatalog | null> {
  const response = await fetch(`${getApiBaseUrl()}/tokens/catalog`, {
    method: 'GET',
    headers: getAuthHeaders(),
    signal,
  });
  const payload = await parseJson<{ success?: boolean; data?: TokenCatalog; message?: string }>(
    response,
  );
  if (!response.ok || !payload.success || !payload.data) return null;
  return payload.data;
}

export async function purchaseTokenPack(packageId: string): Promise<{
  tokenBalance: number;
  credited: number;
  reference: string;
} | null> {
  const response = await fetch(`${getApiBaseUrl()}/tokens/purchase`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ packageId }),
  });
  const payload = await parseJson<{
    success?: boolean;
    data?: { tokenBalance: number; credited: number; reference: string };
    message?: string;
  }>(response);
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.message || 'Purchase failed');
  }
  return payload.data;
}

export async function claimWelcomeTokens(): Promise<{
  granted: boolean;
  tokenBalance: number;
  amount?: number;
} | null> {
  const response = await fetch(`${getApiBaseUrl()}/tokens/claim-welcome`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const payload = await parseJson<{
    success?: boolean;
    data?: { granted: boolean; tokenBalance: number; amount?: number };
    message?: string;
  }>(response);
  if (!response.ok || !payload.success || !payload.data) return null;
  return payload.data;
}

export async function spendTokenService(serviceId: string): Promise<{
  tokenBalance: number;
  spent: number;
  alreadyUnlocked?: boolean;
  service: string;
}> {
  const response = await fetch(`${getApiBaseUrl()}/tokens/spend`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ serviceId }),
  });
  const payload = await parseJson<{
    success?: boolean;
    data?: {
      tokenBalance: number;
      spent: number;
      alreadyUnlocked?: boolean;
      service: string;
    };
    message?: string;
    balance?: number;
    required?: number;
    shortfall?: number;
    service?: string;
    code?: string;
  }>(response);

  if (response.status === 402 || payload.code === 'INSUFFICIENT_TOKENS') {
    throw new InsufficientTokensError({
      message: payload.message,
      balance: payload.balance,
      required: payload.required,
      shortfall: payload.shortfall,
      service: payload.service || serviceId,
    });
  }

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.message || 'Token spend failed');
  }

  if (typeof window !== 'undefined' && typeof payload.data.tokenBalance === 'number') {
    window.dispatchEvent(
      new CustomEvent('saasa:token-balance', {
        detail: { tokenBalance: payload.data.tokenBalance },
      }),
    );
  }

  return payload.data;
}

export async function spendTokenAmount(input: {
  amount: number;
  service: string;
  description?: string;
}): Promise<{ tokenBalance: number; spent: number; service: string; local?: boolean }> {
  const url = `${getApiBaseUrl()}/tokens/spend-amount`;
  const maxAttempts = 4;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(attempt === 1 ? url : `${getApiBaseUrl()}/tokens/spend-amount`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch';
      // Common when backend is down or CORS blocks — retry once on local origin.
      if (/failed to fetch|networkerror|load failed/i.test(msg) && attempt === 1) {
        try {
          const { switchToLocalBackend } = await import('@/lib/api-base');
          switchToLocalBackend();
          response = await fetch(`${getApiBaseUrl()}/tokens/spend-amount`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(input),
          });
        } catch {
          const networkErr = new Error(
            'Cannot reach token server. Start the backend (port 5000) and try again.',
          );
          (networkErr as Error & { code?: string }).code = 'NETWORK_ERROR';
          throw networkErr;
        }
      } else {
        throw err instanceof Error ? err : new Error(String(err));
      }
    }

    const payload = await parseJson<{
      success?: boolean;
      data?: { tokenBalance: number; spent: number; service: string };
      message?: string;
      balance?: number;
      required?: number;
      shortfall?: number;
      service?: string;
      code?: string;
    }>(response);

    if (response.status === 401) {
      throw new Error('Session expired — sign in again to spend tokens.');
    }

    if (response.status === 402 || payload.code === 'INSUFFICIENT_TOKENS') {
      throw new InsufficientTokensError({
        message: payload.message,
        balance: payload.balance,
        required: payload.required,
        shortfall: payload.shortfall,
        service: payload.service || input.service,
      });
    }

    if (response.status === 404) {
      const missing = new Error(
        'Token spend endpoint missing — restart the backend server, then retry.',
      );
      (missing as Error & { code?: string }).code = 'ENDPOINT_MISSING';
      throw missing;
    }

    const conflict =
      !response.ok &&
      /write conflict|deadlock|please retry|P2034|transaction failed/i.test(
        payload.message || '',
      );

    if (conflict && attempt < maxAttempts) {
      lastError = new Error(payload.message || 'Token spend conflict — retrying');
      await new Promise((r) => setTimeout(r, 80 * attempt));
      continue;
    }

    if (!response.ok || !payload.success || !payload.data) {
      throw new Error(payload.message || 'Token spend failed');
    }

    if (typeof window !== 'undefined' && typeof payload.data.tokenBalance === 'number') {
      window.localStorage.setItem('saasa:last-token-balance', String(payload.data.tokenBalance));
      window.dispatchEvent(
        new CustomEvent('saasa:token-balance', {
          detail: { tokenBalance: payload.data.tokenBalance },
        }),
      );
    }

    return payload.data;
  }

  throw lastError || new Error('Token spend failed');
}

/** Local escrow when API is unreachable — keeps demo reference checks usable. */
export function spendTokenAmountLocal(amount: number, service: string): {
  tokenBalance: number;
  spent: number;
  service: string;
  local: true;
} {
  const cost = Math.max(0, Math.round(Number(amount) || 0));
  const raw =
    typeof window !== 'undefined' ? window.localStorage.getItem('saasa:last-token-balance') : null;
  let balance = Number(raw);
  if (!Number.isFinite(balance)) balance = 0;
  if (balance < cost) {
    throw new InsufficientTokensError({
      message: 'Insufficient tokens',
      balance,
      required: cost,
      shortfall: cost - balance,
      service,
    });
  }
  const tokenBalance = balance - cost;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('saasa:last-token-balance', String(tokenBalance));
    window.dispatchEvent(
      new CustomEvent('saasa:token-balance', {
        detail: { tokenBalance },
      }),
    );
  }
  return { tokenBalance, spent: cost, service, local: true };
}

export async function grantTokenAmount(input: {
  amount: number;
  service: string;
  description?: string;
  /** Credit another candidate (refund / reference payout). */
  candidateId?: string;
}): Promise<{ tokenBalance: number; granted: number; service: string; local?: boolean }> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/tokens/grant-amount`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    });
  } catch {
    // Local credit when offline (refunds / demo payouts).
    const credit = Math.max(0, Math.round(Number(input.amount) || 0));
    const raw =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('saasa:last-token-balance')
        : null;
    let balance = Number(raw);
    if (!Number.isFinite(balance)) balance = 0;
    const tokenBalance = balance + credit;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('saasa:last-token-balance', String(tokenBalance));
      window.dispatchEvent(
        new CustomEvent('saasa:token-balance', {
          detail: { tokenBalance },
        }),
      );
    }
    return { tokenBalance, granted: credit, service: input.service, local: true };
  }

  const payload = await parseJson<{
    success?: boolean;
    data?: { tokenBalance: number; granted: number; service: string };
    message?: string;
  }>(response);

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.message || 'Token grant failed');
  }

  if (typeof window !== 'undefined' && typeof payload.data.tokenBalance === 'number') {
    window.localStorage.setItem('saasa:last-token-balance', String(payload.data.tokenBalance));
    window.dispatchEvent(
      new CustomEvent('saasa:token-balance', {
        detail: { tokenBalance: payload.data.tokenBalance },
      }),
    );
  }

  return payload.data;
}

export async function fetchTokenUnlocks(): Promise<Record<string, boolean>> {
  const response = await fetch(`${getApiBaseUrl()}/tokens/unlocks`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const payload = await parseJson<{
    success?: boolean;
    data?: { unlocks?: Record<string, boolean> };
  }>(response);
  if (!response.ok || !payload.success) return {};
  return payload.data?.unlocks || {};
}

/** Throw InsufficientTokensError when an LMS/API response is 402. */
export async function assertTokensOk(res: Response): Promise<void> {
  if (res.status !== 402) return;
  const payload = await parseJson<{
    message?: string;
    balance?: number;
    required?: number;
    shortfall?: number;
    service?: string;
  }>(res);
  throw new InsufficientTokensError(payload);
}
