<script>
  import { Block, BlockHeader, Navbar, Page } from "framework7-svelte";
  import { db, user } from "../js/gun";
  import Card from "../components/card.svelte";
  import { v4 } from "uuid";

  let seen = [];
  function load() {
    user.get("seenPostCopy").once((a) => {
      if (a) {
        Object.entries(a).forEach(async (a) => {
          delete a._;
          if (a) {
            db.get(`${a[1]}`)
              .get(a[0])
              .once((a) => {
                if (a) {
                  seen = [JSON.parse(a), ...seen];
                }
              });
          }
        });
      }
    });
  }
  load();

  function process() {
    seen = seen.filter((object, index) => {
      const found = seen.findIndex((obj) => obj.heading === object.heading);
      return found === index;
    });
    seen = seen.sort((b, a) => {
      return new Date(a.time) - new Date(b.time);
    });
  }

  $: seen, process();
</script>

<Navbar title="Seen Posts" backLink=" " />
<Page
  ptr
  onPtrRefresh={(done) => {
    load();
    done();
  }}
  name="Seen Posts"
>
  <Block>
    {#if seen.length == 0}
      <Block>
        <BlockHeader>No Posts Yet!</BlockHeader>
      </Block>
    {/if}
    {#each seen as f (v4())}
      <Card justrender={true} {f} />
    {/each}
  </Block>
</Page>
