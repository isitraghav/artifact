<script>
  export let f7router;
  import {
    Page,
    Block,
    List,
    ListItem,
    Button,
    Popover,
    Icon,
    Fab,
    BlockFooter,
  } from "framework7-svelte";
  import { db, loggedin, user } from "../js/gun";
  import axios from "axios";
  import Card from "../components/card.svelte";
  import { v4 } from "uuid";
  import _ from "underscore";
  import { Geolocation } from "@capacitor/geolocation";
  import { config } from "../js/init";
  import Skeleton from "../components/skeleton.svelte";

  let sel = "city";
  let loading = false;
  let sortbytime = "asc";

  /**
   * CHANGE IT BACK
   */

  let loc = {
    state: "city",
    country: "country",
  };
  let feed = [];
  let popoverOpened;

  import { sha256 } from "hash.js";
  let seen = {};
  user.get("seen").once((a) => {
    if (!a) return;
    Object.entries(a).forEach(async (a) => {
      if (a[1] == true) {
        seen[a[0]] = a[1];
      }
    });
  });

  async function fetchh(node) {
    try {
      await db.get("#" + node).once(async (a, bb) => {
        if (a) {
          delete a._;

          a = Object.entries(a);
          a.forEach(async (a) => {
            try {
              let data = new Object(JSON.parse(a[1]));
              if (
                data.hasOwnProperty("uid") &&
                data.hasOwnProperty("time") &&
                data.hasOwnProperty("heading")
              ) {
                // if (!_.has(data, "images")) {
                //   data.images = {};
                // }
                let f = {
                  heading: data.heading,
                  time: data.time,
                  desc: data.desc,
                  uid: data.uid,
                  images: data.images || {},
                  hash: a[0],
                  channel: bb,
                };
                if (
                  !_.has(
                    seen,
                    await sha256().update(JSON.stringify(f)).digest("hex"),
                  )
                ) {
                  feed = [f, ...feed];
                }
              }
            } catch (error) {}
          });
        } else {
        }
      });
    } catch (error) {
      console.warn(error);
    }
  }

  $: feed, process();

  function load() {
    popoverOpened = false;

    if (sel == "city") {
      fetchh(loc.state);
    } else if (sel == "country") {
      fetchh(loc.country);
    } else {
      fetchh("world");
    }
  }

  function process() {
    feed = feed.filter((object, index) => {
      const found = feed.findIndex(
        (obj) => obj.uid === object.uid || obj.heading === object.heading,
      );
      return found === index;
    });
    feed.sort((b, a) => {
      if (sortbytime == "asc") {
        return new String(a.time).localeCompare(b.time);
      } else if (sortbytime == "des") {
        return new String(b.time).localeCompare(a.time);
      }
    });
  }

  loggedin.subscribe(async (a) => {
    if (a == true) {
      let options = {
        pub: user.is.pub,
      };

      try {
        Geolocation.checkPermissions().then(async (a) => {
          if (a.location == "granted") {
            const coordinates = await Geolocation.getCurrentPosition();
            options["lat"] = coordinates.coords.latitude;
            options["long"] = coordinates.coords.longitude;
          }

          loading = true;

          await axios
            .post(config.api + "/api/geo", options)
            .then(async function (response) {
              loc = response.data;
              if (loc) {
                localStorage.setItem("loc", JSON.stringify(loc));
              }
              load();
            })
            .catch(async (e) => {
              if (localStorage.getItem("loc")) {
                loc = JSON.parse(localStorage.getItem("loc"));
              } else {
                await axios.get("http://ip-api.com/json/").then((r) => {
                  let data = r.data;
                  if (_.has(data, "city") && _.has(data, "country")) {
                    let datapro = {
                      state: data.city,
                      country: data.country,
                    };
                    loc = datapro;
                  }
                });
              }
              load();
            });
          loading = false;
        });
      } catch (error) {}
    }
  });

  $: sortbytime, process();
  // $: feed, process();

  async function sleep(t) {
    return new Promise((r) => {
      setTimeout(() => {
        r();
      }, t);
    });
  }

  let showPreloader = true;
  let allowInfinite = true;

  function loadMore() {
    if (!allowInfinite) return;
    allowInfinite = false;
    showPreloader = false;

    allowInfinite = true;
  }

  // infinite
  // infiniteDistance={50}
  // infinitePreloader={showPreloader}
  // onInfinite={loadMore}
</script>

<Page
  ptr
  ptrMousewheel={true}
  onPtrRefresh={(done) => {
    // feed = [];
    load();
    done();
  }}
  name="home"
>
  <Block style="display: flex;">
    <div style="width: {sel == 'country' ? 'auto' : '20'}vw;">
      <Button fill round small popoverOpen=".popover-menu">
        {#if sel == "city"}
          {loc.state}
        {:else if sel == "country"}
          {loc.country}
        {:else}
          world
        {/if}</Button
      >
    </div>
    <div style="width: 20vw;">
      <Button round small popoverOpen=".popover-menusorttime"
        >{sortbytime == "asc" ? "latest" : "old"}</Button
      >
    </div>
  </Block>
  <Popover
    bind:opened={popoverOpened}
    class="popover-menu"
    style="width: 50vw;"
  >
    <List>
      <ListItem
        onClick={() => {
          sel = "city";
          load();
        }}
        title={loc.state}
      />
      <ListItem
        onClick={() => {
          sel = "country";
          load();
        }}
        title={loc.country}
      />
      <ListItem
        onClick={() => {
          sel = "world";
          load();
        }}
        title="World"
      />
    </List>
  </Popover>

  <Popover class="popover-menusorttime" style="width: 50vw;">
    <List>
      <ListItem
        onClick={() => {
          sortbytime = "asc";
        }}
        popoverClose
        title="latest"
      />
      <ListItem
        onClick={() => {
          sortbytime = "des";
        }}
        popoverClose
        title="old"
      />
    </List>
  </Popover>

  <Fab
    onClick={() => {
      f7router.navigate("/write");
    }}
    position="right-bottom"
  >
    <Icon f7="pencil" size="25" />
  </Fab>
  {#if loading}
    <Skeleton />
  {:else if feed.length == 0 && !loading}
    <BlockFooter>
      <div>
        <center> pull to refresh! </center>
      </div>
    </BlockFooter>
  {:else}
    {#each feed as f (v4())}
      <Card justrender={false} {f} />
    {/each}
  {/if}
</Page>
