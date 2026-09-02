"use client";

import { useMutation } from "@tanstack/react-query";

export type ContactMessage = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export type ContactReceipt = ContactMessage & {
  reference: string;
  sentAt: string;
};

const STORAGE = "mimi-contact-v1";

/** A deliberate pause so the pending state is perceivable — nothing is posted anywhere yet. */
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function messageReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const noise = Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");
  return `MIMI-N${stamp}${noise}`;
}

export function useSendMessage() {
  return useMutation({
    mutationKey: ["contact", "send"],
    mutationFn: async (details: ContactMessage) => {
      await pause(1500);
      const receipt: ContactReceipt = {
        ...details,
        reference: messageReference(),
        sentAt: new Date().toISOString(),
      };
      try {
        window.localStorage.setItem(STORAGE, JSON.stringify(receipt));
      } catch {
        /* storage full or blocked — the confirmation still renders */
      }
      return receipt;
    },
  });
}
