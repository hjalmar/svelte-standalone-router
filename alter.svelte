<script>
  import { alter } from './helpers';
  export let to = undefined, href = undefined, state = {};
  alter(to || href, state);
</script>
