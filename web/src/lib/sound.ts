let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

// Browsers only allow audio playback after a real user gesture on the page.
// Without this, the first notification chime of a session can silently fail
// if it fires before the user has clicked/tapped anything.
if (typeof window !== "undefined") {
  const unlock = () => {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function playTones(
  tones: { freq: number; start: number; duration: number; peak?: number }[],
) {
  if (typeof window === "undefined") return;

  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    for (const { freq, start, duration, peak = 0.25 } of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(peak, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    }
  } catch {
    // audio not available in this environment — fail silently
  }
}

// A teammate submitted proof on a task you don't own.
export function playNotificationSound() {
  playTones([
    { freq: 880, start: 0, duration: 0.15 },
    { freq: 1320, start: 0.12, duration: 0.2 },
  ]);
}

// You finished a task (submitted your own proof).
export function playTaskFinishedSound() {
  playTones([
    { freq: 523, start: 0, duration: 0.12 },
    { freq: 659, start: 0.1, duration: 0.12 },
    { freq: 784, start: 0.2, duration: 0.3, peak: 0.28 },
  ]);
}

// A star rating was submitted.
export function playRatingSound() {
  playTones([{ freq: 1046, start: 0, duration: 0.09, peak: 0.2 }]);
}

// A new task was created.
export function playTaskCreatedSound() {
  playTones([
    { freq: 660, start: 0, duration: 0.08, peak: 0.18 },
    { freq: 880, start: 0.07, duration: 0.12, peak: 0.2 },
  ]);
}

// A generic success toast (no more specific sound applies).
export function playSuccessToastSound() {
  playTones([{ freq: 740, start: 0, duration: 0.08, peak: 0.15 }]);
}

// An error or blocked-action toast.
export function playErrorToastSound() {
  playTones([
    { freq: 300, start: 0, duration: 0.12, peak: 0.18 },
    { freq: 220, start: 0.1, duration: 0.16, peak: 0.18 },
  ]);
}

export type ToastSoundType =
  | "success"
  | "error"
  | "created"
  | "rated"
  | "finished"
  | "none";

export function playToastSound(type: ToastSoundType) {
  switch (type) {
    case "success":
      playSuccessToastSound();
      break;
    case "error":
      playErrorToastSound();
      break;
    case "created":
      playTaskCreatedSound();
      break;
    case "rated":
      playRatingSound();
      break;
    case "finished":
      playTaskFinishedSound();
      break;
    case "none":
      break;
  }
}
