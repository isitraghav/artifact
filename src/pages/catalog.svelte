<script>
  import {
    Page,
    Navbar,
    Block,
    Searchbar,
    BlockFooter,
  } from "framework7-svelte";
  import axios from "axios";
  import { v4 } from "uuid";
  import { config } from "../js/init";
  import Card from "../components/card.svelte";
  import Skeleton from "../components/skeleton.svelte";

  let q;
  let results = [];
  let loading;
  let error = "search across all posts";
  let processed;
  async function search() {
    processed = false;
    error = "";
    loading = true;
    await axios
      .get(`${config.api}/api/search?q=${q}`)
      .then((res) => {
        results = [];
        let data = res.data;

        data["data"].forEach((e) => {
          results = [
            {
              heading: e.heading,
              time: e.createdAt,
              desc: e.content,
              uid: e.uid,
              images: JSON.parse(e.images) || {},
            },
            ...results,
          ];
        });
        loading = false;
      })
      .catch((a) => {
        if (a.code == "ERR_BAD_REQUEST") {
          error = a.response.data.m;
        }
      });
    processed = true;
  }
</script>

<Page name="Search">
  <Navbar title="Search" />
  <Searchbar
    onInput={() => {
      processed = false;
    }}
    bind:value={q}
    onChange={search}
    disableButtonText="Cancel"
    placeholder="Search"
    clearButton={true}
  />
  <Block>
    {#if processed && results.length == 0 && !error}
      <div class="truncate opacity-80">
        no result for '{q}'
      </div>
    {:else if error}
      <BlockFooter>
        {error}
      </BlockFooter>
    {:else if loading && !processed}
      <Skeleton />
    {:else if !loading && processed}
      {#each results as f (v4())}
        <Card justrender={true} {f} />
      {/each}
    {/if}
  </Block>
</Page>
