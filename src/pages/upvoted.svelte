<script>
  import { Block, BlockHeader, Navbar, Page } from "framework7-svelte";
  import { db, user } from "../js/gun";
  import Card from "../components/card.svelte";
  import { v4 } from "uuid";

  let upvoted = [];
  function load() {
    user.get("upvoted").once((a) => {
      if (a) {
        Object.entries(a).forEach(async (a) => {
          delete a._;
          if (a) {
            db.get(`${a[1]}`)
              .get(a[0])
              .once((a) => {
                if (a) {
                  upvoted = [JSON.parse(a), ...upvoted];
                }
              });
          }
        });
      }
    });
  }
  load();

  function process() {
    upvoted = upvoted.filter((object, index) => {
      const found = upvoted.findIndex((obj) => obj.heading === object.heading);
      return found === index;
    });
    upvoted = upvoted.sort((b, a) => {
      return new Date(a.time) - new Date(b.time);
    });
  }

  $: upvoted, process();
</script>

<Navbar title="Upvoted Posts" backLink=" " />
<Page
  ptr
  onPtrRefresh={(done) => {
    load();
    done();
  }}
  name="Upvoted Posts"
>
  <Block>
    {#if upvoted.length == 0}
      <Block>
        <BlockHeader>No Posts Yet!</BlockHeader>
      </Block>
    {/if}
    {#each upvoted as f (v4())}
      <Card justrender={true} {f} />
    {/each}
  </Block>
</Page>
