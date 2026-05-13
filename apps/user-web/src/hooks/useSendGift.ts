import { useCallback, useState } from "react";
import type { GiftItem } from "@/app/(auth)/gift-room/[giftRoomSlug]/GiftRoom.dto";

type SendGiftPayload = {
  eventId: string;
  giftId: GiftItem["id"];
  displayName: string;
};
export const useGiftSender = (token?: string | null) => {
  const [isSending, setSending] = useState(false);

  const sendGift = useCallback(
    async (payload: SendGiftPayload) => {
      if (!token) return;

      setSending(true);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/gift-room/gift`,
          {
            method: "POST",

            headers: {
              Authorization: `Bearer ${token}`,

              "Content-Type": "application/json",
            },

            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) throw new Error("Gift failed");

        const dataPromise = res.json();

        return dataPromise;
      } finally {
        setSending(false);
      }
    },
    [token],
  );

  return {
    sendGift,
    isSending,
  };
};
