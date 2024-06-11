<script>
  import { SkeletonBlock } from "framework7-svelte";
  import { Card } from "framework7-svelte";
</script>

<Card style="padding: 20px;">
  <SkeletonBlock
    class="skeleton-effect-wave"
    style="width: 100%; height: 20px; border-radius: 20px"
  />
  <br />
  <SkeletonBlock
    class="skeleton-effect-wave"
    style="width: 70%; height: 20px; border-radius: 20px"
  />
</Card>
<Card style="padding: 20px;">
  <SkeletonBlock
    class="skeleton-effect-wave"
    style="width: 80%; height: 20px; border-radius: 20px"
  />
  <br />
  <SkeletonBlock
    class="skeleton-effect-wave"
    style="width: 90%; height: 20px; border-radius: 20px"
  />
</Card>
