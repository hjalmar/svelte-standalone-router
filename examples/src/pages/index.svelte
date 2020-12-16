<script>
  import { link } from 'svelte-standalone-router';
</script>
<h1>Welcome to the svelte standalone router library</h1>

<h3>Read the documentation</h3>
<p>Learn the inner workings of the library on the documentations page.</p>
<button use:link={{to: '/documentation'}}>Documentation</button>

<h3>Usage in your projects</h3>
<p>Implementation guide on how to implement <strong>svelte standalone router</strong> in your projects.</p>
<button use:link={{to: '/usage'}}>Usage examples</button>

<h2>Support</h2>
<p>Do you like this project and feel it's beneficial in your work? A small coffe tip or minor incentive is highly appreciated to motivate working on projects.</p>
<a class="button" href="https://www.paypal.me/jenshjalmarsson">Tip on paypal</a>