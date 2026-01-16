<script lang="ts">
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import './layout.css';

	let { children } = $props();

	const siteUrl = (env.PUBLIC_SITE_URL ?? 'https://ianhas.one').replace(/\/$/, '');
	const meseeksUrl = (env.PUBLIC_MESEEKS_URL ?? 'https://ai.ianhas.one').replace(/\/$/, '');
	const gravityUrl = (env.PUBLIC_GRAVITY_URL ?? 'https://chat.ianhas.one').replace(/\/$/, '');

	const title = 'Ian Buchanan — Software Developer';
	const description =
		'Portfolio of Ian Buchanan — software developer focused on building fast, reliable, well-designed web experiences.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={new URL(page.url.pathname, siteUrl).toString()} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={new URL(page.url.pathname, siteUrl).toString()} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#0b0f1a" />
</svelte:head>

<div class="app">
	<header class="topbar">
		<div class="topbar-inner">
			<a class="brand" href="/">Ian Buchanan</a>
			<nav class="nav">
				<a href="#work">Work</a>
				<a href="#skills">Skills</a>
				<a href="#about">About</a>
				<a href="#contact">Contact</a>
			</nav>
			<div class="apps">
				<a class="app-link" href={meseeksUrl} rel="noopener noreferrer">Darwin.Arcade</a>
				<a class="app-link" href={gravityUrl} rel="noopener noreferrer">Gravity Chat</a>
			</div>
		</div>
	</header>

	<main class="content">{@render children()}</main>

	<footer class="footer">
		<div class="footer-inner">
			<p class="muted">© {new Date().getFullYear()} Ian Buchanan</p>
			<p class="muted">
				Built with SvelteKit. Domain:
				<a class="link" href={siteUrl} rel="noopener noreferrer">{siteUrl.replace(/^https?:\/\//, '')}</a>
			</p>
		</div>
	</footer>
</div>
