// Compatibility entrypoint. Keep public homepage copy single-sourced in exact-reference-home.mjs
// so legacy imports cannot reintroduce stale LMCA attribution or study-status claims.
export { bindPublicHomeEvents, publicHomePage } from "./exact-reference-home.mjs";
