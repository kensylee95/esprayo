"use client";

import { useCallback, useState } from "react";
import { getTokenClient, saveToken } from "@/helpers/request";
import authService from "@/services/Auth/Auth";
import type { AuthError } from "@/services/Auth/Auth.dto";

type AuthStatus = "idle" | "loading" | "success" | "error";

interface UseGoogleAuthReturn {
  status: AuthStatus;
  error: string | null;
  handleGoogleCredential: (credential: string) => Promise<string | undefined>;
  reset: () => void;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setStatus("loading");
    setError(null);

    try {
      const token = await getTokenClient();
      if (!token) {
        setError("Token is required");
        return;
      }
      const service = authService(token);
      const { accessToken } = await service.googleLogin({ token: credential });
      await saveToken(accessToken);
      setStatus("success");
      return accessToken;
    } catch (err) {
      const authErr = err as AuthError;
      const message =
        authErr.message || "Something went wrong. Please try again.";
      setError(message);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, handleGoogleCredential, reset };
}
