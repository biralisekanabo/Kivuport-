"use client";

import { useEffect } from "react";

export const PAYMENT_VALIDATED_EVENT = "kivuport-payment-validated";

export function notifyPaymentValidated(reference: string) {
  const detail = { reference, timestamp: Date.now() };
  window.localStorage.setItem(PAYMENT_VALIDATED_EVENT, JSON.stringify(detail));
  window.dispatchEvent(new CustomEvent(PAYMENT_VALIDATED_EVENT, { detail }));

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(PAYMENT_VALIDATED_EVENT);
    channel.postMessage(detail);
    channel.close();
  }
}

export function PaymentRefreshListener() {
  useEffect(() => {
    const refresh = () => window.location.reload();
    const onStorage = (event: StorageEvent) => {
      if (event.key === PAYMENT_VALIDATED_EVENT && event.newValue) refresh();
    };
    const onBroadcast = () => refresh();

    window.addEventListener(PAYMENT_VALIDATED_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    const channel = "BroadcastChannel" in window ? new BroadcastChannel(PAYMENT_VALIDATED_EVENT) : null;
    channel?.addEventListener("message", onBroadcast);

    return () => {
      window.removeEventListener(PAYMENT_VALIDATED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, []);

  return null;
}
