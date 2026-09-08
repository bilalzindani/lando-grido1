import { CFG } from "./spring";
import { makeAnim, type Anim } from "./anim";
import { NAV_LINKS } from "../data/home";
import { asset } from "./assets";

/**
 * The masthead's mobile sheet — appended to <body>, never inside the
 * transformed masthead: a transformed ancestor would pin a fixed sheet inside
 * the header.
 */
export function mountNav(lenis: { start(): void; stop(): void } | null) {
  const burger = document.querySelector<HTMLButtonElement>("[data-burger]");
  if (!burger) return;

  const LINKS = [...NAV_LINKS, { label: "Garage", href: "/garage" }];
  const wide = window.matchMedia("(min-width: 1280px)");
  let sheet: HTMLElement | null = null;

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };
  const onWide = (e: MediaQueryListEvent) => {
    if (e.matches) close();
  };

  function close() {
    if (!sheet) return;
    sheet.remove();
    sheet = null;
    document.documentElement.classList.remove("is-locked");
    lenis?.start();
    burger!.setAttribute("aria-expanded", "false");
    burger!.focus();
    window.removeEventListener("keydown", onKey);
    wide.removeEventListener("change", onWide);
  }

  function open() {
    if (sheet) return;
    sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "Menu");
    sheet.innerHTML =
      '<div class="sheet__top">' +
      '<a class="sheet__logo" href="/" aria-label="Grido1 Racing Systems">' +
      '<img src="' + asset("hero/ui/grido1-logo.webp") + '" width="424" height="97" alt=""></a>' +
      '<button class="sheet__close" type="button" aria-label="Close menu"><span></span><span></span></button>' +
      "</div>" +
      '<nav class="sheet__nav" aria-label="Primary"></nav>';
    const nav = sheet.querySelector<HTMLElement>(".sheet__nav")!;
    for (const link of LINKS) {
      const a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
      nav.appendChild(a);
    }
    document.body.appendChild(sheet);

    makeAnim(sheet, {
      from: { opacity: 0 }, to: { opacity: 1 }, config: CFG.SHEET, mode: "always",
    }).enable(true);
    const items: Anim[] = Array.from(nav.children).map((a, i) =>
      makeAnim(a as HTMLElement, {
        from: { opacity: 0, y: "0.75rem" },
        to: { opacity: 1, y: "0rem" },
        config: CFG.ITEM,
        delay: 120 + i * 55,
        mode: "once",
      }),
    );
    items.forEach((a) => a.enable(true));

    sheet.querySelector(".sheet__close")!.addEventListener("click", close);
    sheet.querySelector(".sheet__logo")!.addEventListener("click", close);
    nav.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).tagName === "A") close();
    });

    document.documentElement.classList.add("is-locked");
    lenis?.stop();
    burger!.setAttribute("aria-expanded", "true");
    sheet.querySelector<HTMLElement>(".sheet__close")!.focus();
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
  }

  burger.addEventListener("click", open);
}
