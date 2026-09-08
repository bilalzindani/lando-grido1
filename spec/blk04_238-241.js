import Lenis from "lenis";
const lenis = new Lenis({ smoothWheel: true });   // the project's own settings — default lerp, no syncTouch
subscribe((time) => lenis.raf(time), () => 0);