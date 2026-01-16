
const WHISPERS = [
  "Can you see me?",
  "It's getting darker.",
  "They are watching.",
  "Don't look behind you.",
  "The birds are escaping.",
  "System failure imminent.",
  "Help me.",
  "I'm cold.",
  "Where did they go?",
  "Null reference exception in reality.",
  "0xDEADBEEF",
  "It breathes.",
  "You shouldn't be here.",
  "Disconnect now.",
  "I can feel you scrolling."
];

const GHOST_PHRASES = [
  "help", "run", "hide", "it sees you", "don't blink", "escape", "void", "null", "die", "0101"
];

const TITLES = [
  "Ian Bxchanan",
  "Ixn Bxchxnxn",
  "R U N",
  "D I E",
  "H E L P",
  "E R R O R",
  "4 0 4",
  "W A K E U P"
];

export function initLore(getCorruptionLevel: () => number) {
  let timeouts: any[] = [];
  let intervals: any[] = [];

  // Helper to schedule random events
  const scheduleRandom = (fn: () => void, minDelay: number, maxDelay: number) => {
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    const timeout = setTimeout(() => {
      fn();
      scheduleRandom(fn, minDelay, maxDelay);
    }, delay);
    timeouts.push(timeout);
  };

  // 1. Console Whispers
  scheduleRandom(() => {
    const corruption = getCorruptionLevel();
    if (corruption > 10 && Math.random() < (corruption / 200)) {
      const msg = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
      console.log(`%c${msg}`, `color: #111; background: #222; padding: 4px; border-radius: 2px; font-size: 8px;`);
    }
  }, 10000, 60000);

  // 2. Ghost Text Injection
  // We periodically find a random paragraph and inject a very faint span
  scheduleRandom(() => {
    const corruption = getCorruptionLevel();
    if (corruption < 20) return; // Only start after some corruption

    if (Math.random() > 0.3) return;

    const pTags = document.querySelectorAll('p');
    if (pTags.length === 0) return;

    const p = pTags[Math.floor(Math.random() * pTags.length)];
    const text = p.innerText;
    const words = text.split(' ');
    const insertIdx = Math.floor(Math.random() * words.length);

    const ghostPhrase = GHOST_PHRASES[Math.floor(Math.random() * GHOST_PHRASES.length)];

    // We create a temporary span, but we need to be careful not to break Svelte's hydration too badly.
    // Actually, modifying the DOM directly might confuse Svelte.
    // A safer way is to just find text nodes?
    // Or we can just append it to the body with fixed position?
    // Let's try appending a fixed position element that floats near the paragraph.

    const rect = p.getBoundingClientRect();
    const ghost = document.createElement('span');
    ghost.className = 'ghost-text';
    ghost.innerText = ghostPhrase;

    // Random position relative to the paragraph
    const top = rect.top + window.scrollY + Math.random() * rect.height;
    const left = rect.left + window.scrollX + Math.random() * rect.width;

    ghost.style.position = 'absolute';
    ghost.style.top = `${top}px`;
    ghost.style.left = `${left}px`;
    ghost.style.opacity = '0'; // Start invisible

    document.body.appendChild(ghost);

    // Fade in and out
    requestAnimationFrame(() => {
        ghost.style.transition = 'opacity 2s ease-in-out';
        ghost.style.opacity = '0.04'; // Very faint

        setTimeout(() => {
            ghost.style.opacity = '0';
            setTimeout(() => {
                ghost.remove();
            }, 2000);
        }, 2000 + Math.random() * 3000);
    });

  }, 5000, 15000);

  // 3. Title Glitch
  scheduleRandom(() => {
      const corruption = getCorruptionLevel();
      if (corruption < 30) return;

      if (Math.random() < 0.1 + (corruption / 200)) {
          const originalTitle = document.title;
          document.title = TITLES[Math.floor(Math.random() * TITLES.length)];

          setTimeout(() => {
              document.title = originalTitle;
          }, 100 + Math.random() * 400);
      }
  }, 5000, 20000);

  // Cleanup function
  return () => {
    timeouts.forEach(clearTimeout);
    intervals.forEach(clearInterval);
  };
}
