/**
 * The page's authored content, in one place — the timeline's seven entries and
 * the calendar's five rounds. The geometry modules read `TimelineEntry` to size
 * the rail, so the shape lives here with the data.
 */
export interface TimelineEntry {
  year: string;
  frame: "side" | "centre";
  align?: "left" | "right";
  image: string;
  alt: string;
  lead?: string;
  copy?: string;
  copyWidth?: number;
}

export const TIMELINE: readonly TimelineEntry[] = [
  {
    year: "2012",
    frame: "centre",
    image: "timeline/2012.webp",
    alt: "Kimi in kart overalls in the paddock, aged six",
    lead: "The first kart.",
    copy: "At six, Kimi discovered karting — turning a childhood curiosity into something of his own.",
    copyWidth: 228,
  },
  {
    year: "2015",
    frame: "side",
    align: "right",
    image: "timeline/2015.webp",
    alt: "Kimi holding a karting trophy at sunset",
  },
  {
    year: "2019",
    frame: "centre",
    image: "timeline/2019.webp",
    alt: "Kimi signing with the Mercedes junior team",
    lead: "Finding his people.",
    copy: "Kimi joined the Mercedes Junior Programme, marking his first major step into professional motorsport.",
    copyWidth: 272,
  },
  {
    year: "2021",
    frame: "side",
    align: "left",
    image: "timeline/2021.webp",
    alt: "Kimi beside a single-seater in the garage",
  },
  {
    year: "2024",
    frame: "centre",
    image: "timeline/2024.webp",
    alt: "Kimi walking the pit lane in Mercedes kit",
    lead: "The year everything changed.",
    copy: "Formula 2 brought Kimi closer to F1, while Mercedes confirmed him as their future race driver.",
    copyWidth: 278,
  },
  {
    year: "2025",
    frame: "side",
    align: "right",
    image: "timeline/2025.webp",
    alt: "Kimi in the Mercedes garage",
  },
  {
    year: "2026",
    frame: "centre",
    image: "timeline/2026.webp",
    alt: "The Mercedes-AMG F1 car on track",
    lead: "From karts to f1.",
    copy: "Kimi is now racing at the highest level, with Bologna still his anchor — family, home and life beyond racing.",
    copyWidth: 284,
  },
];

export interface Round {
  round: string;
  name: string;
  date: string;
  x: number;
  width: number;
  /** A result, or the live round, or a round still to come. */
  marker: { kind: "result"; label: string } | { kind: "live" } | { kind: "ring" };
}

export const ROUNDS: readonly Round[] = [
  { round: "round 11", name: "austrian gp", date: "29 jun", x: 347, width: 100, marker: { kind: "result", label: "p6" } },
  { round: "round 12", name: "british gp", date: "12 jul", x: 511, width: 100, marker: { kind: "result", label: "p4" } },
  { round: "round 13", name: "belgian gp", date: "27 jul", x: 675, width: 100, marker: { kind: "live" } },
  { round: "round 14", name: "hungarian gp", date: "03 aug", x: 839, width: 114, marker: { kind: "ring" } },
  { round: "round 15", name: "dutch gp", date: "31 aug", x: 1017, width: 76, marker: { kind: "ring" } },
];

/** The paddock's four stat rows. */
export const PADDOCK_STATS = [
  { icon: "paddock/icon-flag.svg", label: "last result", figure: "P4" },
  { icon: "paddock/icon-bars.svg", label: "points gained", figure: "+12" },
  { icon: "paddock/icon-trophy.svg", label: "championship", figure: "P1" },
  { icon: "paddock/icon-gauge.svg", label: "points", figure: "118" },
] as const;

/** The season block's standings plate. */
export const STANDINGS = [
  { figure: "P1", wording: "in the championship" },
  { figure: "6", wording: "wins" },
  { figure: "9", wording: "podiums." },
] as const;

/** The footer's nav column, which is the masthead's list too. */
export const NAV_LINKS = [
  { label: "driver", href: "/driver" },
  { label: "season", href: "/season" },
  { label: "journal", href: "/journal" },
  { label: "next race", href: "/next-race" },
  { label: "store", href: "/store" },
] as const;
