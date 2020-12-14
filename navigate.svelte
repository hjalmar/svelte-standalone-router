<script>
  import { navigate } from './helpers';
  export let to = undefined, href = undefined, state = {};
  navigate(to || href, state);
</script>
