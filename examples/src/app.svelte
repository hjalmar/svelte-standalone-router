<script>
  import { link, location } from 'svelte-standalone-router';
  import Router from './router.svelte';
  import Branding from './branding.svelte';
</script>

<header>
  <div class="inner">
    <a href="/" use:link>
      <Branding fill="white" />
    </a>
    <nav>
      <a href="/" class:active={$location == '/'} use:link>Home</a>
      <a href="/documentation" class:active={$location == '/documentation'} use:link>Documentation</a>
      <a href="/usage" class:active={$location == '/usage'} use:link>Usage</a>
      <a href="/invalid-route" class:active={$location == '/invalid-route'} use:link>Fallback route</a>
      <a href="https://github.com/hjalmar/svelte-standalone-router">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      </a>
    </nav>
  </div>
</header>

<main>
  <Router />
</main>

<style>
  header{
    position: sticky;
    top: -120px;
    z-index: 99595464566456;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 30px 32px;
    background-color: #327584;
    background-image: url("data:image/svg+xml,<svg id='patternId' width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><defs><pattern id='a' patternUnits='userSpaceOnUse' width='40' height='59.428' patternTransform='scale(2.1) rotate(30.3)'><rect x='0' y='0' width='100%' height='100%' fill='hsla(191, 45%, 36%, 1)'/><path d='M0 70.975V47.881m20-1.692L8.535 52.808v13.239L20 72.667l11.465-6.62V52.808zm0-32.95l11.465-6.62V-6.619L20-13.24 8.535-6.619V6.619L20 13.24m8.535 4.927v13.238L40 38.024l11.465-6.62V18.166L40 11.546zM20 36.333L0 47.88m0 0v23.094m0 0l20 11.548 20-11.548V47.88m0 0L20 36.333m0 0l20 11.549M0 11.547l-11.465 6.619v13.239L0 38.025l11.465-6.62v-13.24L0 11.548v-23.094l20-11.547 20 11.547v23.094M20 36.333V13.24'  stroke-linecap='square' stroke-width='1.5' stroke='hsla(191, 45%, 33%, 1)' fill='none'/></pattern></defs><rect width='800%' height='800%' transform='translate(-112,-57.712)' fill='url(%23a)'/></svg>");
    box-shadow: 0 2px 15px -5px rgba(10, 28, 34, 0.556);
    /* border-bottom: 1px solid #426976; */
    transition: top .4s;  
  }
  header::before{
    content: '';
    height: 40px;
    position: absolute;
    bottom: -38px;
    width: 100%;
  }
  header:hover{
    top: 0;
  }
  .inner{
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 1500px;
  }
  nav{
    display: flex;
  }
  a{
    margin: 0 10px;
    font-weight: bold;
    text-decoration: none;
    color: #0A1C22;
    display: flex;
    align-items: center;
  }
  a:first-child{
    margin-left: 0;
  }
  a:last-child{
    margin-right: 0;
  }
  a:hover{
  	text-decoration: underline;
  }
  a.active{
    color: rgb(255, 238, 237);
    text-decoration: underline;
  }
  main{
    display: flex;
    justify-content: center;
    padding: 32px 32px;
  }
</style>