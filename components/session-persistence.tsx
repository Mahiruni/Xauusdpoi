"use client";

import { useEffect } from "react";

const KEY = "xauusd-poi:last-view";

export default function SessionPersistence() {
  useEffect(() => {
    let restored = false;
    let initialized = false;

    const saveCurrent = () => {
      if (!initialized) return;
      const current = document.querySelector(".at-breadcrumb strong")?.textContent?.trim();
      if (current) window.localStorage.setItem(KEY, current);
    };

    const restore = () => {
      if (restored) return;
      const saved = window.localStorage.getItem(KEY);
      if (!saved || saved === "Strategy") {
        initialized = true;
        return;
      }
      const buttons = Array.from(document.querySelectorAll("aside button"));
      const target = buttons.find((button) => button.textContent?.trim().includes(saved));
      if (target) {
        restored = true;
        initialized = true;
        (target as HTMLButtonElement).click();
      }
    };

    const timer = window.setTimeout(restore, 350);
    const observer = new MutationObserver(() => {
      restore();
      saveCurrent();
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });

    const clickHandler = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest("aside button") as HTMLButtonElement | null;
      if (!button) return;
      const label = button.textContent?.trim();
      if (label === "Strategy") {
        event.preventDefault();
        window.localStorage.setItem(KEY, "Strategy");
        window.location.assign("/strategy");
        return;
      }
      window.setTimeout(saveCurrent, 0);
    };
    document.addEventListener("click", clickHandler, true);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      document.removeEventListener("click", clickHandler, true);
    };
  }, []);

  return null;
}
