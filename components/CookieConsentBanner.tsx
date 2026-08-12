"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "cookie-consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // One-time read of browser storage on mount; there's no way to know the
    // consent state during server rendering.
    if (localStorage.getItem(CONSENT_KEY) !== "accepted") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          This app uses a strictly-necessary cookie to keep you signed in. We
          don&apos;t use any tracking or analytics cookies.
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
