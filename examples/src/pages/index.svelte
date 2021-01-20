<script>
  import { link } from 'svelte-standalone-router';
</script>

<div id="home">
  <h1>Welcome to svelte standalone router library</h1>
  <section>
    <div>
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M19 1l-5 5v11l5-4.5V1m2 4v13.5c-1.1-.35-2.3-.5-3.5-.5c-1.7 0-4.15.65-5.5 1.5V6c-1.45-1.1-3.55-1.5-5.5-1.5c-1.95 0-4.05.4-5.5 1.5v14.65c0 .25.25.5.5.5c.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5c1.35-.85 3.8-1.5 5.5-1.5c1.65 0 3.35.3 4.75 1.05c.1.05.15.05.25.05c.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1M10 18.41C8.75 18.09 7.5 18 6.5 18c-1.06 0-2.32.19-3.5.5V7.13c.91-.4 2.14-.63 3.5-.63c1.36 0 2.59.23 3.5.63v11.28z" fill="currentColor"></path></svg>
      </span>
      <h3>Read the documentation</h3>
      <p>Learn the inner workings of the library on the documentation page.</p>
      <button use:link={{to: '/how-to/documentation'}}>Documentation</button>
    </div>
    
    <div>
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M3 3h18v18H3V3m4.73 15.04c.4.85 1.19 1.55 2.54 1.55c1.5 0 2.53-.8 2.53-2.55v-5.78h-1.7V17c0 .86-.35 1.08-.9 1.08c-.58 0-.82-.4-1.09-.87l-1.38.83m5.98-.18c.5.98 1.51 1.73 3.09 1.73c1.6 0 2.8-.83 2.8-2.36c0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02c0-.41.31-.73.81-.73c.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33c-1.51 0-2.48.96-2.48 2.23c0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13c0 .48-.45.83-1.15.83c-.83 0-1.31-.43-1.67-1.03l-1.38.8z" fill="currentColor"></path></svg>
      </span>
      <h3>Usage in your projects</h3>
      <p>Implementation guide on how to implement <strong>svelte standalone router</strong> in your projects.</p>
      <button use:link={{to: '/how-to/usage'}}>Usage examples</button>
    </div>
    
    <div>
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--mdi" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M8.32 21.97a.546.546 0 0 1-.26-.32c-.03-.15-.06.11.6-4.09c.6-3.8.59-3.74.67-3.85c.13-.17.11-.17 1.61-.18c1.32-.03 1.6-.03 2.19-.12c3.25-.45 5.26-2.36 5.96-5.66c.04-.22.08-.41.09-.41c0-.01.07.04.15.1c1.03.78 1.38 2.22.99 4.14c-.46 2.29-1.68 3.81-3.58 4.46c-.81.28-1.49.39-2.69.42c-.8.04-.82.04-1.05.19c-.17.17-.16.14-.55 2.55c-.27 1.7-.37 2.25-.41 2.35c-.07.16-.21.3-.37.38l-.11.07H10c-1.29 0-1.62 0-1.68-.03m-4.5-2.23c-.19-.1-.32-.27-.32-.47C3.5 19 6.11 2.68 6.18 2.5c.09-.18.32-.37.5-.44L6.83 2h3.53c3.91 0 3.76 0 4.64.2c2.62.55 3.82 2.3 3.37 4.93c-.5 2.93-1.98 4.67-4.5 5.3c-.87.21-1.48.27-3.14.27c-1.31 0-1.41.01-1.67.15c-.26.15-.47.42-.56.75c-.04.07-.27 1.47-.53 3.1a241.3 241.3 0 0 0-.47 3.02l-.03.06H5.69c-1.58 0-1.8 0-1.87-.04z" fill="currentColor"></path></svg>
      </span>
      <h3>Support</h3>
      <p>Do you like this project and feel it's beneficial to you and your work? A small coffee tip is always appreciated, but not required.</p>
      <a href="https://www.paypal.me/jenshjalmarsson"><button>Tip on paypal</button></a>
    </div>
  </section>
  
  <p>
    <a href="https://github.com/hjalmar/" class="button github">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      <span>Jens Hjalmarsson</span>
    </a>
  </p>
</div>

<style>
  .icon{
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    align-self: center;
  }
  .icon svg{
    height: 100%;
  }
  .github{
    background-color: var(--color-darker);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17rem;
    text-decoration: none !important;
  }
  .github svg{
    fill: rgba(255, 255, 255, .85);
  }
  .github span{
    margin-left: 10rem;
    color: rgba(255, 255, 255, .85);
  }
  #home{
    margin: 20rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  h1{
    margin: 20rem 0;
    color: var(--color-medium);
  }
  section{
    margin: 40rem 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 10rem;
  }
  section div{
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    padding: 40rem;
    background-color: rgba(15, 16, 26, 0.336);
  }
</style>