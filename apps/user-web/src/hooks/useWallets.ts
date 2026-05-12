import { useCallback, useEffect, useState } from "react";
import { getTokenClient } from "@/helpers/request";
import walletService from "@/services/Wallet/Wallet";
import type { WalletResponse } from "@/services/Wallet/Wallet.dto";

export const useWallet = () => {
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // LOAD TOKEN
  // -------------------------
  useEffect(() => {
    const loadToken = async () => {
      try {
        const t = await getTokenClient();
        setToken(t);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          return;
        }
        setError("Failed to load token");
      }
    };

    loadToken();
  }, []);

  const walletApi = token ? walletService(token) : null;

  // -------------------------
  // FETCH WALLET
  // -------------------------
  const fetchWallet = useCallback(async () => {
    if (!walletApi) return;

    try {
      setLoading(true);
      const data = await walletApi.getWallet();
      setWallet(data);
      setBalance(data.balance);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        return;
      }
      setError("Failed to fetch wallet");
    } finally {
      setLoading(false);
    }
  }, [walletApi]);

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
      if (err instanceof Error) {
        setError(err?.message);
        throw err;
      }
      setError("Credit failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // AUTO FETCH WHEN TOKEN READY
  // -------------------------
  useEffect(() => {
    if (token) {
      fetchWallet();
    }
  }, [token, fetchWallet]);

  return {
    wallet,
    balance,
    loading,
    error,
    ready: !!token, // 👈 important

    fetchWallet,
    credit,
  };
};
