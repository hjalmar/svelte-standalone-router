<script>
  import { link, location } from 'svelte-standalone-router';
  import Branding from './branding.svelte';
</script>

<header>
  <div class="inner">
    <a href="/" use:link>
      <Branding fill="var(--color-red)" />
    </a>
    <nav>
      <a href="/" class:active={$location == '/'} use:link>Home</a>
      <a href="/how-to/documentation" class:active={$location == '/how-to/documentation'} use:link>Documentation</a>
      <a href="/how-to/usage" class:active={$location == '/how-to/usage'} use:link>Usage</a>
      <a href="/invalid-route" class:active={$location == '/invalid-route'} use:link>Fallback route</a>
      <a href="https://github.com/hjalmar/svelte-standalone-router" class="button github">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        <span>Github</span>
      </a>
    </nav>
  </div>
</header>

<style>
  header{
    position: sticky;
    top: 0;
    z-index: 99595464566456;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 20px 32px;
    height: 80px;
    font-size: 17rem;
    background-color: var(--background-color);
    filter: brightness(1.1);
    border-bottom: 1px solid #00000034;
    color: var(--color-darker);
    box-shadow: 0 0 6px -2px rgba(0,0,0,.3);
  }

  header:hover{
    top: 0;
  }
  .inner{
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  nav{
    display: flex;
  }
  a{
    display: flex;
    align-items: center;
    margin: 0 10px;
    color: inherit;
    text-decoration: none;
  }
  a:first-child{
    margin-left: 0;
  }
  a:last-child{
    margin-right: 0;
  }
  a:not(.active):hover{
  	text-decoration: underline;
  }
  a.active{
    color:var(--color-light);
  }
  .github{
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15rem;
    text-decoration: none !important;
  }
  .github svg{
    fill: rgba(255, 255, 255, .85);
  }
  .github span{
    margin-left: 10rem;
    color: rgba(255, 255, 255, .85);
  }
</style>