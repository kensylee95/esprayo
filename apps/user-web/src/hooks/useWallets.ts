import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTokenClient } from "@/helpers/request";
import walletService from "@/services/Wallet/Wallet";
import type { WalletResponse } from "@/services/Wallet/Wallet.dto";

export const useWallet = () => {
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate fetch (React 18/19 Strict Mode safe)
  const hasFetched = useRef(false);

  // -------------------------
  // LOAD TOKEN (runs once)
  // -------------------------
  useEffect(() => {
    let mounted = true;

    const loadToken = async () => {
      try {
        const t = await getTokenClient();
        if (mounted) setToken(t);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load token");
      }
    };

    loadToken();

    return () => {
      mounted = false;
    };
  }, []);

  // -------------------------
  // STABLE WALLET SERVICE
  // -------------------------
  const walletApi = useMemo(() => {
    if (!token) return null;
    return walletService(token);
  }, [token]);

  // -------------------------
  // FETCH WALLET (STABLE)
  // -------------------------
  const fetchWallet = useCallback(async () => {
    if (!walletApi) return;

    try {
      setLoading(true);

      const data = await walletApi.getWallet();

      setWallet(data);
      setBalance(data.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch wallet");
    } finally {
      setLoading(false);
    }
  }, [walletApi]);

  // -------------------------
  // AUTO FETCH ONCE TOKEN IS READY
  // -------------------------
  useEffect(() => {
    if (!token) return;
    if (!walletApi) return;
    if (hasFetched.current) return;

    hasFetched.current = true;
    fetchWallet();
  }, [token, walletApi, fetchWallet]);

  // -------------------------
  // CREDIT
  // -------------------------
  const credit = async (payload: { amount: number; reference: string }) => {
    if (!walletApi) throw new Error("Token not ready");

    try {
      setLoading(true);

      const res = await walletApi.credit(payload);

      setBalance(res.balance);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credit failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    wallet,
    balance,
    loading,
    error,
    ready: !!token,

    fetchWallet,
    credit,
  };
};