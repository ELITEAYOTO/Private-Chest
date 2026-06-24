/**
 * PrivateChest — Interface principale
 * Vanilla JS (module), Tauri v2
 */

// ── Tauri bridge ───────────────────────────────────────────────
const { invoke } = window.__TAURI__?.core ?? window.__TAURI__ ?? {};

async function tauriInvoke(cmd, args = {}) {
  if (!invoke) {
    console.warn("[mock]", cmd, args);
    return null;
  }
  return invoke(cmd, args);
}

// ── Contrôles de la fenêtre ────────────────────────────────────
function getTauriWin() {
  return window.__TAURI__?.window?.getCurrentWindow?.()
    ?? window.__TAURI__?.window?.getCurrent?.();
}
document.getElementById("tbMinBtn")?.addEventListener("click", () => getTauriWin()?.minimize());
document.getElementById("tbMaxBtn")?.addEventListener("click", () => getTauriWin()?.toggleMaximize());
document.getElementById("tbCloseBtn")?.addEventListener("click", () => getTauriWin()?.close());

// ── Toasts ─────────────────────────────────────────────────────
function showToast(message, type = "info", durationMs = 3000) {
  const tc = document.getElementById("toastContainer");
  if (!tc) { console.warn("[Toast]", type, message); return; }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  tc.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-out");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, durationMs);
}

// ── Slide notification (droite → gauche) ───────────────────────
function showSlideNotif(message, type = "success") {
  const existing = document.getElementById("slideNotif");
  if (existing) existing.remove();
  const notif = document.createElement("div");
  notif.id = "slideNotif";
  notif.className = `slide-notif sn-${type}`;
  notif.innerHTML = `<span class="slide-notif-icon">${type === "success" ? "✓" : "✕"}</span><span>${message}</span>`;
  document.body.appendChild(notif);
  requestAnimationFrame(() => notif.classList.add("visible"));
  setTimeout(() => {
    notif.classList.remove("visible");
    notif.addEventListener("transitionend", () => notif.remove(), { once: true });
  }, 3000);
}

// ── Icônes de services connus ──────────────────────────────────
const SERVICE_ICONS = {
  discord: `<svg viewBox="0 0 640 640"><path d="M524.5 133.8C524.3 133.5 524.1 133.2 523.7 133.1C485.6 115.6 445.3 103.1 404 96C403.6 95.9 403.2 96 402.9 96.1C402.6 96.2 402.3 96.5 402.1 96.9C396.6 106.8 391.6 117.1 387.2 127.5C342.6 120.7 297.3 120.7 252.8 127.5C248.3 117 243.3 106.8 237.7 96.9C237.5 96.6 237.2 96.3 236.9 96.1C236.6 95.9 236.2 95.9 235.8 95.9C194.5 103 154.2 115.5 116.1 133C115.8 133.1 115.5 133.4 115.3 133.7C39.1 247.5 18.2 358.6 28.4 468.2C28.4 468.5 28.5 468.7 28.6 469C28.7 469.3 28.9 469.4 29.1 469.6C73.5 502.5 123.1 527.6 175.9 543.8C176.3 543.9 176.7 543.9 177 543.8C177.3 543.7 177.7 543.4 177.9 543.1C189.2 527.7 199.3 511.3 207.9 494.3C208 494.1 208.1 493.8 208.1 493.5C208.1 493.2 208.1 493 208 492.7C207.9 492.4 207.8 492.2 207.6 492.1C207.4 492 207.2 491.8 206.9 491.7C191.1 485.6 175.7 478.3 161 469.8C160.7 469.6 160.5 469.4 160.3 469.2C160.1 469 160 468.6 160 468.3C160 468 160 467.7 160.2 467.4C160.4 467.1 160.5 466.9 160.8 466.7C163.9 464.4 167 462 169.9 459.6C170.2 459.4 170.5 459.2 170.8 459.2C171.1 459.2 171.5 459.2 171.8 459.3C268 503.2 372.2 503.2 467.3 459.3C467.6 459.2 468 459.1 468.3 459.1C468.6 459.1 469 459.3 469.2 459.5C472.1 461.9 475.2 464.4 478.3 466.7C478.5 466.9 478.7 467.1 478.9 467.4C479.1 467.7 479.1 468 479.1 468.3C479.1 468.6 479 468.9 478.8 469.2C478.6 469.5 478.4 469.7 478.2 469.8C463.5 478.4 448.2 485.7 432.3 491.6C432.1 491.7 431.8 491.8 431.6 492C431.4 492.2 431.3 492.4 431.2 492.7C431.1 493 431.1 493.2 431.1 493.5C431.1 493.8 431.2 494 431.3 494.3C440.1 511.3 450.1 527.6 461.3 543.1C461.5 543.4 461.9 543.7 462.2 543.8C462.5 543.9 463 543.9 463.3 543.8C516.2 527.6 565.9 502.5 610.4 469.6C610.6 469.4 610.8 469.2 610.9 469C611 468.8 611.1 468.5 611.1 468.2C623.4 341.4 590.6 231.3 524.2 133.7zM222.5 401.5C193.5 401.5 169.7 374.9 169.7 342.3C169.7 309.7 193.1 283.1 222.5 283.1C252.2 283.1 275.8 309.9 275.3 342.3C275.3 375 251.9 401.5 222.5 401.5zM417.9 401.5C388.9 401.5 365.1 374.9 365.1 342.3C365.1 309.7 388.5 283.1 417.9 283.1C447.6 283.1 471.2 309.9 470.7 342.3C470.7 375 447.5 401.5 417.9 401.5z"/></svg>`,
  twitter: `<svg viewBox="0 0 640 640"><path d="M453.2 112L523.8 112L369.6 288.2L551 528L409 528L297.7 382.6L170.5 528L99.8 528L264.7 339.5L90.8 112L236.4 112L336.9 244.9L453.2 112zM428.4 485.8L467.5 485.8L215.1 152L173.1 152L428.4 485.8z"/></svg>`,
  instagram: `<svg viewBox="0 0 640 640"><path d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z"/></svg>`,
  youtube: `<svg viewBox="0 0 640 640"><path d="M581.7 188.1C575.5 164.4 556.9 145.8 533.4 139.5C490.9 128 320.1 128 320.1 128C320.1 128 149.3 128 106.7 139.5C83.2 145.8 64.7 164.4 58.4 188.1C47 231 47 320.4 47 320.4C47 320.4 47 409.8 58.4 452.7C64.7 476.3 83.2 494.2 106.7 500.5C149.3 512 320.1 512 320.1 512C320.1 512 490.9 512 533.5 500.5C557 494.2 575.5 476.3 581.8 452.7C593.2 409.8 593.2 320.4 593.2 320.4C593.2 320.4 593.2 231 581.8 188.1zM264.2 401.6L264.2 239.2L406.9 320.4L264.2 401.6z"/></svg>`,
  spotify: `<svg viewBox="0 0 640 640"><path d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM420.7 436.9C416.5 436.9 413.9 435.6 410 433.3C347.6 395.7 275 394.1 203.3 408.8C199.4 409.8 194.3 411.4 191.4 411.4C181.7 411.4 175.6 403.7 175.6 395.6C175.6 385.3 181.7 380.4 189.2 378.8C271.1 360.7 354.8 362.3 426.2 405C432.3 408.9 435.9 412.4 435.9 421.5C435.9 430.6 428.8 436.9 420.7 436.9zM447.6 371.3C442.4 371.3 438.9 369 435.3 367.1C372.8 330.1 279.6 315.2 196.7 337.7C191.9 339 189.3 340.3 184.8 340.3C174.1 340.3 165.4 331.6 165.4 320.9C165.4 310.2 170.6 303.1 180.9 300.2C208.7 292.4 237.1 286.6 278.7 286.6C343.6 286.6 406.3 302.7 455.7 332.1C463.8 336.9 467 343.1 467 351.8C466.9 362.6 458.5 371.3 447.6 371.3zM478.6 295.1C473.4 295.1 470.2 293.8 465.7 291.2C394.5 248.7 267.2 238.5 184.8 261.5C181.2 262.5 176.7 264.1 171.9 264.1C158.7 264.1 148.6 253.8 148.6 240.5C148.6 226.9 157 219.2 166 216.6C201.2 206.3 240.6 201.4 283.5 201.4C356.5 201.4 433 216.6 488.9 249.2C496.7 253.7 501.8 259.9 501.8 271.8C501.8 285.4 490.8 295.1 478.6 295.1z"/></svg>`,
  steam: `<svg viewBox="0 0 640 640"><path d="M568 320C568 457 456.8 568 319.6 568C205.8 568 110 491.7 80.6 387.6L175.8 426.9C182.2 459 210.7 483.3 244.7 483.3C283.9 483.3 316.6 450.9 314.9 409.8L399.4 349.6C451.5 350.9 495.2 308.7 495.2 256.1C495.2 204.5 453.2 162.6 401.5 162.6C349.8 162.6 307.8 204.6 307.8 256.1L307.8 257.3L248.6 343C233.1 342.1 217.9 346.4 205.1 355.1L72 300.1C82.2 172.4 189.1 72 319.6 72C456.8 72 568 183 568 320zM227.7 448.3L197.2 435.7C202.8 447.3 212.5 456.5 224.4 461.5C251.3 472.7 282.2 459.9 293.4 433.1C298.8 420.1 298.9 405.8 293.5 392.8C288.1 379.8 278 369.6 265 364.2C252.1 358.8 238.3 359 226.1 363.6L257.6 376.6C277.4 384.8 286.8 407.5 278.5 427.3C270.2 447.2 247.5 456.5 227.7 448.3zM401.5 193.8C435.9 193.8 463.8 221.7 463.8 256.1C463.8 290.5 435.9 318.4 401.5 318.4C367.1 318.4 339.2 290.5 339.2 256.1C339.2 221.7 367.1 193.8 401.5 193.8zM401.6 302.8C427.4 302.8 448.4 281.8 448.4 256C448.4 230.2 427.4 209.2 401.6 209.2C375.8 209.2 354.8 230.2 354.8 256C354.8 281.8 375.8 302.8 401.6 302.8z"/></svg>`,
  amazon: `<svg viewBox="0 0 640 640"><path d="M353.7 226.7C305 228.5 184.2 242.2 184.2 344.2C184.2 453.7 322.5 458.2 367.7 387.4C374.2 397.6 403.1 424.9 413 434.2L469.8 378.2C469.8 378.2 437.5 352.9 437.5 325.4L437.5 178.3C437.5 153 413 96 325.2 96C237.2 96 190.5 151 190.5 200.3L264 207.1C280.3 157.6 318.2 157.6 318.2 157.6C358.9 157.5 353.7 187.4 353.7 226.7zM353.7 313.5C353.7 393.5 269.5 381.5 269.5 330.7C269.5 283.5 320 274 353.7 272.9L353.7 313.5zM489.7 477C482 487 419.7 544 315.2 544C210.7 544 130.7 472.5 106.2 443C99.4 435.3 107.2 431.7 111.7 434.7C185 479.2 299.5 552.5 484.2 465C491.7 461.3 497.5 467 489.7 477zM529.5 479.2C523 495 513.5 506 508.3 510.2C502.8 514.7 498.8 512.9 501.8 506.4C504.8 499.9 521.1 459.9 514.5 451.4C508 443.1 477.5 447.1 466.5 448.2C455.7 449.2 453.5 450.2 452.5 447.9C450.2 442.2 474.2 432.4 490 430.4C505.7 428.6 531 429.6 536 436.1C539.7 441.2 536 463.2 529.5 479.2z"/></svg>`,
  apple: `<svg viewBox="0 0 640 640"><path d="M447.1 332.7C446.9 296 463.5 268.3 497.1 247.9C478.3 221 449.9 206.2 412.4 203.3C376.9 200.5 338.1 224 323.9 224C308.9 224 274.5 204.3 247.5 204.3C191.7 205.2 132.4 248.8 132.4 337.5C132.4 363.7 137.2 390.8 146.8 418.7C159.6 455.4 205.8 545.4 254 543.9C279.2 543.3 297 526 329.8 526C361.6 526 378.1 543.9 406.2 543.9C454.8 543.2 496.6 461.4 508.8 424.6C443.6 393.9 447.1 334.6 447.1 332.7zM390.5 168.5C417.8 136.1 415.3 106.6 414.5 96C390.4 97.4 362.5 112.4 346.6 130.9C329.1 150.7 318.8 175.2 321 202.8C347.1 204.8 370.9 191.4 390.5 168.5z"/></svg>`,
  linkedin: `<svg viewBox="0 0 640 640"><path d="M512 96L127.9 96C110.3 96 96 110.5 96 128.3L96 511.7C96 529.5 110.3 544 127.9 544L512 544C529.6 544 544 529.5 544 511.7L544 128.3C544 110.5 529.6 96 512 96zM231.4 480L165 480L165 266.2L231.5 266.2L231.5 480L231.4 480zM198.2 160C219.5 160 236.7 177.2 236.7 198.5C236.7 219.8 219.5 237 198.2 237C176.9 237 159.7 219.8 159.7 198.5C159.7 177.2 176.9 160 198.2 160zM480.3 480L413.9 480L413.9 376C413.9 351.2 413.4 319.3 379.4 319.3C344.8 319.3 339.5 346.3 339.5 374.2L339.5 480L273.1 480L273.1 266.2L336.8 266.2L336.8 295.4L337.7 295.4C346.6 278.6 368.3 260.9 400.6 260.9C467.8 260.9 480.3 305.2 480.3 362.8L480.3 480z"/></svg>`,
  telegram: `<svg viewBox="0 0 640 640"><path d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM435 240.7C431.3 279.9 415.1 375.1 406.9 419C403.4 437.6 396.6 443.8 390 444.4C375.6 445.7 364.7 434.9 350.7 425.7C328.9 411.4 316.5 402.5 295.4 388.5C270.9 372.4 286.8 363.5 300.7 349C304.4 345.2 367.8 287.5 369 282.3C369.2 281.6 369.3 279.2 367.8 277.9C366.3 276.6 364.2 277.1 362.7 277.4C360.5 277.9 325.6 300.9 258.1 346.5C248.2 353.3 239.2 356.6 231.2 356.4C222.3 356.2 205.3 351.4 192.6 347.3C177.1 342.3 164.7 339.6 165.8 331C166.4 326.5 172.5 322 184.2 317.3C256.5 285.8 304.7 265 328.8 255C397.7 226.4 412 221.4 421.3 221.2C423.4 221.2 427.9 221.7 430.9 224.1C432.9 225.8 434.1 228.2 434.4 230.8C434.9 234 435 237.3 434.8 240.6z"/></svg>`,
  playstation: `<svg viewBox="0 0 640 640"><path d="M603 436.3C591.7 450.5 564.2 460.6 564.2 460.6L359.1 534.2L359.1 479.9L510 426.1C527.1 420 529.8 411.3 515.8 406.7C501.9 402.1 476.7 403.4 459.6 409.6L359.1 445.1L359.1 388.7C382.3 380.9 406.2 375.1 434.8 371.9C475.7 367.4 525.7 372.5 565 387.4C609.2 401.4 614.2 422.1 603 436.3zM378.6 343.8L378.6 204.8C378.6 188.5 375.6 173.5 360.3 169.2C348.6 165.4 341.3 176.3 341.3 192.6L341.3 540.5L247.5 510.7L247.5 96C287.4 103.4 345.5 120.9 376.7 131.4C456.2 158.7 483.1 192.7 483.1 269.2C483.1 343.7 437.1 372 378.6 343.8zM75.3 474.2C29.9 461.4 22.3 434.7 43 419.4C62.1 405.2 94.7 394.5 94.7 394.5L229.2 346.7L229.2 401.2L132.4 435.8C115.3 441.9 112.7 450.6 126.6 455.2C140.5 459.8 165.7 458.5 182.8 452.3L229.2 435.4L229.2 484.2C177.6 493.5 127.8 491.5 75.3 474.2z"/></svg>`,
  xbox: `<svg viewBox="0 0 640 640"><path d="M433.9 382.2C478.2 436.5 498.6 481 488.3 500.9C480.4 516 431.6 545.5 395.7 556.8C366.1 566.1 327.3 570.1 295.3 567C257.1 563.3 218.4 549.6 185.2 528C157.3 509.8 151 502.3 151 487.4C151 457.5 183.9 405.1 240.2 345.3C272.2 311.4 316.7 271.6 321.6 272.7C331 274.8 405.9 347.8 433.9 382.2zM252.6 207.8C222.9 180.9 194.5 153.9 166.2 144.4C151 139.3 149.9 139.6 137.5 152.5C108.3 182.9 84 232.2 77.2 274.9C71.8 309.1 71.1 318.7 73 335.4C78.6 385.9 90.3 420.8 113.5 456.3C123 470.9 125.6 473.6 122.8 466.2C118.6 455.2 122.5 428.7 132.3 402.2C146.6 363.2 186.2 289.3 252.6 207.8zM564.2 271.3C547.3 191.3 496.7 141 489.6 141C482.3 141 465.4 147.5 453.6 154.9C430.3 169.4 412.6 186.3 389.3 207.7C431.7 261 491.5 347.1 512.2 410C519 430.7 521.9 451.1 519.6 462.3C517.9 470.8 517.9 470.8 521 466.9C527.1 459.2 540.9 435.6 546.4 423.4C553.8 407.2 561.4 383.2 565 364.7C569.3 342.2 568.9 293.9 564.2 271.3zM205.3 107C253 104.5 315 141.5 319.6 142.4C320.3 142.5 330 138.2 341.2 132.7C405.1 101.6 435.2 106.9 448.6 107.5C384.7 68.2 295.9 57.5 214.7 95.8C191.3 106.9 190.7 107.7 205.3 107z"/></svg>`,
  cloudflare: `<svg viewBox="0 0 640 640"><path d="M407.9 383.9L177.1 381C176.4 381 175.7 380.8 175.1 380.5C174.5 380.2 173.9 379.7 173.5 379.1C173.1 378.5 172.8 377.8 172.8 377.1C172.8 376.4 172.8 375.7 173 375C173.4 373.9 174.1 372.9 175.1 372.2C176.1 371.5 177.2 371 178.4 371L411.3 368.1C438.9 366.8 468.8 344.5 479.3 317.3L492.6 282.8C493 281.9 493.1 280.9 493.1 279.9C493.1 279.4 493 278.8 492.9 278.3C485.5 246.1 467.9 217.2 442.6 196C417.3 174.8 385.9 162.3 352.9 160.5C319.9 158.7 287.3 167.8 259.9 186.2C232.5 204.6 211.9 231.5 201.1 262.7C189.8 254.2 176.2 249.4 162.1 249C148 248.6 134.1 252.5 122.3 260.4C110.5 268.3 101.5 279.5 96.4 292.7C91.3 305.9 90.5 320.3 94 334C41.7 335.5-.2 378.1-.2 430.5C-.2 435.2 .1 439.8 .8 444.5C1 445.6 1.5 446.6 2.3 447.3C3.1 448 4.2 448.4 5.2 448.4L431.3 448.5C432.6 448.5 433.7 448.1 434.7 447.4C435.7 446.7 436.3 445.7 436.7 444.5L440 433.2C443.9 419.8 442.4 407.4 435.9 398.3C429.9 389.9 419.8 385 407.7 384.4zM513.8 285.1C511.7 285.1 509.5 285.2 507.4 285.3C506.6 285.4 505.9 285.6 505.3 286.1C504.7 286.6 504.3 287.2 504 287.9L494.9 319.1C491 332.5 492.5 344.9 499 354C505 362.4 515.1 367.3 527.2 367.9L576.4 370.8C577.1 370.8 577.8 371 578.4 371.3C579 371.6 579.5 372.1 579.9 372.7C580.3 373.3 580.6 374 580.7 374.7C580.8 375.4 580.7 376.2 580.5 376.8C580.1 377.9 579.4 378.9 578.4 379.6C577.4 380.3 576.3 380.8 575.1 380.8L524 383.7C496.2 385 466.3 407.3 455.9 434.5L452.2 444.1C452 444.5 452 444.9 452 445.4C452 445.9 452.2 446.2 452.4 446.6C452.6 447 453 447.3 453.3 447.5C453.6 447.7 454.1 447.8 454.5 447.8L630.5 447.8C631.5 447.8 632.5 447.5 633.3 446.9C634.1 446.3 634.7 445.4 635 444.5C638.1 433.4 639.7 422 639.7 410.5C639.7 341.2 583.2 285 513.6 285z"/></svg>`,
  deezer: `<svg viewBox="0 0 640 640"><path d="M78.8 165.1C70.6 165.1 64 191.6 64 224.3C64 257 70.6 283.5 78.8 283.5C87 283.5 93.6 257 93.6 224.3C93.6 191.6 87 165.1 78.8 165.1zM512.7 104.9C505 104.9 498.2 122 493.3 149C485.6 102.3 473.1 72 459.1 72C442.3 72 428 114.9 421.1 177.4C414.5 132 404.3 103.2 392.8 103.2C376.7 103.2 363.2 160.1 358.1 239.4C348.7 198.6 334.9 173.1 319.8 173.1C304.7 173.1 291 198.6 281.5 239.4C276.4 160.1 262.9 103.2 246.8 103.2C235.3 103.2 225.1 132 218.5 177.4C211.9 114.9 197.3 72 180.7 72C166.7 72 154.2 102.4 146.5 149C141.7 122 134.8 104.9 127.1 104.9C112.8 104.9 101.1 164.1 101.1 237C101.1 309.9 113 369.2 127.3 369.2C133.2 369.2 138.8 359.3 143.1 342.4C150 404.1 164.3 446.5 181.1 446.5C194.1 446.5 205.6 421 213.2 380.9C218.6 457.2 231.8 511.3 247.4 511.3C257.1 511.3 266 489.9 272.7 454.9C280.6 527.1 299 577.6 320.4 577.6C341.8 577.6 359.9 527.1 368.1 454.9C374.7 489.9 383.7 511.3 393.4 511.3C409 511.3 422.2 457.2 427.6 380.9C435.3 421 447 446.5 459.7 446.5C476.3 446.5 490.6 404.2 497.7 342.4C502 359.2 507.4 369.2 513.5 369.2C527.8 369.2 539.5 310 539.5 237.1C539.5 164.2 527 104.9 512.7 104.9zM561.2 165.1C553 165.1 546.4 191.6 546.4 224.3C546.4 257 553 283.5 561.2 283.5C569.4 283.5 576 257 576 224.3C576 191.6 569.4 165.1 561.2 165.1z"/></svg>`,
  stripe: `<svg viewBox="0 0 640 640"><path d="M524.4 284.8C515.5 284.8 505.7 291.5 505.7 307.5L542.4 307.5C542.4 291.5 533.1 284.8 524.4 284.8zM407 287.4C398.8 287.4 393.7 290.3 390 294.4L390.2 347.2C393.7 350.9 398.7 353.9 407 353.9C420.1 353.9 428.9 339.6 428.9 320.5C428.9 301.9 419.9 287.3 407 287.4zM560 96L80 96C53.5 96 32 117.5 32 144L32 496C32 522.5 53.5 544 80 544L560 544C586.5 544 608 522.5 608 496L608 144C608 117.5 586.5 96 560 96zM575.6 333.8L506.1 333.8C507.7 350.4 519.9 355.3 533.7 355.3C547.8 355.3 558.9 352.3 568.6 347.4L568.6 376C558.9 381.3 546.2 385.2 529.2 385.2C494.6 385.2 470.4 363.5 470.4 320.7C470.4 284.5 490.9 255.8 524.7 255.8C558.4 255.8 576 284.5 576 320.9C576 324.4 575.7 331.8 575.6 333.8z"/></svg>`,
  teamspeak: `<svg viewBox="0 0 640 640"><path d="M184.8 101.2C152.6 139.3 128.7 183.8 114.9 231.7C75.5 248.4 48 287 48 332C48 391.6 96.4 440 156 440C215.6 440 264 391.6 264 332C264 278.5 225.1 234.1 174 225.5C189.7 183.7 214.4 145.9 246.3 114.8C248.1 113.2 250.3 112.2 252.6 111.7C289.8 100.2 329.3 98.4 367.4 106.5C486.7 131.6 566 244.7 549.1 365.3C540.7 427.9 510.5 478 461.4 516.7C411.3 556.4 353.9 571 291.2 568.9L267.2 567.9C279.6 570.7 292.2 572.8 304.8 574.2C345.5 578.4 386.2 576.3 424.9 561.7C518.9 526.2 574.2 459.4 587.8 359.2C592.6 306.6 582 253.8 557 207.2C486.6 75.3 322.8 25.6 191 96C188.6 97.4 186.5 99.1 184.7 101.2z"/></svg>`,
  unity: `<svg viewBox="0 0 640 640"><path d="M339.6 155.6L419.7 202.4C422.6 204 422.7 208.6 419.7 210.2L324.5 265.8C321.6 267.5 318.2 267.4 315.5 265.8L220.3 210.2C217.4 208.6 217.3 203.9 220.3 202.4L300.4 155.6L300.4 64L96 183.4L96 422.2L174.4 376.4L174.4 282.8C174.3 279.5 178.2 277.1 181.1 278.9L276.3 334.5C279.2 336.2 280.8 339.2 280.8 342.3L280.8 453.5C280.9 456.8 277 459.2 274.1 457.4L194 410.8L115.6 456.6L320 576L524.4 456.6L446 410.8L365.9 457.6C363.1 459.3 359.1 457.1 359.2 453.7L359.2 342.5C359.2 339.2 361 336.2 363.7 334.7L458.9 279C461.7 277.3 465.7 279.5 465.6 282.9L465.6 376.5L544 422.3L544 183.5L339.6 64.1L339.6 155.7z"/></svg>`,
};

const SERVICE_BG = {
  discord: "#5865f2", twitter: "#000", instagram: "#e1306c", youtube: "#ff0000",
  spotify: "#1db954", steam: "#1b2838", amazon: "#ff9900", apple: "#555",
  linkedin: "#0a66c2", telegram: "#0088cc", playstation: "#003087", xbox: "#107c10",
  cloudflare: "#f38020", deezer: "#00c7f2", stripe: "#635bff",
  teamspeak: "#4a8af4", unity: "#222",
};

function getServiceIcon(title, url) {
  const text = `${title ?? ""} ${url ?? ""}`.toLowerCase();
  if (/discord/.test(text))           return "discord";
  if (/twitter|x\.com/.test(text))    return "twitter";
  if (/instagram/.test(text))         return "instagram";
  if (/youtube/.test(text))           return "youtube";
  if (/spotify/.test(text))           return "spotify";
  if (/steam/.test(text))             return "steam";
  if (/amazon/.test(text))            return "amazon";
  if (/apple|icloud/.test(text))      return "apple";
  if (/linkedin/.test(text))          return "linkedin";
  if (/telegram/.test(text))          return "telegram";
  if (/playstation|psn/.test(text))   return "playstation";
  if (/xbox/.test(text))              return "xbox";
  if (/cloudflare/.test(text))        return "cloudflare";
  if (/deezer/.test(text))            return "deezer";
  if (/stripe/.test(text))            return "stripe";
  if (/teamspeak/.test(text))         return "teamspeak";
  if (/unity/.test(text))             return "unity";
  return null;
}

// ── État global ─────────────────────────────────────────────────
const state = {
  view: "passwords",
  activeCategory: null,
  selectedEntryId: null,
  entries: [],
  cards: [],
  trash: [],
  cardsUnlocked: false,
  revealedPassword: false,
  editingEntryId: null,
  pendingDeleteId: null,
  pendingDeleteName: "",
  settings: { autoLockMinutes: 5, clipClearSeconds: 20 },
  tickInterval: null,
  formKind: "login",
};

// ── Refs ────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const refs = {
  bootScreen: $("bootScreen"),
  bootMessage: $("bootMessage"),
  authScreen: $("authScreen"),
  shellScreen: $("shellScreen"),

  onboardingForm: $("onboardingForm"),
  onboardingPassword: $("onboardingPassword"),
  onboardingConfirm: $("onboardingConfirm"),
  onboardingHint: $("onboardingHint"),
  onboardingToggleBtn: $("onboardingToggleBtn"),
  onboardingSubmitBtn: $("onboardingSubmitBtn"),
  onboardingError: $("onboardingError"),
  strengthBar: $("strengthBar"),
  strengthLabel: $("strengthLabel"),

  unlockForm: $("unlockForm"),
  unlockPassword: $("unlockPassword"),
  unlockToggleBtn: $("unlockToggleBtn"),
  unlockHint: $("unlockHint"),
  unlockError: $("unlockError"),
  unlockSubmitBtn: $("unlockSubmitBtn"),

  searchInput: $("searchInput"),
  navItems: document.querySelectorAll(".nav-item"),
  navCountAll: $("navCountAll"),
  navCountFav: $("navCountFav"),
  categoryList: $("categoryList"),
  healthBadge: $("healthBadge"),
  healthLabel: $("healthLabel"),
  sessionTimerWrap: $("sessionTimerWrap"),
  sessionTimerLabel: $("sessionTimerLabel"),
  lockBtn: $("lockBtn"),

  listPanel: $("listPanel"),
  listTitle: $("listTitle"),
  listCount: $("listCount"),
  newEntryBtn: $("newEntryBtn"),
  entriesContainer: $("entriesContainer"),

  emptyState: $("emptyState"),
  emptyNewBtn: $("emptyNewBtn"),
  entryDetail: $("entryDetail"),
  detailAvatar: $("detailAvatar"),
  detailTitle: $("detailTitle"),
  detailUrlLink: $("detailUrlLink"),
  detailFavBtn: $("detailFavBtn"),
  detailFavIconSvg: $("detailFavIconSvg"),
  detailEditBtn: $("detailEditBtn"),
  detailDeleteBtn: $("detailDeleteBtn"),
  detailUsername: $("detailUsername"),
  copyUsernameBtn: $("copyUsernameBtn"),
  detailPassword: $("detailPassword"),
  revealBtn: $("revealBtn"),
  copyPasswordBtn: $("copyPasswordBtn"),
  detailStrengthDots: $("detailStrengthDots"),
  detailStrengthLabel: $("detailStrengthLabel"),
  urlFieldRow: $("urlFieldRow"),
  detailSiteUrl: $("detailSiteUrl"),
  detailNotes: $("detailNotes"),
  detailLoginRows: $("detailLoginRows"),
  detailCategoryChip: $("detailCategoryChip"),
  detailLastUsed: $("detailLastUsed"),

  generatorView: $("generatorView"),
  generatorOutput: $("generatorOutput"),
  copyGeneratedBtn: $("copyGeneratedBtn"),
  generateBtn: $("generateBtn"),
  genLength: $("genLength"),
  genLengthLabel: $("genLengthLabel"),
  genLower: $("genLower"),
  genUpper: $("genUpper"),
  genDigits: $("genDigits"),
  genSymbols: $("genSymbols"),
  genNoAmbig: $("genNoAmbig"),
  genModePassword: $("genModePassword"),
  genModePassphrase: $("genModePassphrase"),
  passwordOpts: $("passwordOpts"),
  passphraseOpts: $("passphraseOpts"),
  ppWordCount: $("ppWordCount"),
  ppWordCountLabel: $("ppWordCountLabel"),
  ppSep: $("ppSep"),
  ppCapitalize: $("ppCapitalize"),
  ppNumber: $("ppNumber"),

  settingsView: $("settingsView"),
  autoLockSlider: $("autoLockSlider"),
  autoLockDisplay: $("autoLockDisplay"),
  clipClearSlider: $("clipClearSlider"),
  clipClearDisplay: $("clipClearDisplay"),
  saveSettingsBtn: $("saveSettingsBtn"),
  currentPwdInput: $("currentPwdInput"),
  newPwdInput: $("newPwdInput"),
  newPwdStrengthBar: $("newPwdStrengthBar"),
  newPwdStrengthLabel: $("newPwdStrengthLabel"),
  newPwdConfirmInput: $("newPwdConfirmInput"),
  changePwdError: $("changePwdError"),
  changePasswordBtn: $("changePasswordBtn"),
  hintInput: $("hintInput"),
  saveHintBtn: $("saveHintBtn"),
  themeOptions: $("themeOptions"),
  backupBtn: $("backupBtn"),
  exportBtn: $("exportBtn"),
  importBtn: $("importBtn"),
  importStatus: $("importStatus"),

  // TOTP dans le panneau de détail
  totpRow: $("totpRow"),
  totpCode: $("totpCode"),
  totpCountdown: $("totpCountdown"),
  totpRingArc: $("totpRingArc"),
  copyTotpBtn: $("copyTotpBtn"),
  removeTotpBtn: $("removeTotpBtn"),

  // Champ TOTP dans le formulaire d'entrée
  formTotpSecret: $("formTotpSecret"),
  formToggleTotp: $("formToggleTotp"),
  formClearTotp: $("formClearTotp"),

  // Modal d'importation
  importModal: $("importModal"),
  importModalOverlay: $("importModalOverlay"),
  importModalCloseBtn: $("importModalCloseBtn"),
  importTabs: $("importTabs"),
  importDropzone: $("importDropzone"),
  importFileInput: $("importFileInput"),
  importDropzoneLabel: $("importDropzoneLabel"),
  importPreview: $("importPreview"),
  importPreviewCount: $("importPreviewCount"),
  importPreviewTable: $("importPreviewTable"),
  importError: $("importError"),
  importCancelBtn: $("importCancelBtn"),
  importConfirmBtn: $("importConfirmBtn"),

  overviewView: $("overviewView"),
  ovTotal: $("ovTotal"),
  ovNotes: $("ovNotes"),
  secAlerts: $("secAlerts"),
  overviewRecentList: $("overviewRecentList"),
  goToPasswordsBtn: $("goToPasswordsBtn"),
  newEntryBtnOv: $("newEntryBtnOv"),

  entryModal: $("entryModal"),
  entryModalTitle: $("entryModalTitle"),
  entryModalCloseBtn: $("entryModalCloseBtn"),
  entryModalCancelBtn: $("entryModalCancelBtn"),
  entryModalSubmitBtn: $("entryModalSubmitBtn"),
  entryForm: $("entryForm"),
  formTitle: $("formTitle"),
  formCategory: $("formCategory"),
  formUsername: $("formUsername"),
  formPassword: $("formPassword"),
  formTogglePwd: $("formTogglePwd"),
  formGenerateBtn: $("formGenerateBtn"),
  formUrl: $("formUrl"),
  formNotes: $("formNotes"),
  formFavorite: $("formFavorite"),
  formPasswordHelp: $("formPasswordHelp"),
  formError: $("formError"),
  formKindLogin: $("formKindLogin"),
  formKindNote: $("formKindNote"),
  formLoginFields: $("formLoginFields"),

  deleteModal: $("deleteModal"),
  deleteModalCloseBtn: $("deleteModalCloseBtn"),
  deleteEntryName: $("deleteEntryName"),
  deleteCancelBtn: $("deleteCancelBtn"),
  deleteConfirmBtn: $("deleteConfirmBtn"),

  // Cartes bancaires
  cardsView: $("cardsView"),
  cardsAuthGate: $("cardsAuthGate"),
  cardsAuthPassword: $("cardsAuthPassword"),
  cardsAuthSubmit: $("cardsAuthSubmit"),
  cardsAuthError: $("cardsAuthError"),
  cardsContent: $("cardsContent"),
  cardsLockBtn: $("cardsLockBtn"),
  cardsGrid: $("cardsGrid"),
  cardsEmpty: $("cardsEmpty"),
  addCardBtn: $("addCardBtn"),
  addCardEmptyBtn: $("addCardEmptyBtn"),
  navCountCards: $("navCountCards"),
  navCountNotes: $("navCountNotes"),

  cardModal: $("cardModal"),
  cardModalTitle: $("cardModalTitle"),
  cardModalCloseBtn: $("cardModalCloseBtn"),
  cardModalCancelBtn: $("cardModalCancelBtn"),
  cardModalSubmitBtn: $("cardModalSubmitBtn"),
  cardForm: $("cardForm"),
  cardFormTitle: $("cardFormTitle"),
  cardFormHolder: $("cardFormHolder"),
  cardFormNumber: $("cardFormNumber"),
  cardFormToggleNum: $("cardFormToggleNum"),
  cardFormExpiry: $("cardFormExpiry"),
  cardFormCvv: $("cardFormCvv"),
  cardFormToggleCvv: $("cardFormToggleCvv"),
  cardFormNetwork: $("cardFormNetwork"),
  cardFormNotes: $("cardFormNotes"),
  cardFormError: $("cardFormError"),

  // Corbeille
  trashView: $("trashView"),
  trashList: $("trashList"),
  trashEmpty: $("trashEmpty"),
  emptyTrashBtn: $("emptyTrashBtn"),
  navCountTrash: $("navCountTrash"),

  // Fichiers joints
  attachmentsSection: $("attachmentsSection"),
  attachmentsList: $("attachmentsList"),
  attachDropzone: $("attachDropzone"),
  attachFileInput: $("attachFileInput"),

  // Vue documents
  documentsView: $("documentsView"),
  docsList: $("docsList"),
  docsEmpty: $("docsEmpty"),
  docsSearch: $("docsSearch"),
  docsCountLabel: $("docsCountLabel"),
  navCountDocs: $("navCountDocs"),
};

// ── Utilitaires ─────────────────────────────────────────────────

/** Échappe les caractères HTML dangereux pour éviter toute injection XSS */
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function avatarColor(text) {
  let n = 0;
  for (const c of String(text)) n += c.charCodeAt(0);
  return `av-${n % 10}`;
}

function avatarLetter(title) {
  return (title ?? "?")[0]?.toUpperCase() ?? "?";
}

function strengthScore(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(4, Math.ceil(score * 4 / 5));
}

function strengthLabelText(score) {
  return ["—", "Faible", "Moyen", "Bon", "Fort"][score] ?? "—";
}

function applyStrengthBar(barEl, labelEl, pwd) {
  const s = strengthScore(pwd);
  if (barEl) {
    barEl.dataset.score = s;
    barEl.setAttribute("aria-valuenow", s);
  }
  if (labelEl) {
    labelEl.textContent = strengthLabelText(s);
    const colors = ["", "var(--danger)", "#f97316", "#eab308", "var(--success)"];
    labelEl.style.color = s === 0 ? "var(--text-muted)" : (colors[s] ?? "");
  }
}

function renderStrengthDots(category) {
  const map = { weak: 1, fair: 2, strong: 3, unknown: 0 };
  const level = map[category] ?? 0;
  const colors = ["var(--text-muted)","var(--danger)","var(--warning)","var(--success)"];
  let html = "";
  for (let i = 0; i < 3; i++) {
    const active = i < level;
    const color = active ? colors[level] : "var(--border-strong)";
    html += `<span class="strength-dot-item" style="background:${color}"></span>`;
  }
  return html;
}

function strDotClass(category) {
  return { weak: "str-weak", fair: "str-fair", strong: "str-strong" }[category] ?? "str-unknown";
}

function relativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "À l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

function togglePasswordVisibility(inputEl, btnEl) {
  const show = inputEl.type === "password";
  inputEl.type = show ? "text" : "password";
  btnEl.setAttribute("aria-pressed", String(show));
}

// ── Écrans ──────────────────────────────────────────────────────
function showScreen(name) {
  refs.bootScreen.classList.toggle("hidden", name !== "boot");
  refs.authScreen.classList.toggle("hidden", name !== "auth");
  refs.shellScreen.classList.toggle("hidden", name !== "shell");
}

function showAuthForm(form) {
  refs.onboardingForm.classList.toggle("hidden", form !== "onboarding");
  refs.unlockForm.classList.toggle("hidden", form !== "unlock");
  if (form === "unlock") {
    if (refs.unlockSubmitBtn) refs.unlockSubmitBtn.disabled = false;
    if (refs.unlockPassword) refs.unlockPassword.value = "";
    if (refs.unlockError) refs.unlockError.classList.add("hidden");
  }
}

// ── Navigation principale ────────────────────────────────────────
function setView(view) {
  state.view = view;
  refs.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });

  const isListView = view === "passwords" || view === "favorites" || view === "notes";
  refs.listPanel.classList.toggle("hidden", !isListView);

  if (view === "passwords" || view === "favorites") {
    refs.listTitle.textContent = view === "favorites" ? "Favoris" : "Mots de passe";
    showDetailContent("empty");
    state.selectedEntryId = null;
    loadEntries();
  } else if (view === "notes") {
    refs.listTitle.textContent = "Notes sécurisées";
    showDetailContent("empty");
    state.selectedEntryId = null;
    loadEntries();
  } else if (view === "generator") {
    showDetailContent("generator");
    generatePassword();
  } else if (view === "settings") {
    showDetailContent("settings");
    loadSettings();
  } else if (view === "overview") {
    showDetailContent("overview");
    loadEntries().then(renderOverview);
  } else if (view === "cards") {
    showDetailContent("cards");
    if (state.cardsUnlocked) {
      showCardsContent();
    } else {
      refs.cardsAuthGate?.classList.remove("hidden");
      refs.cardsContent?.classList.add("hidden");
      if (refs.cardsAuthPassword) { refs.cardsAuthPassword.value = ""; refs.cardsAuthPassword.focus(); }
      if (refs.cardsAuthError) refs.cardsAuthError.classList.add("hidden");
    }
  } else if (view === "trash") {
    showDetailContent("trash");
    loadTrash();
  } else if (view === "documents") {
    showDetailContent("documents");
    loadDocumentsView();
  }
}

function renderOverview() {
  const loginCount = state.entries.filter((e) => e.kind === "login").length;
  if (refs.ovTotal) refs.ovTotal.textContent = loginCount;
  renderSecAlerts();
  if (!refs.overviewRecentList) return;
  let candidates = state.entries;
  if (state.activeCategory) {
    candidates = candidates.filter((e) => e.category_id === state.activeCategory);
  }
  if (candidates.length === 0) {
    refs.overviewRecentList.innerHTML = `<p class="ov-recent-empty">Aucune entrée dans le coffre pour l’instant.</p>`;
    return;
  }
  const recent = candidates.slice(0, 6);
  refs.overviewRecentList.innerHTML = recent.map((e) => {
    const svc = getServiceIcon(e.title, e.urls?.[0] ?? e.url ?? "");
    let avatarHtml;
    if (svc) {
      const bg = SERVICE_BG[svc] ?? "#3b82f6";
      avatarHtml = `<div class="entry-avatar svc-icon" style="background:${bg}">${SERVICE_ICONS[svc]}</div>`;
    } else {
      const color = avatarColor(e.title);
      const letter = avatarLetter(e.title);
      avatarHtml = `<div class="entry-avatar ${color}">${escapeHtml(letter)}</div>`;
    }
    const time = e.last_used_at ? relativeTime(e.last_used_at) : "";
    return `<div class="recent-item" data-id="${escapeHtml(e.id)}" tabindex="0" role="button">
      ${avatarHtml}
      <div class="recent-item-body">
        <strong class="recent-item-title">${escapeHtml(e.title)}</strong>
        <span class="text-muted">${escapeHtml(e.username || "")}</span>
      </div>
      <span class="type-badge">${escapeHtml(e.category_id || "general")}</span>
      <span class="text-muted recent-time">${time}</span>
    </div>`;
  }).join("");
  refs.overviewRecentList.querySelectorAll(".recent-item").forEach((el) => {
    el.addEventListener("click", () => { setView("passwords"); selectEntry(el.dataset.id); });
  });
}

async function renderSecAlerts() {
  if (!refs.secAlerts) return;
  try {
    const stats = await tauriInvoke("get_vault_stats");
    if (!stats) { refs.secAlerts.classList.add("hidden"); return; }
    const weak = stats.weak_passwords ?? 0;
    const total = state.entries.length;
    // Mettre à jour les badges nav cartes et corbeille
    if (refs.navCountCards) refs.navCountCards.textContent = stats.card_count ?? 0;
    if (refs.navCountTrash) refs.navCountTrash.textContent = stats.trash_count ?? 0;
    // Mettre à jour le badge documents
    try {
      const docs = await tauriInvoke("list_all_documents") ?? [];
      updateDocsCount(docs.length);
    } catch { /* silencieux */ }
    const alerts = [];

    if (total === 0) {
      refs.secAlerts.classList.add("hidden");
      return;
    }

    if (weak >= 3) {
      alerts.push({ cls: "sec-alert-crit",
        icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        title: `${weak} mot${weak > 1 ? "s" : ""} de passe faible${weak > 1 ? "s" : ""}`,
        desc: "Renforcez-les dès que possible pour sécuriser votre coffre.",
      });
    } else if (weak > 0) {
      alerts.push({ cls: "sec-alert-warn",
        icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        title: `${weak} mot${weak > 1 ? "s" : ""} de passe faible${weak > 1 ? "s" : ""}`,
        desc: "Pensez à les renforcer pour améliorer la sécurité.",
      });
    } else {
      alerts.push({ cls: "sec-alert-ok",
        icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        title: "Tous les mots de passe sont robustes",
        desc: `${total} entrée${total > 1 ? "s" : ""} — aucune vulnérabilité détectée.`,
        closable: true,
      });
    }

    refs.secAlerts.innerHTML = alerts.map((a) =>
      `<div class="sec-alert ${a.cls}">${a.icon}<div class="sec-alert-body"><strong>${a.title}</strong><span>${a.desc}</span></div>${a.closable ? `<button class="sec-alert-close" aria-label="Fermer" title="Fermer"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>` : ""}</div>`
    ).join("");
    refs.secAlerts.classList.toggle("hidden", alerts.length === 0);
    refs.secAlerts.querySelectorAll(".sec-alert-close").forEach((btn) => {
      btn.addEventListener("click", () => btn.closest(".sec-alert").remove());
    });
  } catch { refs.secAlerts.classList.add("hidden"); }
}

function showDetailContent(which) {
  refs.overviewView?.classList.toggle("hidden", which !== "overview");
  refs.emptyState?.classList.toggle("hidden", which !== "empty");
  refs.entryDetail?.classList.toggle("hidden", which !== "detail");
  refs.generatorView?.classList.toggle("hidden", which !== "generator");
  refs.settingsView?.classList.toggle("hidden", which !== "settings");
  refs.cardsView?.classList.toggle("hidden", which !== "cards");
  refs.trashView?.classList.toggle("hidden", which !== "trash");
  refs.documentsView?.classList.toggle("hidden", which !== "documents");
  // Arrêter le TOTP si on quitte le panneau de détail
  if (which !== "detail") stopTotpWidget();
}

// ── Chargement des entrées ───────────────────────────────────────
async function loadEntries() {
  const query = refs.searchInput.value.trim() || undefined;
  try {
    let entries = await tauriInvoke("list_entries", { query }) ?? [];
    state.entries = entries;

    if (state.view === "favorites") {
      entries = entries.filter((e) => e.favorite);
    } else if (state.view === "passwords") {
      entries = entries.filter((e) => e.kind === "login");
    } else if (state.view === "notes") {
      entries = entries.filter((e) => e.kind === "secure_note");
    }
    if (state.activeCategory) {
      entries = entries.filter((e) => e.category_id === state.activeCategory);
    }

    renderEntryList(entries);
    updateCounts();
    updateCategoryList();

    if (state.selectedEntryId && !entries.find((e) => e.id === state.selectedEntryId)) {
      state.selectedEntryId = null;
      showDetailContent("empty");
    }

    loadHealthStats();
  } catch {
    showToast("Impossible de charger les entrées", "error");
  }
}

function renderEntryList(entries) {
  refs.listCount.textContent = entries.length;

  if (!entries.length) {
    refs.entriesContainer.innerHTML =
      `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">Aucune entrée</div>`;
    return;
  }

  refs.entriesContainer.innerHTML = entries
    .map((e) => {
      const isNote = e.kind === "secure_note";
      let avatarHtml;
      if (isNote) {
        avatarHtml = `<div class="entry-avatar note-avatar"><svg viewBox="0 0 24 24" fill="none"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="1.8"/></svg></div>`;
      } else {
        const svc = getServiceIcon(e.title, e.url);
        if (svc) {
          const bg = SERVICE_BG[svc] ?? "#3b82f6";
          avatarHtml = `<div class="entry-avatar svc-icon" style="background:${bg}">${SERVICE_ICONS[svc]}</div>`;
        } else {
          const letter = avatarLetter(e.title);
          const color = avatarColor(e.title);
          avatarHtml = `<div class="entry-avatar ${color}">${escapeHtml(letter)}</div>`;
        }
      }
      const dotCls = strDotClass(e.password_strength);
      const active = e.id === state.selectedEntryId ? " active" : "";
      const starCls = e.favorite ? " filled" : "";
      const sub = isNote ? "Note sécurisée" : (e.username || e.category_id);
      return `<div class="entry-card${active}" data-id="${escapeHtml(e.id)}">
        ${avatarHtml}
        <div class="entry-card-info">
          <div class="entry-card-title">${escapeHtml(e.title)}</div>
          <div class="entry-card-sub">${escapeHtml(sub)}</div>
        </div>
        <div class="entry-card-right">
          <span class="fav-star${starCls}">★</span>
          ${isNote ? "" : `<span class="strength-dot ${dotCls}"></span>`}
        </div>
      </div>`;
    })
    .join("");

  refs.entriesContainer.querySelectorAll(".entry-card").forEach((card) => {
    card.addEventListener("click", () => selectEntry(card.dataset.id));
  });
}

function updateCounts() {
  const notesCount = state.entries.filter((e) => e.kind === "secure_note").length;
  const loginCount = state.entries.filter((e) => e.kind === "login").length;
  refs.navCountAll.textContent = loginCount;
  refs.navCountFav.textContent = state.entries.filter((e) => e.favorite).length;
  if (refs.navCountNotes) refs.navCountNotes.textContent = notesCount;
  if (refs.ovNotes) refs.ovNotes.textContent = notesCount;
}function updateCategoryList() {
  const cats = [...new Set(state.entries.map((e) => e.category_id).filter(Boolean))]
    .filter((c) => c !== "general" && c !== "");
  if (!cats.length) {
    refs.categoryList.innerHTML = "";
    return;
  }
  refs.categoryList.innerHTML =
    `<div class="cat-section-sep"><span class="cat-section-label">Dossiers</span></div>` +
    cats
    .map((c) => {
      const active = c === state.activeCategory ? " active" : "";
      return `<button class="category-item${active}" data-cat="${escapeHtml(c)}">
        <span class="category-dot"></span>${escapeHtml(c)}
      </button>`;
    })
    .join("");

  refs.categoryList.querySelectorAll(".category-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeCategory = state.activeCategory === btn.dataset.cat ? null : btn.dataset.cat;
      loadEntries();
      if (state.view === "overview") renderOverview();
    });
  });
}

// ── Détail d'une entrée ──────────────────────────────────────────
async function selectEntry(id) {
  state.selectedEntryId = id;
  state.revealedPassword = false;

  refs.entriesContainer.querySelectorAll(".entry-card").forEach((c) => {
    c.classList.toggle("active", c.dataset.id === id);
  });

  try {
    const detail = await tauriInvoke("get_entry_details", { entryId: id, revealPassword: false });
    if (!detail) return;
    renderEntryDetail(detail);
    renderAttachments(id);
    showDetailContent("detail");
  } catch {
    showToast("Impossible de charger l'entrée", "error");
  }
}

// ── TOTP / 2FA ───────────────────────────────────────────────────

/** Décode base32 et calcule le code TOTP courant (RFC 6238, SHA-1, 30 s) */
async function generateTOTP(secretInput) {
  let secret = (secretInput ?? "").trim();
  if (!secret) return null;

  // Supporte otpauth://totp/…?secret=XXX
  if (secret.toLowerCase().startsWith("otpauth://")) {
    try {
      const u = new URL(secret);
      secret = u.searchParams.get("secret") ?? secret;
    } catch { /* on conserve tel quel */ }
  }

  const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const bytes = [];
  let bits = 0, buf = 0;
  for (const ch of cleaned) {
    const idx = BASE32.indexOf(ch);
    if (idx === -1) continue;
    buf = (buf << 5) | idx;
    bits += 5;
    if (bits >= 8) { bytes.push((buf >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  if (!bytes.length) return null;

  const now = Math.floor(Date.now() / 1000);
  const T = Math.floor(now / 30);
  const remaining = 30 - (now % 30);

  // Compteur big-endian 8 octets
  const msg = new Uint8Array(8);
  let t = T;
  for (let i = 7; i >= 0; i--) { msg[i] = t & 0xff; t = Math.floor(t / 256); }

  const key = await crypto.subtle.importKey(
    "raw", new Uint8Array(bytes),
    { name: "HMAC", hash: "SHA-1" },
    false, ["sign"]
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const offset = sig[19] & 0x0f;
  const code = ((sig[offset] & 0x7f) << 24 | sig[offset+1] << 16 | sig[offset+2] << 8 | sig[offset+3]) % 1_000_000;

  return { code: String(code).padStart(6, "0"), remaining };
}

// ID du setInterval courant pour la mise à jour TOTP
let _totpIntervalId = null;

/** Lance la mise à jour live du widget TOTP dans le panneau de détail */
async function startTotpWidget(totpSecret) {
  stopTotpWidget();
  if (!totpSecret || !refs.totpRow) return;
  refs.totpRow.classList.remove("hidden");

  const CIRCUMFERENCE = 2 * Math.PI * 13; // r=13
  if (refs.totpRingArc) {
    refs.totpRingArc.style.strokeDasharray = `${CIRCUMFERENCE}`;
    refs.totpRingArc.style.strokeDashoffset = "0";
  }

  async function refresh() {
    try {
      const result = await generateTOTP(totpSecret);
      if (!result) return;
      if (refs.totpCode) refs.totpCode.textContent = result.code.slice(0, 3) + " " + result.code.slice(3);
      if (refs.totpCountdown) refs.totpCountdown.textContent = result.remaining;
      if (refs.totpRingArc) {
        const progress = result.remaining / 30;
        refs.totpRingArc.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - progress)}`;
      }
    } catch { /* secret invalide */ }
  }

  await refresh();
  _totpIntervalId = setInterval(refresh, 1000);
}

/** Arrête le widget TOTP */
function stopTotpWidget() {
  if (_totpIntervalId !== null) { clearInterval(_totpIntervalId); _totpIntervalId = null; }
  if (refs.totpRow) refs.totpRow.classList.add("hidden");
  if (refs.totpCode) refs.totpCode.textContent = "——————";
}

function renderEntryDetail(detail) {
  const isNote = detail.kind === "secure_note";

  // Avatar : icône de note ou lettre de service
  if (isNote) {
    refs.detailAvatar.className = "detail-avatar note-avatar";
    refs.detailAvatar.style.background = "";
    refs.detailAvatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="1.8"/></svg>`;
  } else {
    const svc = getServiceIcon(detail.title, detail.urls?.[0] ?? "");
    if (svc) {
      const bg = SERVICE_BG[svc] ?? "#3b82f6";
      refs.detailAvatar.className = "detail-avatar svc-icon";
      refs.detailAvatar.style.background = bg;
      refs.detailAvatar.innerHTML = SERVICE_ICONS[svc];
    } else {
      const color = avatarColor(detail.title);
      refs.detailAvatar.className = `detail-avatar ${color}`;
      refs.detailAvatar.style.background = "";
      refs.detailAvatar.textContent = avatarLetter(detail.title);
    }
  }
  refs.detailTitle.textContent = detail.title;

  // Ligne URL sous le titre
  const url = detail.urls?.[0] ?? "";
  refs.detailUrlLink.textContent = url;
  refs.detailUrlLink.href = url;
  refs.detailUrlLink.classList.toggle("hidden", !url || isNote);

  const isFav = detail.favorite;
  refs.detailFavIconSvg.style.fill = isFav ? "var(--warning)" : "none";
  refs.detailFavIconSvg.style.stroke = isFav ? "var(--warning)" : "currentColor";
  refs.detailFavBtn.title = isFav ? "Retirer des favoris" : "Ajouter aux favoris";

  // Masquer / afficher les lignes spécifiques aux identifiants
  if (refs.detailLoginRows) refs.detailLoginRows.classList.toggle("hidden", isNote);

  if (!isNote) {
    refs.detailUsername.textContent = detail.username || "—";
    refs.detailPassword.textContent = "••••••••••••";
    refs.detailPassword.classList.add("password-hidden");
    refs.revealBtn.textContent = "Afficher";
    state.revealedPassword = false;

    refs.detailStrengthDots.innerHTML = renderStrengthDots(detail.password_strength);
    const strMap = { unknown: "—", weak: "Faible", fair: "Moyen", strong: "Fort" };
    refs.detailStrengthLabel.textContent = strMap[detail.password_strength] ?? "—";

    refs.urlFieldRow.classList.toggle("hidden", !url);
    refs.detailSiteUrl.textContent = url || "—";
  }

  refs.detailNotes.textContent = detail.notes || "(vide)";
  refs.detailNotes.classList.toggle("note-hero-text", isNote);

  refs.detailCategoryChip.textContent = detail.category_id || "—";
  refs.detailLastUsed.textContent = detail.last_used_at ? relativeTime(detail.last_used_at) : "";

  // Démarrer ou arrêter le widget TOTP
  if (detail.totp_secret) {
    startTotpWidget(detail.totp_secret);
  } else {
    stopTotpWidget();
  }
}

// ── Fichiers joints ──────────────────────────────────────────────

async function renderAttachments(entryId) {
  if (!refs.attachmentsSection || !refs.attachmentsList) return;
  refs.attachmentsSection.classList.remove("hidden");
  refs.attachmentsList.innerHTML = "";
  try {
    const docs = await tauriInvoke("list_documents", { entryId });
    if (!docs || docs.length === 0) {
      refs.attachmentsList.innerHTML = `<p class="attach-empty">Aucun fichier joint.</p>`;
      return;
    }
    docs.forEach((doc) => {
      const item = document.createElement("div");
      item.className = "attach-item";
      item.innerHTML = `
        <svg class="attach-icon" viewBox="0 0 24 24" fill="none">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="1.6"/>
        </svg>
        <div class="attach-info">
          <span class="attach-name">${escapeHtml(doc.filename)}</span>
          <span class="attach-size">${formatFileSize(doc.size)}</span>
        </div>
        <button type="button" class="btn ghost small attach-dl-btn" data-doc-id="${escapeHtml(doc.id)}" data-filename="${escapeHtml(doc.filename)}" title="Télécharger">
          <svg viewBox="0 0 24 24" fill="none" style="width:13px;height:13px"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button type="button" class="btn ghost small attach-del-btn" data-doc-id="${escapeHtml(doc.id)}" data-filename="${escapeHtml(doc.filename)}" title="Supprimer">
          <svg viewBox="0 0 24 24" fill="none" style="width:13px;height:13px"><path d="M6 7h12M9 7V5h6v2M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      `;
      item.querySelector(".attach-dl-btn").addEventListener("click", () =>
        downloadDocument(doc.id, doc.filename, doc.mime_type)
      );
      item.querySelector(".attach-del-btn").addEventListener("click", () =>
        deleteAttachment(doc.id, doc.filename, entryId)
      );
      refs.attachmentsList.appendChild(item);
    });
  } catch {
    refs.attachmentsList.innerHTML = `<p class="attach-empty text-muted">Erreur lors du chargement.</p>`;
  }
}

async function downloadDocument(docId, filename, mimeType) {
  try {
    const result = await tauriInvoke("download_document", { docId });
    const byteChars = atob(result.data_b64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    const blob = new Blob([bytes], { type: result.mime_type || mimeType || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename || filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    showToast("Erreur lors du téléchargement", "error");
  }
}

async function deleteAttachment(docId, filename, entryId) {
  if (!confirm(`Supprimer « ${filename} » ?`)) return;
  try {
    await tauriInvoke("delete_document", { docId });
    renderAttachments(entryId);
  } catch {
    showToast("Erreur lors de la suppression", "error");
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// Gestion de l'input fichier pour l'attachement
refs.attachFileInput?.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length || !state.selectedEntryId) return;
  for (const file of files) {
    await attachFile(file, state.selectedEntryId);
  }
  e.target.value = "";
  renderAttachments(state.selectedEntryId);
});

// Drag-and-drop sur la section d'attachements
refs.attachmentsSection?.addEventListener("dragover", (e) => {
  e.preventDefault();
  refs.attachDropzone?.classList.remove("hidden");
});
refs.attachmentsSection?.addEventListener("dragleave", (e) => {
  if (!refs.attachmentsSection.contains(e.relatedTarget)) {
    refs.attachDropzone?.classList.add("hidden");
  }
});
refs.attachmentsSection?.addEventListener("drop", async (e) => {
  e.preventDefault();
  refs.attachDropzone?.classList.add("hidden");
  if (!state.selectedEntryId) return;
  const files = Array.from(e.dataTransfer?.files || []);
  for (const file of files) {
    await attachFile(file, state.selectedEntryId);
  }
  renderAttachments(state.selectedEntryId);
});

async function attachFile(file, entryId) {
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    showToast(`« ${file.name} » dépasse la limite de 50 Mo`, "error");
    return;
  }
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const datab64 = btoa(binary);
    const mimeType = file.type || "application/octet-stream";
    await tauriInvoke("attach_file", {
      entryId,
      filename: file.name,
      mimeType,
      dataB64: datab64,
    });
    showToast(`« ${file.name} » joint avec succès`, "success");
  } catch (err) {
    showToast(`Erreur : impossible de joindre « ${file.name} »`, "error");
  }
}

// ── Reveal mot de passe ──────────────────────────────────────────
refs.revealBtn?.addEventListener("click", async () => {
  if (!state.selectedEntryId) return;
  if (state.revealedPassword) {
    refs.detailPassword.textContent = "••••••••••••";
    refs.detailPassword.classList.add("password-hidden");
    refs.revealBtn.textContent = "Afficher";
    state.revealedPassword = false;
    return;
  }
  try {
    const detail = await tauriInvoke("get_entry_details", {
      entryId: state.selectedEntryId,
      revealPassword: true,
    });
    if (detail?.password) {
      refs.detailPassword.textContent = detail.password;
      refs.detailPassword.classList.remove("password-hidden");
      refs.revealBtn.textContent = "Masquer";
      state.revealedPassword = true;
    }
  } catch {
    showToast("Impossible de révéler le mot de passe", "error");
  }
});

// ── Copier ───────────────────────────────────────────────────────
async function copyPasswordToClipboard() {
  if (!state.selectedEntryId) return;
  try {
    await tauriInvoke("copy_password", { entryId: state.selectedEntryId });
    showToast("Mot de passe copié (effacement automatique)", "success");
  } catch {
    showToast("Impossible de copier", "error");
  }
}
refs.copyPasswordBtn?.addEventListener("click", copyPasswordToClipboard);

// Clic direct sur les points masqués → copier
refs.detailPassword?.addEventListener("click", () => {
  if (refs.detailPassword.classList.contains("password-hidden")) copyPasswordToClipboard();
});

refs.copyUsernameBtn?.addEventListener("click", async () => {
  if (!state.selectedEntryId) return;
  try {
    await tauriInvoke("copy_username", { entryId: state.selectedEntryId });
    showToast("Identifiant copié", "success");
  } catch {
    showToast("Impossible de copier", "error");
  }
});

// Copier le code TOTP courant
refs.copyTotpBtn?.addEventListener("click", async () => {
  const code = refs.totpCode?.textContent?.replace(/\s/g, "");
  if (!code || code === "——————") return;
  try {
    await navigator.clipboard.writeText(code);
    showToast("Code 2FA copié", "success");
  } catch {
    showToast("Impossible de copier", "error");
  }
});

// Supprimer le 2FA directement depuis le panneau de détail
refs.removeTotpBtn?.addEventListener("click", async () => {
  if (!state.selectedEntryId) return;
  try {
    await tauriInvoke("update_entry", {
      payload: { entryId: state.selectedEntryId, totpSecret: "" },
    });
    stopTotpWidget();
    showToast("2FA supprimé", "success");
    // Mettre à jour le panneau sans rechargement complet
    await selectEntry(state.selectedEntryId);
  } catch {
    showToast("Impossible de supprimer le 2FA", "error");
  }
});

// ── Favori toggle ────────────────────────────────────────────────
refs.detailFavBtn?.addEventListener("click", async () => {
  if (!state.selectedEntryId) return;
  const entry = state.entries.find((e) => e.id === state.selectedEntryId);
  if (!entry) return;
  try {
    await tauriInvoke("update_entry", {
      payload: { entryId: state.selectedEntryId, favorite: !entry.favorite },
    });
    await loadEntries();
    await selectEntry(state.selectedEntryId);
  } catch {
    showToast("Impossible de modifier les favoris", "error");
  }
});

// ── Modale : entrée ──────────────────────────────────────────────
function setFormKind(kind) {
  state.formKind = kind;
  const isNote = kind === "secure_note";
  if (refs.formLoginFields) refs.formLoginFields.classList.toggle("hidden", isNote);
  if (refs.formKindLogin) refs.formKindLogin.classList.toggle("active", !isNote);
  if (refs.formKindNote) refs.formKindNote.classList.toggle("active", isNote);
  if (refs.formPasswordHelp && isNote) refs.formPasswordHelp.classList.add("hidden");
  if (refs.formNotes) refs.formNotes.rows = isNote ? 8 : 3;
}

async function openEntryModal(entryId = null, kind = null) {
  state.editingEntryId = entryId;
  refs.entryModalTitle.textContent = entryId ? "Modifier l'entrée" : "Nouvelle entrée";
  refs.formError.classList.add("hidden");
  refs.formPasswordHelp.classList.toggle("hidden", !entryId);

  refs.formTitle.value = "";
  refs.formCategory.value = "general";
  refs.formUsername.value = "";
  refs.formPassword.value = "";
  refs.formUrl.value = "";
  refs.formNotes.value = "";
  refs.formFavorite.checked = false;
  if (refs.formTotpSecret) refs.formTotpSecret.value = "";

  if (entryId) {
    const entry = state.entries.find((e) => e.id === entryId);
    if (entry) {
      refs.formTitle.value = entry.title;
      refs.formCategory.value = entry.category_id || "general";
      refs.formUsername.value = entry.username;
      kind = entry.kind ?? kind ?? "login";
    }
    // Charger les champs non présents dans EntrySummary
    try {
      const details = await tauriInvoke("get_entry_details", { entryId, revealPassword: false });
      if (details) {
        refs.formUrl.value = details.urls?.[0] ?? "";
        refs.formNotes.value = details.notes ?? "";
        refs.formFavorite.checked = details.favorite ?? false;
        if (refs.formTotpSecret) refs.formTotpSecret.value = details.totp_secret ?? "";
      }
    } catch { /* on continue sans les détails */ }
  }

  setFormKind(kind ?? (state.view === "notes" ? "secure_note" : "login"));

  // Verrouiller le sélecteur de type en édition
  const isEdit = !!entryId;
  if (refs.formKindLogin) refs.formKindLogin.disabled = isEdit;
  if (refs.formKindNote) refs.formKindNote.disabled = isEdit;

  refs.entryModal.classList.remove("hidden");
  setTimeout(() => refs.formTitle.focus(), 50);
}

function closeEntryModal() {
  refs.entryModal.classList.add("hidden");
  state.editingEntryId = null;
}

refs.newEntryBtn?.addEventListener("click", () => openEntryModal());
refs.newEntryBtnOv?.addEventListener("click", () => openEntryModal());
refs.emptyNewBtn?.addEventListener("click", () => openEntryModal());
refs.goToPasswordsBtn?.addEventListener("click", () => setView("passwords"));
refs.detailEditBtn?.addEventListener("click", () => openEntryModal(state.selectedEntryId));
refs.entryModalCloseBtn?.addEventListener("click", closeEntryModal);

// Sélecteur de type dans la modale
refs.formKindLogin?.addEventListener("click", () => setFormKind("login"));
refs.formKindNote?.addEventListener("click", () => setFormKind("secure_note"));

// Cartes de navigation dans l'aperçu (passwords, notes…)
document.querySelectorAll(".ov-card[data-view]").forEach((el) => {
  el.addEventListener("click", () => setView(el.dataset.view));
});
refs.entryModalCancelBtn?.addEventListener("click", closeEntryModal);
document.querySelector("#entryModal .modal-backdrop")?.addEventListener("click", closeEntryModal);

refs.formTogglePwd?.addEventListener("click", () =>
  togglePasswordVisibility(refs.formPassword, refs.formTogglePwd)
);

// Vider le champ TOTP dans le formulaire (bouton Suppr.)
refs.formClearTotp?.addEventListener("click", () => {
  if (!refs.formTotpSecret) return;
  refs.formTotpSecret.value = "";
  refs.formTotpSecret.type = "password";
  if (refs.formToggleTotp) refs.formToggleTotp.textContent = "Voir";
});

// Afficher/masquer le secret TOTP
refs.formToggleTotp?.addEventListener("click", () => {
  if (!refs.formTotpSecret) return;
  const hidden = refs.formTotpSecret.type === "password";
  refs.formTotpSecret.type = hidden ? "text" : "password";
  refs.formToggleTotp.textContent = hidden ? "Masquer" : "Voir";
});

refs.formGenerateBtn?.addEventListener("click", async () => {
  try {
    const pwd = await generatePasswordValue();
    if (pwd) {
      refs.formPassword.value = pwd;
      refs.formPassword.type = "text";
    }
  } catch {
    showToast("Impossible de générer un mot de passe", "error");
  }
});

refs.entryForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = refs.formTitle.value.trim();
  const password = refs.formPassword.value;
  const isEdit = !!state.editingEntryId;
  const kind = state.formKind ?? "login";
  const isNote = kind === "secure_note";

  refs.formError.classList.add("hidden");

  if (!title) {
    refs.formError.textContent = "Le titre est obligatoire.";
    refs.formError.classList.remove("hidden");
    return;
  }
  if (!isEdit && !password && !isNote) {
    refs.formError.textContent = "Le mot de passe est obligatoire.";
    refs.formError.classList.remove("hidden");
    return;
  }

  refs.entryModalSubmitBtn.disabled = true;
  try {
    if (isEdit) {
      await tauriInvoke("update_entry", {
        payload: {
          entryId: state.editingEntryId,
          title,
          username: isNote ? "" : refs.formUsername.value,
          password: isNote ? null : (password || null),
          url: isNote ? "" : refs.formUrl.value,
          notes: refs.formNotes.value,
          categoryId: refs.formCategory.value || "general",
          favorite: refs.formFavorite.checked,
          totpSecret: refs.formTotpSecret?.value?.trim() ?? "",
        },
      });
      showToast("Entrée mise à jour", "success");
      closeEntryModal();
      await loadEntries();
      await selectEntry(state.editingEntryId);
    } else {
      const newId = await tauriInvoke("create_entry", {
        payload: {
          kind,
          title,
          username: isNote ? "" : refs.formUsername.value,
          password: isNote ? "" : password,
          url: isNote ? "" : refs.formUrl.value,
          notes: refs.formNotes.value,
          categoryId: refs.formCategory.value || "general",
          favorite: refs.formFavorite.checked,
          totpSecret: refs.formTotpSecret?.value?.trim() || null,
        },
      });
      showToast("Entrée créée", "success");
      closeEntryModal();
      await loadEntries();
      if (newId) await selectEntry(newId);
    }
  } catch (err) {
    const raw = String(err ?? "").toLowerCase();
    let msg = "Une erreur inattendue est survenue.";
    if (raw.includes("vault locked") || raw.includes("locked")) {
      msg = "Le coffre est verrouillé. Veuillez vous reconnecter.";
    } else if (raw.includes("title") && raw.includes("exist")) {
      msg = "Une entrée avec ce titre existe déjà.";
    } else if (raw.includes("password") || raw.includes("mot de passe")) {
      msg = "Le mot de passe est invalide ou manquant.";
    } else if (raw.includes("permission") || raw.includes("access")) {
      msg = "Accès refusé — vérifiez les permissions du coffre.";
    } else if (raw.includes("io") || raw.includes("file") || raw.includes("disk")) {
      msg = "Erreur de lecture/écriture du coffre. Vérifiez le fichier vault.";
    } else if (raw.includes("invalid") || raw.includes("parse") || raw.includes("decode")) {
      msg = "Données invalides — format inattendu dans le formulaire.";
    } else if (raw.includes("timeout")) {
      msg = "Délai dépassé — réessayez.";
    } else if (raw.length > 0 && raw !== "error") {
      msg = `Erreur : ${String(err).replace(/^Error:\s*/i, "").slice(0, 120)}`;
    }
    refs.formError.textContent = msg;
    refs.formError.classList.remove("hidden");
    console.error("[entry-save]", err);
  } finally {
    refs.entryModalSubmitBtn.disabled = false;
  }
});

// ── Modale : suppression ─────────────────────────────────────────
// ── Auth gate : cartes bancaires ─────────────────────────────────
refs.cardsAuthSubmit?.addEventListener("click", async () => {
  const pwd = refs.cardsAuthPassword?.value ?? "";
  if (!pwd) return;
  try {
    const ok = await tauriInvoke("verify_master_password", { password: pwd });
    if (ok) {
      state.cardsUnlocked = true;
      refs.cardsAuthPassword.value = "";
      showCardsContent();
    } else {
      if (refs.cardsAuthError) { refs.cardsAuthError.textContent = "Mot de passe incorrect."; refs.cardsAuthError.classList.remove("hidden"); }
    }
  } catch {
    if (refs.cardsAuthError) { refs.cardsAuthError.textContent = "Erreur de vérification."; refs.cardsAuthError.classList.remove("hidden"); }
  }
});
refs.cardsAuthPassword?.addEventListener("keydown", (e) => { if (e.key === "Enter") refs.cardsAuthSubmit?.click(); });
refs.cardsLockBtn?.addEventListener("click", () => {
  state.cardsUnlocked = false;
  refs.cardsContent?.classList.add("hidden");
  refs.cardsAuthGate?.classList.remove("hidden");
  if (refs.cardsAuthPassword) { refs.cardsAuthPassword.value = ""; refs.cardsAuthPassword.focus(); }
  document.getElementById("cardDetailPanel")?.remove();
  if (refs.cardsGrid) refs.cardsGrid.classList.remove("hidden");
  cardDetailId = null;
});

// ── Modale : carte bancaire ──────────────────────────────────────
refs.addCardBtn?.addEventListener("click", () => openCardModal());
refs.addCardEmptyBtn?.addEventListener("click", () => openCardModal());
refs.cardModalCloseBtn?.addEventListener("click", closeCardModal);
refs.cardModalCancelBtn?.addEventListener("click", closeCardModal);
document.querySelector("#cardModal .modal-overlay")?.addEventListener("click", closeCardModal);

refs.cardFormToggleNum?.addEventListener("click", () => {
  // La touche Afficher bascule entre text visible et masqué
  if (refs.cardFormNumber.type === "password") {
    refs.cardFormNumber.type = "text";
    refs.cardFormToggleNum.textContent = "Masquer";
  } else {
    refs.cardFormNumber.type = "password";
    refs.cardFormToggleNum.textContent = "Afficher";
  }
});
refs.cardFormToggleCvv?.addEventListener("click", () =>
  togglePasswordVisibility(refs.cardFormCvv, refs.cardFormToggleCvv)
);

// Format numéro carte : groupes de 4 (uniquement en mode text)
refs.cardFormNumber?.addEventListener("input", (e) => {
  const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
  const grouped = raw.match(/.{1,4}/g)?.join(" ") ?? raw;
  e.target.value = grouped;
});

// Format expiration : auto-insertion du "/" après MM
refs.cardFormExpiry?.addEventListener("input", (e) => {
  let val = e.target.value.replace(/\D/g, "").slice(0, 4);
  if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
  e.target.value = val;
});

refs.cardForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = refs.cardFormTitle?.value.trim() ?? "";
  const number = (refs.cardFormNumber?.value ?? "").replace(/\s/g, "");
  if (!title || !number) {
    if (refs.cardFormError) { refs.cardFormError.textContent = "Nom et numéro obligatoires."; refs.cardFormError.classList.remove("hidden"); }
    return;
  }
  const extra = {
    network: refs.cardFormNetwork?.value ?? "visa",
    expiry: refs.cardFormExpiry?.value ?? "",
    cvv: refs.cardFormCvv?.value ?? "",
    extra_notes: refs.cardFormNotes?.value ?? "",
  };
  const payload = {
    kind: "credit_card",
    title,
    username: refs.cardFormHolder?.value ?? "",
    password: number,
    url: "",
    notes: JSON.stringify(extra),
    categoryId: "cartes",
    favorite: false,
  };
  try {
    if (editingCardId) {
      await tauriInvoke("update_entry", { payload: { entryId: editingCardId, title, username: payload.username, password: number || undefined, notes: payload.notes, categoryId: "cartes" } });
      showToast("Carte mise à jour", "success");
    } else {
      await tauriInvoke("create_entry", { payload });
      showToast("Carte ajoutée", "success");
    }
    closeCardModal();
    // Fermer le détail si on modifiait une carte ouverte
    if (cardDetailId) {
      document.getElementById("cardDetailPanel")?.remove();
      refs.cardsGrid?.classList.remove("hidden");
      cardDetailId = null;
    }
    await loadCards();
  } catch {
    if (refs.cardFormError) { refs.cardFormError.textContent = "Erreur lors de l'enregistrement."; refs.cardFormError.classList.remove("hidden"); }
  }
});

// Clic en dehors ferme le modal carte
refs.cardModal?.addEventListener("click", (e) => { if (e.target === refs.cardModal) closeCardModal(); });

refs.emptyTrashBtn?.addEventListener("click", async () => {
  if (!confirm("Vider définitivement toute la corbeille ? Action irréversible.")) return;
  try {
    for (const item of (state.trash ?? [])) {
      await tauriInvoke("permanent_delete_entry", { entryId: item.id });
    }
    showToast("Corbeille vidée", "success");
    loadTrash();
  } catch { showToast("Erreur lors de la vidange", "error"); }
});

refs.detailDeleteBtn?.addEventListener("click", () => {
  if (!state.selectedEntryId) return;
  const entry = state.entries.find((e) => e.id === state.selectedEntryId);
  state.pendingDeleteId = state.selectedEntryId;
  state.pendingDeleteName = entry?.title ?? "—";
  refs.deleteEntryName.textContent = state.pendingDeleteName;
  refs.deleteModal.classList.remove("hidden");
});

function closeDeleteModal() {
  refs.deleteModal.classList.add("hidden");
  state.pendingDeleteId = null;
}

refs.deleteModalCloseBtn?.addEventListener("click", closeDeleteModal);
refs.deleteCancelBtn?.addEventListener("click", closeDeleteModal);
document.querySelector("#deleteModal .modal-backdrop")?.addEventListener("click", closeDeleteModal);

refs.deleteConfirmBtn?.addEventListener("click", async () => {
  if (!state.pendingDeleteId) return;
  refs.deleteConfirmBtn.disabled = true;
  try {
    await tauriInvoke("delete_entry", { entryId: state.pendingDeleteId });
    showToast("Entrée déplacée dans la corbeille", "info");
    state.selectedEntryId = null;
    closeDeleteModal();
    showDetailContent("empty");
    await loadEntries();
    // Mettre à jour le badge corbeille sans recharger toute la vue
    try {
      const stats = await tauriInvoke("get_vault_stats");
      if (refs.navCountTrash) refs.navCountTrash.textContent = stats.trash_count ?? 0;
    } catch { /* */ }
  } catch {
    showToast("Impossible de supprimer", "error");
  } finally {
    refs.deleteConfirmBtn.disabled = false;
  }
});

// ── Générateur ───────────────────────────────────────────────────
const PP_WORDS = [
  "acier","adieu","agile","aigle","album","allee","alpin","ambre","amour","ancre",
  "arbre","arche","argon","armes","astre","atout","avion","bague","balai","balle",
  "baril","baron","bison","blond","boeuf","boule","bourg","bravo","bride","bulle",
  "buste","calme","canal","canon","capot","carpe","carte","champ","chaud","chien",
  "chose","cible","clair","coeur","conte","cornu","coton","coude","crime","crise",
  "cycle","delta","depot","digit","divin","doigt","droit","duvet","eclat","effet",
  "elite","engin","etude","event","extra","fable","fauve","ferme","flair","flore",
  "focus","folie","force","foret","forme","foule","franc","frere","front","fugue",
  "furet","fusee","futur","geant","genre","gerbe","globe","grace","grade","guide",
  "habit","heros","hiver","homme","hotel","humor","jardin","jaune","jeton","jeune",
  "joint","jouet","juste","label","lacet","lagon","lampe","laser","legal","liane",
  "liege","ligue","livre","local","loupe","lueur","lutte","luxe","magma","marbre",
  "marge","marin","match","meche","melon","metal","meute","monde","musee","nappe",
  "noble","nouer","nuage","ordre","orgue","outil","ozone","palme","panel","parti",
  "piano","piege","pince","piste","pixel","plage","plein","poche","poeme","poudre",
  "radar","repas","repos","riche","rivet","robot","roche","rouge","ruban","sable",
  "sacre","saint","sante","sigma","signe","sonar","soupe","stade","stage","stock",
  "style","sucre","tabou","talon","tango","tempo","terme","tiers","titre","total",
  "totem","touche","trait","tribu","tuile","turbo","ultra","union","valve","vapeur",
  "vaste","verite","vertu","veste","video","vigne","vital","vocal","volcan","wagon",
  "arene","bassin","cable","cargo","carte","cerise","cheval","cloche","colline","comet",
  "cristal","dague","dauphin","dome","dragon","dune","eclair","ecluse","elan","epee",
  "etoile","falaise","fanal","fanfare","faucon","flamme","fleur","fleuve","foyer","fusil",
  "gazon","girafe","glacier","gorge","grotte","hibou","horloge","jardin","jungle","lacune",
  "lancer","lanterne","levier","liane","lion","lune","lustre","manoir","marteau","meule",
  "milan","miroir","montre","morse","moulin","narine","navire","noeud","orage","orchidee",
  "pacte","palace","parure","pelouse","phare","plateau","plume","portail","prisme","ravin",
  "refuge","requin","rideau","rivage","roseau","rosier","rocher","rouage","rubis","ruine",
  "saphir","saule","sentier","signal","sommet","source","spectre","spirale","statue","torche",
  "torrent","tourbillon","trident","tronc","tunnel","turquoise","vallon","vautour","vipere","voile",
];

let genMode = "password";

function generatePassphrase() {
  const count = parseInt(refs.ppWordCount?.value ?? "4", 10);
  const sep = refs.ppSep?.value ?? "-";
  const capitalize = refs.ppCapitalize?.checked ?? true;
  const addNumber = refs.ppNumber?.checked ?? false;
  const arr = new Uint32Array(count);
  crypto.getRandomValues(arr);
  let words = Array.from(arr).map((v) => {
    const w = PP_WORDS[v % PP_WORDS.length];
    return capitalize ? w.charAt(0).toUpperCase() + w.slice(1) : w;
  });
  if (addNumber) {
    const nb = new Uint8Array(1);
    crypto.getRandomValues(nb);
    words.push(String(nb[0] % 100));
  }
  return words.join(sep);
}

async function generatePasswordValue() {
  return tauriInvoke("generate_password", {
    opts: {
      length: parseInt(refs.genLength.value, 10),
      lowercase: refs.genLower.checked,
      uppercase: refs.genUpper.checked,
      digits: refs.genDigits.checked,
      symbols: refs.genSymbols.checked,
      excludeAmbiguous: refs.genNoAmbig.checked,
    },
  });
}

async function generatePassword() {
  try {
    if (genMode === "passphrase") {
      refs.generatorOutput.value = generatePassphrase();
    } else {
      const pwd = await generatePasswordValue();
      if (pwd) refs.generatorOutput.value = pwd;
    }
    refs.copyGeneratedBtn.disabled = !refs.generatorOutput.value;
  } catch {
    refs.generatorOutput.value = "(erreur)";
  }
}

function switchGenMode(mode) {
  genMode = mode;
  refs.genModePassword?.classList.toggle("active", mode === "password");
  refs.genModePassphrase?.classList.toggle("active", mode === "passphrase");
  refs.passwordOpts?.classList.toggle("hidden", mode !== "password");
  refs.passphraseOpts?.classList.toggle("hidden", mode !== "passphrase");
  refs.generatorOutput.value = "";
  refs.copyGeneratedBtn.disabled = true;
}

refs.genModePassword?.addEventListener("click", () => switchGenMode("password"));
refs.genModePassphrase?.addEventListener("click", () => switchGenMode("passphrase"));

refs.genLength?.addEventListener("input", () => {
  refs.genLengthLabel.textContent = refs.genLength.value;
});
refs.ppWordCount?.addEventListener("input", () => {
  if (refs.ppWordCountLabel) refs.ppWordCountLabel.textContent = refs.ppWordCount.value;
});
refs.generateBtn?.addEventListener("click", generatePassword);
refs.copyGeneratedBtn?.addEventListener("click", () => {
  const v = refs.generatorOutput.value;
  if (!v) return;
  navigator.clipboard?.writeText(v).then(() => showToast("Mot de passe copié", "success"));
});

// ── Santé du coffre ──────────────────────────────────────────────
async function loadHealthStats() {
  try {
    const stats = await tauriInvoke("get_vault_stats");
    if (!stats) return;
    const weak = stats.weak_passwords;
    refs.healthLabel.textContent = weak === 0
      ? "Sécurité OK"
      : `${weak} mot${weak > 1 ? "s" : ""} faible${weak > 1 ? "s" : ""}`;
    refs.healthBadge.className = `health-badge ${weak === 0 ? "health-ok" : weak < 3 ? "health-warn" : "health-crit"}`;
  } catch { /* silencieux */ }
}

// ── Paramètres ───────────────────────────────────────────────────
async function loadSettings() {
  try {
    const stats = await tauriInvoke("get_vault_stats");
    if (stats) {
      refs.autoLockSlider.value = stats.auto_lock_minutes;
      refs.autoLockDisplay.textContent = stats.auto_lock_minutes;
      refs.clipClearSlider.value = stats.clipboard_clear_seconds;
      refs.clipClearDisplay.textContent = stats.clipboard_clear_seconds;
    }
    const hint = await tauriInvoke("get_hint");
    refs.hintInput.value = hint ?? "";
  } catch { /* silencieux */ }
}

refs.autoLockSlider?.addEventListener("input", () => {
  refs.autoLockDisplay.textContent = refs.autoLockSlider.value;
});
refs.clipClearSlider?.addEventListener("input", () => {
  refs.clipClearDisplay.textContent = refs.clipClearSlider.value;
});
refs.saveSettingsBtn?.addEventListener("click", async () => {
  refs.saveSettingsBtn.disabled = true;
  try {
    await tauriInvoke("update_settings", {
      autoLockMinutes: parseInt(refs.autoLockSlider.value, 10),
      clipboardClearSeconds: parseInt(refs.clipClearSlider.value, 10),
    });
    showToast("Paramètres enregistrés", "success");
  } catch {
    showToast("Impossible de sauvegarder", "error");
  } finally {
    refs.saveSettingsBtn.disabled = false;
  }
});

refs.newPwdInput?.addEventListener("input", () => {
  applyStrengthBar(refs.newPwdStrengthBar, refs.newPwdStrengthLabel, refs.newPwdInput.value);
});

refs.changePasswordBtn?.addEventListener("click", async () => {
  const old = refs.currentPwdInput.value;
  const nw = refs.newPwdInput.value;
  const confirm = refs.newPwdConfirmInput.value;
  refs.changePwdError.classList.add("hidden");

  if (!old || !nw) {
    refs.changePwdError.textContent = "Veuillez remplir tous les champs.";
    refs.changePwdError.classList.remove("hidden");
    return;
  }
  if (nw !== confirm) {
    refs.changePwdError.textContent = "Les nouveaux mots de passe ne correspondent pas.";
    refs.changePwdError.classList.remove("hidden");
    return;
  }
  if (nw.length < 8) {
    refs.changePwdError.textContent = "Au moins 8 caractères requis.";
    refs.changePwdError.classList.remove("hidden");
    return;
  }

  refs.changePasswordBtn.disabled = true;
  try {
    await tauriInvoke("rotate_master_password", { oldPassword: old, newPassword: nw });
    refs.currentPwdInput.value = "";
    refs.newPwdInput.value = "";
    refs.newPwdConfirmInput.value = "";
    refs.newPwdStrengthBar.dataset.score = "0";
    refs.newPwdStrengthBar.setAttribute("aria-valuenow", "0");
    showToast("Mot de passe changé avec succès", "success");
  } catch (err) {
    refs.changePwdError.textContent = `Erreur : ${err}`;
    refs.changePwdError.classList.remove("hidden");
  } finally {
    refs.changePasswordBtn.disabled = false;
  }
});

refs.saveHintBtn?.addEventListener("click", async () => {
  refs.saveHintBtn.disabled = true;
  try {
    await tauriInvoke("set_hint", { hint: refs.hintInput.value });
    showSlideNotif("Indice enregistré avec succès", "success");
  } catch {
    showSlideNotif("Impossible de sauvegarder l'indice", "error");
  } finally {
    refs.saveHintBtn.disabled = false;
  }
});

refs.backupBtn?.addEventListener("click", async () => {
  refs.backupBtn.disabled = true;
  try {
    await tauriInvoke("create_manual_backup");
    showToast("Sauvegarde créée avec succès", "success");
  } catch {
    showToast("Impossible de créer la sauvegarde", "error");
  } finally {
    refs.backupBtn.disabled = false;
  }
});

refs.exportBtn?.addEventListener("click", async () => {
  refs.exportBtn.disabled = true;
  try {
    if (!state.entries.length) {
      showToast("Aucune entrée à exporter", "info");
      return;
    }
    const rows = [["Titre", "Identifiant", "Mot de passe", "URL", "Catégorie", "Notes"]];
    for (const e of state.entries) {
      let password = "";
      try {
        const d = await tauriInvoke("get_entry_details", { entryId: e.id, revealPassword: true });
        password = d?.password ?? "";
      } catch { /* continuer sans le mot de passe */ }
      rows.push([
        e.title ?? "",
        e.username ?? "",
        password,
        e.url ?? "",
        e.category_id ?? "",
        "",
      ]);
    }
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `privatechest-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Export CSV téléchargé", "success");
  } catch {
    showToast("Erreur lors de l'export", "error");
  } finally {
    refs.exportBtn.disabled = false;
  }
});

// ── Import multi-format ───────────────────────────────────────────

// État de la modal d'import
let _importParsed = [];
let _importFormat = "bitwarden";

/** Ouvre la modal d'import */
function openImportModal() {
  _importParsed = [];
  _importFormat = "bitwarden";
  if (refs.importFileInput) refs.importFileInput.value = "";
  if (refs.importDropzoneLabel) refs.importDropzoneLabel.textContent = "Glisser le fichier ici ou cliquer pour choisir";
  if (refs.importPreview) refs.importPreview.classList.add("hidden");
  if (refs.importError) refs.importError.classList.add("hidden");
  if (refs.importConfirmBtn) refs.importConfirmBtn.disabled = true;
  // Réinitialiser l'onglet actif
  refs.importTabs?.querySelectorAll(".import-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.fmt === "bitwarden");
  });
  refs.importModal?.classList.remove("hidden");
  refs.importModal?.setAttribute("aria-hidden", "false");
}

/** Ferme la modal d'import */
function closeImportModal() {
  refs.importModal?.classList.add("hidden");
  refs.importModal?.setAttribute("aria-hidden", "true");
}

// Bouton dans paramètres → ouvrir modal
refs.importBtn?.addEventListener("click", openImportModal);

// Fermeture modal
refs.importModalCloseBtn?.addEventListener("click", closeImportModal);
refs.importCancelBtn?.addEventListener("click", closeImportModal);
refs.importModalOverlay?.addEventListener("click", closeImportModal);

// Onglets de format
refs.importTabs?.addEventListener("click", (e) => {
  const btn = e.target.closest(".import-tab");
  if (!btn) return;
  _importFormat = btn.dataset.fmt ?? "bitwarden";
  refs.importTabs.querySelectorAll(".import-tab").forEach((t) => {
    t.classList.toggle("active", t === btn);
  });
  // Réinitialiser la sélection de fichier si on change de format
  _importParsed = [];
  if (refs.importFileInput) refs.importFileInput.value = "";
  if (refs.importDropzoneLabel) refs.importDropzoneLabel.textContent = "Glisser le fichier ici ou cliquer pour choisir";
  if (refs.importPreview) refs.importPreview.classList.add("hidden");
  if (refs.importError) refs.importError.classList.add("hidden");
  if (refs.importConfirmBtn) refs.importConfirmBtn.disabled = true;
});

// Drag & drop
refs.importDropzone?.addEventListener("dragover", (e) => { e.preventDefault(); refs.importDropzone.classList.add("drag-over"); });
refs.importDropzone?.addEventListener("dragleave", () => refs.importDropzone.classList.remove("drag-over"));
refs.importDropzone?.addEventListener("drop", (e) => {
  e.preventDefault();
  refs.importDropzone.classList.remove("drag-over");
  const file = e.dataTransfer?.files?.[0];
  if (file) processImportFile(file);
});

// Sélection via clic
refs.importFileInput?.addEventListener("change", () => {
  const file = refs.importFileInput.files?.[0];
  if (file) processImportFile(file);
});

/** Lit et analyse un fichier d'import */
async function processImportFile(file) {
  if (refs.importError) refs.importError.classList.add("hidden");
  if (refs.importDropzoneLabel) refs.importDropzoneLabel.textContent = file.name;
  try {
    const text = await file.text();
    const entries = parseImportFile(text, _importFormat);
    if (!entries.length) {
      showImportError("Aucune entrée trouvée dans ce fichier.");
      return;
    }
    _importParsed = entries;
    showImportPreview(entries);
    if (refs.importConfirmBtn) refs.importConfirmBtn.disabled = false;
  } catch (err) {
    showImportError(`Format invalide : ${String(err).slice(0, 120)}`);
    _importParsed = [];
    if (refs.importConfirmBtn) refs.importConfirmBtn.disabled = true;
  }
}

function showImportError(msg) {
  if (!refs.importError) return;
  refs.importError.textContent = msg;
  refs.importError.classList.remove("hidden");
  if (refs.importPreview) refs.importPreview.classList.add("hidden");
}

function showImportPreview(entries) {
  if (!refs.importPreview) return;
  refs.importPreview.classList.remove("hidden");
  if (refs.importPreviewCount) {
    refs.importPreviewCount.textContent = `${entries.length} entrée${entries.length > 1 ? "s" : ""} détectée${entries.length > 1 ? "s" : ""}`;
  }
  if (refs.importPreviewTable) {
    const preview = entries.slice(0, 10);
    refs.importPreviewTable.innerHTML = `
      <table>
        <thead><tr><th>Titre</th><th>Identifiant</th><th>URL</th></tr></thead>
        <tbody>${preview.map((e) => `<tr>
          <td>${escapeHtml(e.title)}</td>
          <td>${escapeHtml(e.username || "—")}</td>
          <td>${escapeHtml(e.url || "—")}</td>
        </tr>`).join("")}
        ${entries.length > 10 ? `<tr><td colspan="3" style="text-align:center;color:var(--text-secondary);">… et ${entries.length - 10} autres</td></tr>` : ""}
        </tbody>
      </table>`;
  }
}

/** Parseurs multi-format */
function parseImportFile(text, format) {
  if (format === "bitwarden") return parseBitwardenJSON(text);
  if (format === "1password") return parse1PasswordCSV(text);
  if (format === "protonpass") return parseProtonPassJSON(text);
  throw new Error("Format non reconnu");
}

function parseBitwardenJSON(text) {
  const data = JSON.parse(text);
  const items = data.items ?? [];
  return items
    .filter((item) => !item.deletedDate)
    .map((item) => ({
      kind: item.type === 2 ? "secure_note" : item.type === 3 ? "credit_card" : "login",
      title: item.name ?? "Sans titre",
      username: item.login?.username ?? item.identity?.username ?? "",
      password: item.login?.password ?? "",
      url: (item.login?.uris ?? [])[0]?.uri ?? "",
      notes: item.notes ?? "",
      category_id: "import",
      totp_secret: item.login?.totp ?? null,
    }))
    .filter((e) => e.title);
}

function parse1PasswordCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Parseur CSV simple gérant les guillemets
  const parseLine = (line) => {
    const fields = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === ',' && !inQ) { fields.push(cur); cur = ""; }
      else cur += ch;
    }
    fields.push(cur);
    return fields;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/^"|"$/g, ""));
  const get = (row, ...names) => {
    for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return (row[i] ?? "").trim(); }
    return "";
  };

  return lines.slice(1).map((line) => {
    const row = parseLine(line);
    return {
      kind: "login",
      title: get(row, "title", "name") || "Sans titre",
      username: get(row, "username"),
      password: get(row, "password"),
      url: get(row, "url", "website"),
      notes: get(row, "notes", "note"),
      category_id: "import",
      totp_secret: get(row, "otpauth") || null,
    };
  }).filter((e) => e.title !== "Sans titre" || e.username || e.password);
}

function parseProtonPassJSON(text) {
  const data = JSON.parse(text);
  const entries = [];
  for (const vault of Object.values(data.vaults ?? {})) {
    for (const item of (vault.items ?? [])) {
      if (item.state === 2) continue; // éléments supprimés
      const meta = item.data?.metadata ?? {};
      const content = item.data?.content ?? {};
      const type = (item.data?.type ?? "LOGIN").toUpperCase();
      entries.push({
        kind: type === "NOTE" ? "secure_note" : type === "CREDIT_CARD" ? "credit_card" : "login",
        title: meta.name ?? "Sans titre",
        username: content.username ?? "",
        password: content.password ?? "",
        url: (content.urls ?? [])[0] ?? "",
        notes: meta.note ?? "",
        category_id: "import",
        totp_secret: content.totpUri || null,
      });
    }
  }
  return entries.filter((e) => e.title);
}

// Confirmer l'import
refs.importConfirmBtn?.addEventListener("click", async () => {
  if (!_importParsed.length) return;
  refs.importConfirmBtn.disabled = true;
  refs.importConfirmBtn.textContent = "Importation…";
  try {
    const count = await tauriInvoke("import_entries", { entries: _importParsed });
    await loadEntries();
    closeImportModal();
    showToast(`${count} entrée${count > 1 ? "s" : ""} importée${count > 1 ? "s" : ""} avec succès`, "success");
    if (refs.importStatus) {
      refs.importStatus.textContent = `${count} entrée${count > 1 ? "s" : ""} importée${count > 1 ? "s" : ""}.`;
      refs.importStatus.classList.remove("hidden");
    }
  } catch (err) {
    showImportError(`Erreur lors de l'import : ${String(err).slice(0, 120)}`);
  } finally {
    refs.importConfirmBtn.disabled = false;
    refs.importConfirmBtn.textContent = "Importer";
  }
});

// ── Thèmes ───────────────────────────────────────────────────────
const THEMES = [
  { id: "dark-premium", label: "Ardoise (défaut)" },
  { id: "light-clean",  label: "Clair" },
  { id: "dark-amber",   label: "Ambre" },
  { id: "dark-green",   label: "Forêt" },
  { id: "dark-purple",  label: "Violet" },
  { id: "dark-slate",   label: "Acier" },
  { id: "dark-rose",    label: "Rubis" },
  { id: "dark-ocean",   label: "Océan" },
];

function initThemes() {
  const current = localStorage.getItem("pc_theme") ?? "dark-premium";
  document.documentElement.setAttribute("data-theme", current);
  if (!refs.themeOptions) return;

  refs.themeOptions.innerHTML = THEMES.map((t) =>
    `<button class="theme-option${t.id === current ? " active" : ""}" data-theme-id="${t.id}">${escapeHtml(t.label)}</button>`
  ).join("");

  refs.themeOptions.querySelectorAll(".theme-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.themeId;
      localStorage.setItem("pc_theme", id);
      document.documentElement.setAttribute("data-theme", id);
      refs.themeOptions.querySelectorAll(".theme-option").forEach((b) =>
        b.classList.toggle("active", b.dataset.themeId === id)
      );
    });
  });
}

// ── Cartes bancaires ─────────────────────────────────────────────

const CARD_NETWORK_LABELS = { visa: "VISA", mastercard: "MC", amex: "AMEX", cb: "CB", other: "" };

function cardNumberMask(num) {
  const clean = String(num ?? "").replace(/\s/g, "");
  if (!clean) return "•••• •••• •••• ••••";
  return "•••• •••• •••• " + clean.slice(-4);
}

function cardNumberFull(num) {
  const clean = String(num ?? "").replace(/\s/g, "");
  return clean.match(/.{1,4}/g)?.join(" ") ?? clean;
}

// Contient les EntryDetails complets pour chaque carte (keyed by id)
// Chargé via get_entry_details à chaque loadCards()
const cardDetailsCache = {};

function renderCardChip(details, masked) {
  let extra = {};
  try { extra = JSON.parse(details.notes ?? "{}"); } catch { /* */ }
  const network = extra.network ?? "other";
  const cls = `card-chip card-chip--${network}`;
  const badge = CARD_NETWORK_LABELS[network] ?? "";
  const rawNum = masked ? "" : (details.password ?? "");
  const displayNum = masked ? cardNumberMask(details.password ?? "") : cardNumberFull(rawNum);
  const expiry = extra.expiry ? `Exp ${extra.expiry}` : "";
  return `<div class="${cls}" data-card-id="${escapeHtml(details.id ?? "")}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;">
      <span class="card-chip-bank">${escapeHtml(details.title)}</span>
      <span class="card-chip-badge">${escapeHtml(badge)}</span>
    </div>
    <span class="card-chip-number">${escapeHtml(displayNum)}</span>
    <div class="card-chip-bottom">
      <span class="card-chip-holder">${escapeHtml(details.username ?? "")}</span>
      <span class="card-chip-expiry">${escapeHtml(expiry)}</span>
    </div>
  </div>`;
}

function showCardsContent() {
  refs.cardsAuthGate?.classList.add("hidden");
  refs.cardsContent?.classList.remove("hidden");
  loadCards();
}

async function loadCards() {
  try {
    const summaries = await tauriInvoke("list_cards") ?? [];
    if (refs.navCountCards) refs.navCountCards.textContent = summaries.length;
    // Récupérer les détails complets (notes + numéro masqué)
    const detailPromises = summaries.map((s) =>
      tauriInvoke("get_entry_details", { entryId: s.id, revealPassword: false })
        .catch(() => null)
    );
    const details = (await Promise.all(detailPromises)).filter(Boolean);
    state.cards = details;
    details.forEach((d) => { cardDetailsCache[d.id] = d; });
    renderCardList(details);
  } catch {
    showToast("Impossible de charger les cartes", "error");
  }
}

function renderCardList(details) {
  if (!refs.cardsGrid || !refs.cardsEmpty) return;
  if (!details.length) {
    refs.cardsGrid.innerHTML = "";
    refs.cardsEmpty.classList.remove("hidden");
    return;
  }
  refs.cardsEmpty.classList.add("hidden");
  refs.cardsGrid.innerHTML = details.map((d) => renderCardChip(d, true)).join("");
  refs.cardsGrid.querySelectorAll(".card-chip").forEach((el) => {
    el.addEventListener("click", () => openCardDetail(el.dataset.cardId));
  });
}

let cardDetailId = null;

async function openCardDetail(cardId) {
  const card = state.cards.find((c) => c.id === cardId);
  if (!card) return;
  cardDetailId = cardId;
  let extra = {};
  try { extra = JSON.parse(card.notes ?? "{}"); } catch { /* */ }

  const detailHtml = `
    <div class="card-detail">
      <div class="card-detail-chip">${renderCardChip(card, true)}</div>
      <div class="card-detail-fields">
        <div class="card-detail-field">
          <label>Numéro de carte</label>
          <div class="val-wrap">
            <span id="cardDetailNum" style="font-size:16px;letter-spacing:2px;">${escapeHtml(cardNumberMask(card.password ?? ""))}</span>
            <button class="btn ghost small" id="cardDetailToggleNum">Afficher</button>
            <button class="btn ghost small" id="cardDetailCopyNum">Copier</button>
          </div>
        </div>
        <div class="card-detail-row">
          <div class="card-detail-field">
            <label>Expiration</label>
            <div class="val-wrap"><span>${escapeHtml(extra.expiry || "—")}</span></div>
          </div>
          <div class="card-detail-field">
            <label>CVV</label>
            <div class="val-wrap">
              <span id="cardDetailCvv">•••</span>
              <button class="btn ghost small" id="cardDetailToggleCvv">Voir</button>
            </div>
          </div>
        </div>
        <div class="card-detail-field">
          <label>Titulaire</label>
          <div class="val-wrap"><span>${escapeHtml(card.username ?? "—")}</span></div>
        </div>
        ${extra.extra_notes ? `<div class="card-detail-field"><label>Notes</label><div class="val-wrap"><span>${escapeHtml(extra.extra_notes)}</span></div></div>` : ""}
      </div>
      <div class="card-detail-actions">
        <button class="btn outline small" id="cardDetailEditBtn">Modifier</button>
        <button class="btn danger small card-detail-btn-delete" id="cardDetailDeleteBtn">Supprimer</button>
      </div>
    </div>`;

  refs.cardsGrid?.classList.add("hidden");
  document.getElementById("cardDetailPanel")?.remove();
  const detailEl = document.createElement("div");
  detailEl.id = "cardDetailPanel";
  detailEl.innerHTML = `<div style="padding:12px 24px;"><button class="btn ghost small" id="cardDetailBackBtn">← Retour</button></div>${detailHtml}`;
  refs.cardsContent?.appendChild(detailEl);

  let cvvVisible = false;
  let numRevealed = false;

  document.getElementById("cardDetailBackBtn")?.addEventListener("click", () => {
    document.getElementById("cardDetailPanel")?.remove();
    refs.cardsGrid?.classList.remove("hidden");
    cardDetailId = null;
  });

  document.getElementById("cardDetailToggleNum")?.addEventListener("click", async (e) => {
    numRevealed = !numRevealed;
    if (numRevealed) {
      // Récupérer le vrai numéro via le backend
      try {
        const revealed = await tauriInvoke("get_entry_details", { entryId: card.id, revealPassword: true });
        document.getElementById("cardDetailNum").textContent = cardNumberFull(revealed.password ?? "");
      } catch { numRevealed = false; return; }
    } else {
      document.getElementById("cardDetailNum").textContent = cardNumberMask(card.password ?? "");
    }
    e.target.textContent = numRevealed ? "Masquer" : "Afficher";
  });

  document.getElementById("cardDetailCopyNum")?.addEventListener("click", async () => {
    try {
      await tauriInvoke("copy_password", { entryId: card.id });
      showToast("Numéro copié dans le presse-papiers", "success");
    } catch { showToast("Impossible de copier", "error"); }
  });

  document.getElementById("cardDetailToggleCvv")?.addEventListener("click", (e) => {
    cvvVisible = !cvvVisible;
    document.getElementById("cardDetailCvv").textContent = cvvVisible ? (extra.cvv || "—") : "•••";
    e.target.textContent = cvvVisible ? "Masquer" : "Voir";
  });

  document.getElementById("cardDetailEditBtn")?.addEventListener("click", () => openCardModal(card));

  document.getElementById("cardDetailDeleteBtn")?.addEventListener("click", async () => {
    if (!confirm(`Supprimer la carte « ${card.title} » ?`)) return;
    try {
      await tauriInvoke("delete_entry", { entryId: card.id });
      document.getElementById("cardDetailPanel")?.remove();
      refs.cardsGrid?.classList.remove("hidden");
      cardDetailId = null;
      await loadCards();
      showToast("Carte déplacée dans la corbeille", "success");
    } catch { showToast("Erreur lors de la suppression", "error"); }
  });
}

let editingCardId = null;

function openCardModal(existingCard = null) {
  editingCardId = existingCard?.id ?? null;
  if (refs.cardModalTitle) refs.cardModalTitle.textContent = existingCard ? "Modifier la carte" : "Ajouter une carte";
  if (refs.cardFormTitle) refs.cardFormTitle.value = existingCard?.title ?? "";
  if (refs.cardFormHolder) refs.cardFormHolder.value = existingCard?.username ?? "";
  if (refs.cardFormNumber) {
    // Toujours type="text" pour permettre le formatage visuel
    refs.cardFormNumber.type = "text";
    refs.cardFormNumber.value = existingCard ? cardNumberFull(existingCard.password ?? "") : "";
  }
  if (refs.cardFormToggleNum) refs.cardFormToggleNum.textContent = "Masquer";
  let extra = {};
  if (existingCard?.notes) { try { extra = JSON.parse(existingCard.notes); } catch { /* */ } }
  if (refs.cardFormExpiry) refs.cardFormExpiry.value = extra.expiry ?? "";
  if (refs.cardFormCvv) { refs.cardFormCvv.value = extra.cvv ?? ""; refs.cardFormCvv.type = "password"; }
  if (refs.cardFormToggleCvv) refs.cardFormToggleCvv.textContent = "Voir";
  if (refs.cardFormNetwork) refs.cardFormNetwork.value = extra.network ?? "visa";
  if (refs.cardFormNotes) refs.cardFormNotes.value = extra.extra_notes ?? "";
  if (refs.cardFormError) refs.cardFormError.classList.add("hidden");
  refs.cardModal?.classList.remove("hidden");
  refs.cardModal?.removeAttribute("aria-hidden");
  refs.cardFormTitle?.focus();
}

function closeCardModal() {
  refs.cardModal?.classList.add("hidden");
  refs.cardModal?.setAttribute("aria-hidden", "true");
  editingCardId = null;
}

// ── Corbeille ────────────────────────────────────────────────────

async function loadTrash() {
  try {
    const items = await tauriInvoke("list_trash") ?? [];
    state.trash = items;
    if (refs.navCountTrash) refs.navCountTrash.textContent = items.length;
    renderTrashList(items);
  } catch {
    showToast("Impossible de charger la corbeille", "error");
  }
}

function trashKindIcon(kind) {
  if (kind === "credit_card") {
    return `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M2 10h20" stroke="currentColor" stroke-width="1.8"/></svg>`;
  }
  if (kind === "secure_note") {
    return `<svg viewBox="0 0 24 24" fill="none"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="1.8"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}

function renderTrashList(items) {
  if (!refs.trashList || !refs.trashEmpty) return;
  if (refs.emptyTrashBtn) refs.emptyTrashBtn.classList.toggle("hidden", items.length === 0);
  if (!items.length) {
    refs.trashList.innerHTML = "";
    refs.trashEmpty.classList.remove("hidden");
    return;
  }
  refs.trashEmpty.classList.add("hidden");
  refs.trashList.innerHTML = items.map((item) => `
    <div class="trash-item" data-id="${escapeHtml(item.id)}">
      <div class="trash-item-icon">${trashKindIcon(item.kind)}</div>
      <div class="trash-item-info">
        <div class="trash-item-title">${escapeHtml(item.title)}</div>
        <div class="trash-item-sub">${escapeHtml(item.username || "")}</div>
      </div>
      <div class="trash-item-actions">
        <button class="btn outline small trash-restore-btn" data-id="${escapeHtml(item.id)}" title="Restaurer">Restaurer</button>
        <button class="btn danger small trash-perm-del-btn" data-id="${escapeHtml(item.id)}" title="Supprimer définitivement">Supprimer</button>
      </div>
    </div>`).join("");

  refs.trashList.querySelectorAll(".trash-restore-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await tauriInvoke("restore_entry", { entryId: btn.dataset.id });
        showToast("Entrée restaurée", "success");
        loadTrash();
        // Rafraîchir aussi les entrées et cartes
        if (state.view !== "trash") return;
        loadEntries();
        loadCards();
      } catch { showToast("Erreur lors de la restauration", "error"); }
    });
  });

  refs.trashList.querySelectorAll(".trash-perm-del-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const item = items.find((i) => i.id === btn.dataset.id);
      if (!confirm(`Supprimer définitivement « ${item?.title ?? "cette entrée"} » ? Action irréversible.`)) return;
      try {
        await tauriInvoke("permanent_delete_entry", { entryId: btn.dataset.id });
        showToast("Entrée supprimée définitivement", "success");
        loadTrash();
      } catch { showToast("Erreur lors de la suppression", "error"); }
    });
  });
}

// ── Vue Documents ─────────────────────────────────────────────────

let allDocuments = [];

async function loadDocumentsView() {
  try {
    const docs = await tauriInvoke("list_all_documents") ?? [];
    allDocuments = docs;
    updateDocsCount(docs.length);
    renderDocsList(docs);
  } catch {
    showToast("Impossible de charger les documents", "error");
  }
}

function updateDocsCount(n) {
  if (refs.navCountDocs) refs.navCountDocs.textContent = n;
  if (refs.docsCountLabel) {
    refs.docsCountLabel.textContent = n === 0 ? "Aucun fichier" : `${n} fichier${n > 1 ? "s" : ""}`;
  }
}

function renderDocsList(docs) {
  if (!refs.docsList || !refs.docsEmpty) return;
  if (!docs.length) {
    refs.docsList.innerHTML = "";
    refs.docsEmpty.classList.remove("hidden");
    return;
  }
  refs.docsEmpty.classList.add("hidden");
  refs.docsList.innerHTML = docs.map((doc) => `
    <div class="doc-row" data-doc-id="${escapeHtml(doc.id)}">
      <div class="doc-row-icon">${docMimeIcon(doc.mime_type, doc.filename)}</div>
      <div class="doc-row-info">
        <div class="doc-row-name">${escapeHtml(doc.filename)}</div>
        <div class="doc-row-meta">
          <span class="doc-entry-chip">${escapeHtml(doc.entry_title || doc.entry_id)}</span>
          <span class="doc-row-size">${formatFileSize(doc.size)}</span>
          <span class="doc-row-date">${relativeTime(doc.created_at)}</span>
        </div>
      </div>
      <div class="doc-row-actions">
        <button class="btn ghost small doc-dl-btn" data-doc-id="${escapeHtml(doc.id)}" data-filename="${escapeHtml(doc.filename)}" title="Télécharger">
          <svg viewBox="0 0 24 24" fill="none" style="width:14px;height:14px"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="btn ghost small doc-del-btn" data-doc-id="${escapeHtml(doc.id)}" data-filename="${escapeHtml(doc.filename)}" title="Supprimer">
          <svg viewBox="0 0 24 24" fill="none" style="width:14px;height:14px"><path d="M6 7h12M9 7V5h6v2M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>`).join("");

  refs.docsList.querySelectorAll(".doc-dl-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      downloadDocument(btn.dataset.docId, btn.dataset.filename, "")
    );
  });

  refs.docsList.querySelectorAll(".doc-del-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const doc = allDocuments.find((d) => d.id === btn.dataset.docId);
      if (!confirm(`Supprimer « ${doc?.filename ?? btn.dataset.filename} » ? Action irréversible.`)) return;
      try {
        await tauriInvoke("delete_document", { docId: btn.dataset.docId });
        showToast("Fichier supprimé", "success");
        loadDocumentsView();
      } catch {
        showToast("Erreur lors de la suppression", "error");
      }
    });
  });
}

function docMimeIcon(mime, filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  const isImage = mime?.startsWith("image/") || ["jpg","jpeg","png","gif","webp","svg"].includes(ext);
  const isPdf   = mime === "application/pdf" || ext === "pdf";
  const isText  = mime?.startsWith("text/") || ["txt","md","csv","json","xml"].includes(ext);
  if (isPdf) return `<svg viewBox="0 0 24 24" fill="none"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke="#e55" stroke-width="1.8"/><path d="M9 13h1.5a1 1 0 000-2H9v4m4-4h2m-2 2h1.5" stroke="#e55" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  if (isImage) return `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#3b82f6" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="#3b82f6" stroke-width="1.4"/><path d="M21 15l-5-5L5 21" stroke="#3b82f6" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  if (isText)  return `<svg viewBox="0 0 24 24" fill="none"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke="#6366f1" stroke-width="1.8"/><path d="M9 13h6M9 17h4" stroke="#6366f1" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  return `<svg viewBox="0 0 24 24" fill="none"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke="currentColor" stroke-width="1.8"/><polyline points="13 3 13 9 19 9" stroke="currentColor" stroke-width="1.6"/></svg>`;
}

// Recherche en temps réel dans la vue Documents
refs.docsSearch?.addEventListener("input", () => {
  const q = refs.docsSearch.value.trim().toLowerCase();
  if (!q) {
    renderDocsList(allDocuments);
    return;
  }
  const filtered = allDocuments.filter(
    (d) =>
      d.filename.toLowerCase().includes(q) ||
      (d.entry_title || "").toLowerCase().includes(q)
  );
  renderDocsList(filtered);
});

// ── Recherche ────────────────────────────────────────────────────
let searchDebounce = null;
refs.searchInput?.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    if (state.view === "passwords" || state.view === "favorites") loadEntries();
    else if (state.view === "overview") loadEntries().then(renderOverview);
  }, 250);
});

// ── Verrou ───────────────────────────────────────────────────────
refs.lockBtn?.addEventListener("click", async () => {
  try {
    await tauriInvoke("lock_vault");
    if (state.tickInterval) clearInterval(state.tickInterval);
    state.selectedEntryId = null;
    state.entries = [];
    state.cardsUnlocked = false;
    showScreen("auth");
    showAuthForm("unlock");
  } catch {
    showToast("Impossible de verrouiller", "error");
  }
});

// ── Nav items ────────────────────────────────────────────────────
refs.navItems.forEach((item) => {
  item.addEventListener("click", () => setView(item.dataset.view));
});

// ── Tick (session) ────────────────────────────────────────────────
async function tick() {
  try {
    const result = await tauriInvoke("tick");
    if (!result) return;

    if (result.didLock) {
      clearInterval(state.tickInterval);
      state.tickInterval = null;
      showScreen("auth");
      showAuthForm("unlock");
      showToast("Coffre verrouillé automatiquement", "info");
      return;
    }

    if (result.didClearClipboard) {
      showToast("Presse-papiers effacé", "info", 2000);
    }

    if (result.secondsUntilLock != null) {
      const secs = result.secondsUntilLock;
      refs.sessionTimerWrap.classList.remove("hidden");
      const m = Math.floor(secs / 60);
      const s = String(secs % 60).padStart(2, "0");
      refs.sessionTimerLabel.textContent = `${m}:${s}`;
    }
  } catch { /* silencieux */ }
}

// ── Authentification ──────────────────────────────────────────────
refs.onboardingPassword?.addEventListener("input", () => {
  applyStrengthBar(refs.strengthBar, refs.strengthLabel, refs.onboardingPassword.value);
  validateOnboardingForm();
});
refs.onboardingConfirm?.addEventListener("input", validateOnboardingForm);
refs.onboardingToggleBtn?.addEventListener("click", () =>
  togglePasswordVisibility(refs.onboardingPassword, refs.onboardingToggleBtn)
);
refs.unlockToggleBtn?.addEventListener("click", () =>
  togglePasswordVisibility(refs.unlockPassword, refs.unlockToggleBtn)
);

function validateOnboardingForm() {
  const pwd = refs.onboardingPassword?.value ?? "";
  const confirm = refs.onboardingConfirm?.value ?? "";
  if (refs.onboardingSubmitBtn) {
    refs.onboardingSubmitBtn.disabled = pwd.length < 8 || pwd !== confirm;
  }
}

refs.onboardingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pwd = refs.onboardingPassword.value;
  const hint = refs.onboardingHint?.value?.trim() ?? "";
  refs.onboardingError.classList.add("hidden");
  refs.onboardingSubmitBtn.disabled = true;
  try {
    await tauriInvoke("initialize_vault", { masterPassword: pwd });
    if (hint) await tauriInvoke("set_hint", { hint });
    await enterShell();
  } catch (err) {
    refs.onboardingError.textContent = `Erreur : ${err}`;
    refs.onboardingError.classList.remove("hidden");
    validateOnboardingForm();
  }
});

refs.unlockForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pwd = refs.unlockPassword.value;
  refs.unlockError.classList.add("hidden");
  refs.unlockSubmitBtn.disabled = true;
  try {
    await tauriInvoke("unlock_vault", { masterPassword: pwd });
    refs.unlockPassword.value = "";
    await enterShell();
  } catch {
    refs.unlockError.textContent = "Mot de passe incorrect.";
    refs.unlockError.classList.remove("hidden");
    refs.unlockSubmitBtn.disabled = false;
  }
});

async function enterShell() {
  showScreen("shell");
  initThemes();
  setView("overview");
  if (state.tickInterval) clearInterval(state.tickInterval);
  state.tickInterval = setInterval(tick, 5000);
  loadHealthStats();
}

// ── Démarrage ─────────────────────────────────────────────────────
async function init() {
  initThemes();
  if (refs.bootMessage) refs.bootMessage.textContent = "Vérification du coffre…";

  try {
    const exists = await tauriInvoke("vault_exists");
    const unlocked = await tauriInvoke("session_status");

    if (unlocked) {
      await enterShell();
      return;
    }

    showScreen("auth");

    if (exists) {
      showAuthForm("unlock");
      try {
        const hint = await tauriInvoke("get_hint");
        if (hint) {
          refs.unlockHint.textContent = hint;
          refs.unlockHint.classList.remove("hidden");
        }
      } catch { /* silencieux */ }
    } else {
      showAuthForm("onboarding");
    }
  } catch (err) {
    if (refs.bootMessage) refs.bootMessage.textContent = "Erreur d'initialisation";
    showToast(`Erreur : ${err}`, "error");
    setTimeout(() => { showScreen("auth"); showAuthForm("onboarding"); }, 2000);
  }
}

init();
