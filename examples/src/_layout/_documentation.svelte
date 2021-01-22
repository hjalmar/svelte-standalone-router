<script>
  import { onMount, tick } from "svelte";

  let aside = [];
  let article;
  let nav;

  onMount(async () => {
    const anchors = Array.from(article.querySelectorAll('a[name][href]'));
    aside = anchors.map((node) => {
      return { label: node.textContent, href: node.getAttribute('href'), name: node.name }
    });

    const sections = {};
    const offset = 0;
    const update = _ => anchors.forEach((e) => (sections[e.name] = e.offsetTop - (window.innerHeight/2) + offset));
    window.addEventListener('resize', update);
    update();

    const scroll = (e) => {
      var scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
      for(let name in sections){
        if((sections[name] <= scrollPosition) || sections[name] < 100){
          nav?.querySelectorAll('aside .inview')?.forEach(_ => _.classList.remove('inview'));
          nav?.querySelector(`aside [data-name="${name}"]`)?.classList.add('inview');
        }
      }
    }
    window.addEventListener('scroll', scroll);
    await tick();
    scroll();

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', scroll);
    }
  });
</script>

<main>
  <aside>
    <ul id="nav" bind:this={nav}>
      {#each aside as item}
        <li class:inview={false} data-name="{item.name}"><a href="{item.href}">{item.label}</a></li>
      {/each}
    </ul>
  </aside>
  <section>
    <article bind:this={article}>
      <slot>hej</slot>
    </article>
  </section>
</main>

<style>
  main{
    display: grid;
    grid-template-columns: 300px auto;
    width: 100%;
    background-color: var(--background-color);
  }
  aside{
    position: sticky;
    top: 80px;
    background-color: var(--background-color);
    filter: brightness(.98);
    width: 100%;
    height: calc(100vh - 80px);
    overflow-y: auto;
    border-right: 1px solid #00000034;
  }
  aside ul{
    padding: 20rem;
  }
  section{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 1900px;
    margin: 0 0 160rem 0;
  }
  ul{
    list-style: none;
  }
  li{
    display: flex;
    flex-direction: column;
    position: relative;
  }
  li a{
    display: block;
    padding: 10rem;
  }
  article :global(hr){
    margin: 60rem 0;
  }
  li::after, article :global(hr){
    content: '';
    width: 100%;
    border: none;
    border-bottom: 1px solid rgba(223, 232, 243, 0.041);
  }
  li[data-name].inview::before{
    content: '\00A7';
    position: absolute;
    top: 50%;
    left: -11rem;
    transform: translateY(-50%);
    color: var(--color-light);
    opacity: .1;
  }
  li:hover{
    background-color: rgba(255, 255, 255, 0.014);
    color: var(--color-light);
  }
  li.inview{
    color: var(--color-red);
  }
  article{
    max-width: var(--content-max-width);
  }
  article :global(a){
    position: relative;
    text-decoration: none;
  }

  article :global(a[name]::before){
    position: absolute;
    left: -30rem;
    content: '\00A7';
    color: var(--color-light);
    opacity: .1;
  }
  article :global(a[name]:hover::before){
    opacity: 1;
    color: var(--color-red);
  }
  article :global(h1), article :global(h2), article :global(h3), article :global(h4){
    margin: 30rem 0;
  }
  article :global(blockquote){
    background-color: rgba(0, 0, 0, .2);
    border-left: 5px solid var(--color-red);
    padding: 20rem;
    font-size: 15rem;
  }
  article :global(blockquote) :global(p){
    margin: 0;
    line-height: 28rem;
  }

  article :global(p > code){
    padding: 3px 10px;
    background-color: rgba(255, 255, 255, 0.027);
    font-style: italic;
    color: var(--color-light);
    border-radius: 5px;
    border: 1px solid rgba(115, 161, 230, 0.062);
  }
</style>