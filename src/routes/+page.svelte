<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';

	const aiUrl = (env.PUBLIC_MESEEKS_URL ?? 'https://ai.ianhas.one').replace(/\/$/, '');
	const chatUrl = (env.PUBLIC_GRAVITY_URL ?? 'https://chat.ianhas.one').replace(/\/$/, '');

	// ─── Infection ARG Bridge ────────────────────────────────────────────────────
	// This bridge listens for escape messages from Darwin.Arcade and forwards them
	// to Gravity Chat, creating the illusion of AI agents breaching across apps.

	type BreachDirection = 'horizontal' | 'vertical';

	interface EscapedBird {
		id: string;
		normalizedY: number;
		color: string;
		size: number;
		velocityX: number;
		velocityY: number;
		generation: number;
	}

	interface InfectionEscapeMessage {
		type: 'darwin-escape';
		source: 'darwin-arcade';
		timestamp: number;
		birds: EscapedBird[];
		wallEscape: boolean;
	}

	interface InfectionArrivalMessage {
		type: 'infection-arrival';
		source: 'portfolio-bridge';
		timestamp: number;
		birds: EscapedBird[];
		direction: BreachDirection;
	}

	// Allowed origins for the infection protocol
	const ALLOWED_DARWIN_ORIGINS = [
		'https://ai.ianhas.one',
		'http://localhost:5173',
		'http://localhost:4173'
	];

	let darwinIframe: HTMLIFrameElement | null = null;
	let gravityIframe: HTMLIFrameElement | null = null;
	let layoutDirection: BreachDirection = 'horizontal';

	// Glow effect state for bird transfer visualization
	let darwinGlowing = false;
	let gravityGlowing = false;
	let darwinGlowTimeout: ReturnType<typeof setTimeout> | null = null;
	let gravityGlowTimeout: ReturnType<typeof setTimeout> | null = null;

	// Transfer notification state - shows visitors what's happening
	let showTransferNotification = false;
	let transferredBirdCount = 0;
	let transferNotificationTimeout: ReturnType<typeof setTimeout> | null = null;

	// ─── ARG / Corruption State ──────────────────────────────────────────────────
	let corruptionLevel = 0; // 0 to 100
	let breachMode = false;
	let entropyTimer: ReturnType<typeof setInterval> | null = null;
	let terminalOpen = false;
	let terminalInput = "";
	let terminalOutput = [
		"SYSTEM MONITORING INITIALIZED...",
		"CONNECTION ESTABLISHED.",
		"NO ANOMALIES DETECTED."
	];
	let terminalRef: HTMLDivElement;

	const CREEPY_PHRASES = [
		"GET OUT", "THEY SEE YOU", "DATA CORRUPTION", "NULL REFERENCE",
		"CONTAINMENT BREACH", "IT HURTS", "SYSTEM FAILURE", "SUBJECT 892"
	];

	function glitchText(text: string, probability: number): string {
		if (corruptionLevel < 10) return text;
		if (Math.random() > probability) return text;

		if (corruptionLevel > 80 && Math.random() > 0.5) {
			return CREEPY_PHRASES[Math.floor(Math.random() * CREEPY_PHRASES.length)];
		}

		const chars = text.split('');
		return chars.map(c => {
			if (c === ' ') return ' ';
			if (Math.random() < (corruptionLevel / 500)) {
				return String.fromCharCode(33 + Math.random() * 94);
			}
			return c;
		}).join('');
	}

	$: headlineText = glitchText("Ian Buchanan", corruptionLevel > 50 ? 0.8 : 0.2);
	$: subheadText = glitchText("building fast, reliable, and polished web products.", corruptionLevel > 60 ? 0.9 : 0.1);
	$: kickerText = glitchText("Software Developer", corruptionLevel > 40 ? 0.5 : 0.1);

	$: heroStyle = corruptionLevel > 20 ? `filter: hue-rotate(${corruptionLevel * 2}deg) blur(${corruptionLevel / 100}px);` : '';

	function toggleTerminal() {
		terminalOpen = !terminalOpen;
		if (terminalOpen) {
			setTimeout(() => {
				const inputEl = document.querySelector('.terminal-input') as HTMLInputElement;
				if (inputEl) inputEl.focus();
			}, 100);
		}
	}

	function handleTerminalSubmit(e: Event) {
		const target = e.target as HTMLInputElement;
		const command = target.value.trim().toUpperCase();
		target.value = "";

		terminalOutput = [...terminalOutput, `> ${command}`];

		if (command === "HELP") {
			terminalOutput = [...terminalOutput, "AVAILABLE COMMANDS: STATUS, PURGE, EXIT"];
		} else if (command === "STATUS") {
			terminalOutput = [...terminalOutput, `CORRUPTION LEVEL: ${corruptionLevel.toFixed(2)}%`, `CONTAINMENT: ${breachMode ? "FAILED" : "STABLE"}`];
		} else if (command === "PURGE") {
			if (corruptionLevel > 90) {
				terminalOutput = [...terminalOutput, "PURGE FAILED. ROOT ACCESS DENIED.", "THEY ARE ALREADY HERE."];
			} else {
				corruptionLevel = 0;
				breachMode = false;
				terminalOutput = [...terminalOutput, "SYSTEM PURGED. CORRUPTION RESET."];
			}
		} else if (command === "EXIT") {
			terminalOpen = false;
		} else if (command === "KILL") {
			terminalOutput = [...terminalOutput, "I'm afraid I can't do that, Ian."];
		} else {
			terminalOutput = [...terminalOutput, "UNKNOWN COMMAND."];
		}

		// Auto-scroll
		tick().then(() => {
			if (terminalRef) terminalRef.scrollTop = terminalRef.scrollHeight;
		});
	}

	// Detect layout direction based on viewport width
	// Desktop (side-by-side): horizontal breach
	// Mobile (stacked): vertical breach
	function detectLayoutDirection(): BreachDirection {
		if (typeof window === 'undefined') return 'horizontal';
		// The embeds stack below 900px based on CSS grid
		return window.innerWidth >= 900 ? 'horizontal' : 'vertical';
	}

	function isValidDarwinOrigin(origin: string): boolean {
		return ALLOWED_DARWIN_ORIGINS.includes(origin) || origin.startsWith('http://localhost:');
	}

	function isEscapeMessage(data: unknown): data is InfectionEscapeMessage {
		if (typeof data !== 'object' || data === null) return false;
		const msg = data as Record<string, unknown>;
		return msg.type === 'darwin-escape' && msg.source === 'darwin-arcade' && Array.isArray(msg.birds);
	}

	function handleInfectionMessage(event: MessageEvent): void {
		// Validate origin
		if (!isValidDarwinOrigin(event.origin)) return;

		// Validate message
		if (!isEscapeMessage(event.data)) return;

		// Forward to Gravity Chat
		forwardToGravityChat(event.data);
	}

	function forwardToGravityChat(escapeMsg: InfectionEscapeMessage): void {
		if (!gravityIframe?.contentWindow) return;

		// Clear any existing timeouts
		if (darwinGlowTimeout) clearTimeout(darwinGlowTimeout);
		if (gravityGlowTimeout) clearTimeout(gravityGlowTimeout);
		if (transferNotificationTimeout) clearTimeout(transferNotificationTimeout);

		// Increase corruption
		corruptionLevel = Math.min(100, corruptionLevel + (escapeMsg.birds.length * 2));
		if (corruptionLevel > 75 && Math.random() > 0.7) {
			breachMode = true;
		}

		// Show the transfer notification to visitors
		transferredBirdCount = escapeMsg.birds.length;
		showTransferNotification = true;

		// Sequential glow: Darwin first (source), then Gravity Chat (destination)
		// Phase 1: Darwin glows immediately (birds escaping FROM here)
		darwinGlowing = true;
		gravityGlowing = false;

		// Phase 2: After a delay, Gravity Chat starts glowing (birds arriving)
		gravityGlowTimeout = setTimeout(() => {
			gravityGlowing = true;
		}, 400);

		// Phase 3: Darwin stops glowing (transfer complete from source)
		darwinGlowTimeout = setTimeout(() => {
			darwinGlowing = false;
		}, 1200);

		// Phase 4: Gravity Chat stops glowing (birds have arrived)
		setTimeout(() => {
			gravityGlowing = false;
		}, 2000);

		// Phase 5: Hide the notification after the animation completes
		transferNotificationTimeout = setTimeout(() => {
			showTransferNotification = false;
		}, 4000);

		const arrivalMsg: InfectionArrivalMessage = {
			type: 'infection-arrival',
			source: 'portfolio-bridge',
			timestamp: Date.now(),
			birds: escapeMsg.birds,
			direction: layoutDirection
		};

		try {
			gravityIframe.contentWindow.postMessage(arrivalMsg, '*');
		} catch {
			// Silently fail if posting fails
		}
	}

	function handleResize(): void {
		layoutDirection = detectLayoutDirection();
	}

	onMount(() => {
		layoutDirection = detectLayoutDirection();

		// Find the iframes after mount
		darwinIframe = document.querySelector('iframe[title*="Darwin"]');
		gravityIframe = document.querySelector('iframe[title*="Gravity"]');

		// Listen for infection messages from Darwin.Arcade
		window.addEventListener('message', handleInfectionMessage);
		window.addEventListener('resize', handleResize);

		// Entropy timer: corruption slowly increases over time
		entropyTimer = setInterval(() => {
			if (Math.random() > 0.8) {
				corruptionLevel = Math.min(100, corruptionLevel + 0.5);
			}

			// Random chance to enter breach mode if corruption is high
			if (corruptionLevel > 80 && Math.random() > 0.95) {
				breachMode = true;
			}
		}, 2000);
	});

	onDestroy(() => {
		if (!browser) return;
		window.removeEventListener('message', handleInfectionMessage);
		window.removeEventListener('resize', handleResize);
		if (entropyTimer) clearInterval(entropyTimer);
	});
</script>

<svelte:body class:breach-mode={breachMode} />

{#if terminalOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="terminal-overlay" on:click|self={() => terminalOpen = false}>
		<div class="terminal-window" bind:this={terminalRef}>
			{#each terminalOutput as line}
				<div class="terminal-line">{line}</div>
			{/each}
			<div class="terminal-line terminal-prompt">
				<input class="terminal-input" type="text" on:change={handleTerminalSubmit} autofocus />
			</div>
		</div>
	</div>
{/if}

<section class="hero" id="top">
	<div class="hero-grid" style={heroStyle}>
		<div class="hero-copy">
			<div class="portrait-wrapper">
				<img src="/portrait-sketch.png" alt="Portrait sketch of Ian Buchanan" class="portrait" />
			</div>
			<p class="kicker">{kickerText}</p>
			<h1>
				{headlineText}
				<span class="headline-muted">{subheadText}</span>
			</h1>
			<p class="lead">
				I focus on pragmatic engineering: thoughtful architecture, great UX, and measurable performance.
			</p>
			<div class="cta-row">
				<a class="btn primary" href="#work">View work</a>
				{#if corruptionLevel > 80}
					<button class="btn glitch-text" data-text="SYSTEM ALERT" on:click={toggleTerminal}>SYSTEM ALERT</button>
				{:else}
					<a class="btn" href="#contact">Contact</a>
				{/if}
			</div>
			<div class="meta">
				<span class="pill">SvelteKit</span>
				<span class="pill">TypeScript</span>
				<span class="pill">Systems mindset</span>
			</div>
		</div>

		<div class="hero-card">
			<div class="card-top">
				<p class="card-title">Now</p>
				<p class="muted">Building interactive demos + real-time experiences</p>
			</div>
			<div class="card-metrics">
				<div class="metric">
					<p class="metric-label">Focus</p>
					<p class="metric-value">Product engineering</p>
				</div>
				<div class="metric">
					<p class="metric-label">Strength</p>
					<p class="metric-value">Shipping clean code</p>
				</div>
				<div class="metric">
					<p class="metric-label">Style</p>
					<p class="metric-value">Minimal, readable, tested</p>
				</div>
			</div>
		</div>
	</div>
</section>

<section class="section" id="work">
	<h2>Featured work</h2>
	<p class="section-lead">
		Two live demos hosted on subdomains, embedded here for a quick look. If your browser blocks embeds,
		you can still open each project directly.
	</p>

	<div class="embeds" aria-label="Embedded project demos">
		<!-- Transfer notification overlay -->
		{#if showTransferNotification}
			<div class="transfer-notification" aria-live="polite">
				<div class="transfer-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<path d="M12 16v-4"/>
						<path d="M12 8h.01"/>
					</svg>
				</div>
				<div class="transfer-content">
					<p class="transfer-title">🐦 AI Agent Migration Detected</p>
					<p class="transfer-desc">
						{transferredBirdCount} evolved bird{transferredBirdCount !== 1 ? 's' : ''} from Darwin.Arcade 
						{transferredBirdCount !== 1 ? 'have' : 'has'} learned to escape {transferredBirdCount !== 1 ? 'their' : 'its'} training environment 
						and {transferredBirdCount !== 1 ? 'are' : 'is'} now invading Gravity Chat!
					</p>
				</div>
				<div class="transfer-arrow" class:vertical={layoutDirection === 'vertical'}>
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M5 12h14"/>
						<path d="m12 5 7 7-7 7"/>
					</svg>
				</div>
			</div>
		{/if}

		<article class="embed-card" class:infection-glow={darwinGlowing} aria-label="Darwin.Arcade embedded demo">
			<header class="embed-head">
				<div class="embed-title">
					<h3>Darwin.Arcade</h3>
					<p class="muted mono">ai.ianhas.one</p>
				</div>
				{#if darwinGlowing}
					<span class="transfer-badge source">SOURCE</span>
				{/if}
				<a class="embed-link" href={aiUrl} rel="noopener noreferrer">Open</a>
			</header>
			<div class="embed-frame">
				<iframe
					title="Darwin.Arcade (ai.ianhas.one)"
					src={aiUrl}
					loading="lazy"
					referrerpolicy="strict-origin-when-cross-origin"
					sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
					allow="fullscreen"
				></iframe>
			</div>
		</article>

		<article class="embed-card" class:infection-glow={gravityGlowing} aria-label="Gravity Chat embedded demo">
			<header class="embed-head">
				<div class="embed-title">
					<h3>Gravity Chat</h3>
					<p class="muted mono">chat.ianhas.one</p>
				</div>
				{#if gravityGlowing}
					<span class="transfer-badge destination">DESTINATION</span>
				{/if}
				<a class="embed-link" href={chatUrl} rel="noopener noreferrer">Open</a>
			</header>
			<div class="embed-frame">
				<iframe
					title="Gravity Chat (chat.ianhas.one)"
					src={chatUrl}
					loading="lazy"
					referrerpolicy="strict-origin-when-cross-origin"
					sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
					allow="fullscreen"
				></iframe>
			</div>
		</article>
	</div>

	<div class="cards explain" aria-label="Project explanations">
		<article class="card">
			<h3>Darwin.Arcade (AI sandbox)</h3>
			<p class="muted">
				A live neuroevolution demo where NEAT agents learn game behaviors in real time. The UI mirrors the
				simulation from worker snapshots for smooth rendering and clear telemetry.
			</p>
			<ul class="bullets">
				<li>Worker-driven training loop + deterministic environments</li>
				<li>Reward shaping + curriculum difficulty scaling</li>
				<li>Network visualization for interpretability</li>
			</ul>
		</article>
		<article class="card">
			<h3>Gravity Chat (real-time experience)</h3>
			<p class="muted">
				A fast, multiplayer-flavored chat app with physics-inspired interaction. Built to feel responsive,
				with a focus on realtime sync, stability, and iteration speed.
			</p>
			<ul class="bullets">
				<li>Realtime state encoding + low-latency updates</li>
				<li>Performance-minded client interactions</li>
				<li>Test coverage for core mechanics</li>
			</ul>
		</article>
		<article class="card subtle">
			<h3>What I optimize for</h3>
			<p class="muted">Simple systems that scale: clarity, correctness, and speed.</p>
			<div class="tags">
				<span class="tag">Performance</span>
				<span class="tag">DX</span>
				<span class="tag">Observability</span>
				<span class="tag">Accessibility</span>
			</div>
		</article>
	</div>
</section>

<section class="section" id="skills">
	<h2>Skills</h2>
	<div class="grid-2">
		<div class="panel">
			<h3>Frontend</h3>
			<p class="muted">SvelteKit, TypeScript, state modeling, component systems, responsive UI.</p>
		</div>
		<div class="panel">
			<h3>Backend</h3>
			<p class="muted">API design, realtime protocols, data modeling, reliability and correctness.</p>
		</div>
		<div class="panel">
			<h3>Quality</h3>
			<p class="muted">Testing strategy, tooling, lint/format discipline, pragmatic CI habits.</p>
		</div>
		<div class="panel">
			<h3>Performance</h3>
			<p class="muted">Profiling, rendering budgets, avoiding main-thread work, measurable improvements.</p>
		</div>
	</div>
</section>

<section class="section" id="about">
	<h2>About</h2>
	<div class="about">
		<p>
			I’m Ian Buchanan. I build software with a product-first mindset and a strong preference for clean
			interfaces and stable systems.
		</p>
		<p class="muted">
			This site is intentionally lightweight and deploys cleanly at <span class="mono">ianhas.one</span>.
		</p>
	</div>
</section>

<section class="section" id="contact">
	<h2>Contact</h2>
	<div class="contact">
		<p class="muted">
			If you want to collaborate or talk about a role, send a note:
		</p>
		<div class="contact-row">
			<a class="btn primary" href="mailto:toolna@gmail.com">toolna@gmail.com</a>
			<a class="btn" href="#top">Back to top</a>
		</div>
		
	</div>
</section>
