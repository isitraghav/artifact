<script>
  import { Block, BlockHeader, Navbar, Page } from "framework7-svelte";
  import { db, user } from "../js/gun";
  import Card from "../components/card.svelte";
  import { v4 } from "uuid";
  let posts = [];

  function load(done) {
    user.get("posts").map((a, b) => {
      a = JSON.parse(a);
      posts = [a, ...posts];
    });
    done();
  }
  load(() => {});

  function process() {
    posts = posts.filter((object, index) => {
      const found = posts.findIndex((obj) => obj.heading === object.heading);
      return found === index;
    });
    posts = posts.sort((b, a) => {
      return new Date(a.time) - new Date(b.time);
    });
  }

  $: posts, process();
</script>

<Navbar title="Posts" backLink=" " />
<Page ptr ptrMousewheel={true} onPtrRefresh={load} name="Posts">
  <Block>
    {#if posts.length == 0}
      <Block>
        <BlockHeader>No Posts Yet!</BlockHeader>
      </Block>
    {/if}
    {#each posts as f (v4())}
      <Card justrender={true} {f} />
    {/each}
  </Block>
</Page>
