"use client";

import { useEffect } from "react";

const KEY = "xauusd-poi:last-view";

export default function SessionPersistence() {
  useEffect(() => {
    let restored = false;
    const restore = () => {
      if (restored) return;
      const saved = window.localStorage.getItem(KEY);
      if (!saved) return;
      const buttons = Array.from(document.querySelectorAll("aside button"));
      const target = buttons.find((button) => button.textContent?.trim().includes(saved));
      if (target) {
        restored = true;
        (target as HTMLButtonElement).click();
      }
    };

    const observer = new MutationObserver(() => {
      const current = document.querySelector(".at-breadcrumb strong")?.textContent?.trim();
      if (current) window.localStorage.setItem(KEY, current);
      restore();
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    const timer = window.setTimeout(restore, 250);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, []);

  return null;
}
