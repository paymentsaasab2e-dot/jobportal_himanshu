'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import {
  fetchTokenBalance,
  fetchTokenCatalog,
  purchaseTokenPack,
  type EarnLifecycleTask,
  type TokenCatalog,
  type TokenEarnTask,
  type TokenPack,
  type TokenServiceItem,
} from '@/lib/tokens-api';
import { EarnCelebrateHost } from '@/components/tokens/EarnCelebrateHost';
import {
  dispatchTokenEarn,
  formatEarnLabel,
  TOKEN_EARN_EVENT,
} from '@/lib/token-earn-events';

type TokensContextValue = {
  balance: number;
  loading: boolean;
  services: TokenServiceItem[];
  packs: TokenPack[];
  earnTasks: TokenEarnTask[];
  earnLifecycle: EarnLifecycleTask[];
  claimedEarnKeys: string[];
  welcomeAmount: number;
  refresh: () => Promise<void>;
  setBalance: (n: number) => void;
  purchase: (packageId: string) => Promise<{ credited: number; tokenBalance: number }>;
};

const TokensContext = createContext<TokensContextValue | null>(null);

function readCachedTokenBalance(): number {
  if (typeof window === 'undefined') return 0;
  const n = Number(window.localStorage.getItem('saasa:last-token-balance'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function persistCachedTokenBalance(value: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('saasa:last-token-balance', String(value));
}

export function TokensProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<TokenCatalog | null>(null);

  useEffect(() => {
    const cached = readCachedTokenBalance();
    if (cached > 0) setBalance(cached);
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setBalance(0);
      setCatalog(null);
      return;
    }
    setLoading(true);
    try {
      // Never wait on /tokens/catalog to paint the header. Catalog can hang on
      // HQ Phase-2 lookup; that used to leave the coin badge stuck at 0.
      const bal = await fetchTokenBalance();
      if (bal && typeof bal.tokenBalance === 'number') {
        setBalance(bal.tokenBalance);
        persistCachedTokenBalance(bal.tokenBalance);
      }
      void fetchTokenCatalog()
        .then((cat) => {
          if (!cat) return;
          setCatalog(cat);
          if (
            typeof cat.tokenBalance === 'number' &&
            Number.isFinite(cat.tokenBalance) &&
            cat.tokenBalance > 0
          ) {
            setBalance(cat.tokenBalance);
            persistCachedTokenBalance(cat.tokenBalance);
          }
          const granted = cat.lifecycleGranted || [];
          if (granted.length > 0) {
            const items = granted.filter((g) => g.earnKey && g.earnKey !== 'welcome');
            const total = items.reduce((s, g) => s + (Number(g.amount) || 0), 0);
            if (total > 0) {
              dispatchTokenEarn({
                amount: total,
                title: items.length === 1 ? formatEarnLabel(items[0].earnKey) : 'Rewards unlocked',
                subtitle: 'Tokens credited for completed earn tasks.',
                tokenBalance: bal?.tokenBalance ?? cat.tokenBalance,
                items: items.map((g) => ({
                  label: formatEarnLabel(g.earnKey),
                  amount: g.amount,
                })),
              });
            }
          }
        })
        .catch((err) => {
          console.warn('[tokens] catalog refresh failed', err);
        });
    } catch (err) {
      console.warn('[tokens] refresh failed', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => void refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    const onBalance = (event: Event) => {
      const detail = (event as CustomEvent<{ tokenBalance?: number }>).detail;
      if (typeof detail?.tokenBalance === 'number') {
        setBalance(detail.tokenBalance);
        window.localStorage.setItem('saasa:last-token-balance', String(detail.tokenBalance));
      }
    };
    const onEarn = (event: Event) => {
      const detail = (event as CustomEvent<{
        tokenBalance?: number;
        items?: Array<{ label?: string; amount?: number; earnKey?: string }>;
        earnKeys?: string[];
      }>).detail;
      if (typeof detail?.tokenBalance === 'number') {
        setBalance(detail.tokenBalance);
      }
      // Keep earn lifecycle in sync without a full page refresh.
      void fetchTokenCatalog().then((cat) => {
        if (cat) setCatalog(cat);
      });
    };
    window.addEventListener('saasa:token-balance', onBalance);
    window.addEventListener(TOKEN_EARN_EVENT, onEarn);
    return () => {
      window.removeEventListener('saasa:token-balance', onBalance);
      window.removeEventListener(TOKEN_EARN_EVENT, onEarn);
    };
  }, []);

  const purchase = useCallback(
    async (packageId: string) => {
      const result = await purchaseTokenPack(packageId);
      if (!result) throw new Error('Purchase failed');
      setBalance(result.tokenBalance);
      return { credited: result.credited, tokenBalance: result.tokenBalance };
    },
    [],
  );

  const value = useMemo<TokensContextValue>(
    () => ({
      balance,
      loading,
      services: catalog?.services ?? [],
      packs: catalog?.packs ?? [],
      earnTasks: catalog?.earnTasks ?? [],
      earnLifecycle: catalog?.earnLifecycle ?? [],
      claimedEarnKeys: catalog?.claimedEarnKeys ?? [],
      welcomeAmount: catalog?.welcomeAmount ?? 20,
      refresh,
      setBalance,
      purchase,
    }),
    [balance, loading, catalog, refresh, purchase],
  );

  return (
    <TokensContext.Provider value={value}>
      {children}
      <EarnCelebrateHost />
    </TokensContext.Provider>
  );
}

export function useTokens() {
  const ctx = useContext(TokensContext);
  if (!ctx) {
    throw new Error('useTokens must be used within TokensProvider');
  }
  return ctx;
}

/** Safe hook when provider may be absent (optional badge). */
export function useTokensOptional() {
  return useContext(TokensContext);
}
