<script>
  import { redirect } from './helpers';
  export let to = undefined, href = undefined, state = {};
  redirect(to || href, state);
</script>
