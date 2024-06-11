<script>
  import {
    Page,
    Navbar,
    List,
    ListInput,
    ListItem,
    BlockTitle,
    Button,
    Block,
    BlockFooter,
    f7,
    Toggle,
  } from "framework7-svelte";
  export let f7router;
  import { db, themeapp, user } from "../js/gun";
  import { v4 } from "uuid";

  let relay,
    current = localStorage.getItem("peer") || "https://peer.wallie.io/gun";
  let relaylist = [
    "https://peer.wallie.io/gun",
    "https://plankton-app-6qfp3.ondigitalocean.app/gun",
    "https://gun-manhattan.herokuapp.com/gun",
  ];

  function validURL(str) {
    var pattern = /[http|https]\:\/\/(.*)\/gun/;
    return !!pattern.test(str);
  }
  import { Geolocation } from "@capacitor/geolocation";
  let showloc = true;
  Geolocation.checkPermissions().then((a) => {
    if (a.location == "granted") {
      showloc = false;
    }
  });
  let darkmode;
  if (localStorage.getItem("dark") == "false") {
    darkmode = false;
  } else {
    darkmode = true;
  }
</script>

<Page name="settings">
  <Navbar title="Settings" />
  <Block>
    <BlockTitle>Appearance</BlockTitle>
    <div class="flex justify-center items-center">
      <div>Dark Mode</div>
      <div class="ml-auto">
        <Toggle
          bind:checked={darkmode}
          onChange={() => {
            if (darkmode == true || darkmode == "true") {
              localStorage.setItem("dark", "false");
              themeapp.set(false);
            } else {
              localStorage.setItem("dark", "true");
              themeapp.set(true);
            }
          }}
        />
      </div>
    </div>
  </Block>
  {#if showloc}
    <Block>
      <BlockTitle>Location Accuracy</BlockTitle>
      <div style="display: flex;justify-content: center;align-items: center;">
        enable location for better experience of local news
        <Button
          small
          onClick={() => {
            Geolocation.requestPermissions()
              .then((a) => {
                if (a.location == "granted") {
                  f7.dialog.alert("we will now serve more accurate news!");
                  showloc = false;
                }
              })
              .catch((e) => {
                f7.dialog.alert(e.message);
              });
          }}>enable</Button
        >
      </div>
    </Block>
  {/if}
  <Block>
    <BlockTitle>Relay</BlockTitle>
    <List>
      <div style="display: flex;justify-items: center;align-items: center;">
        <ListInput
          bind:value={relay}
          placeholder="https://plankton-app-6qfp3.ondigitalocean.app/gun"
        />
        <Button
          round
          small
          fill
          onClick={() => {
            if (!validURL(relay)) {
              f7.toast
                .create({
                  text: "not a valid url",
                  position: "center",
                  closeTimeout: 2000,
                })
                .open();
              return;
            }
            localStorage.setItem("peer", relay);
            db.opt({
              peers: [relay],
            });
            current = relay;
            f7.toast
              .create({
                text: "set",
                position: "center",
                closeTimeout: 2000,
              })
              .open();
            relay = "";
          }}>set</Button
        >
      </div>
    </List>
    <div>
      current: {current}
      <Button
        fill
        round
        small
        style="width: 30vw;"
        onClick={() => {
          let rr = "https://peer.wallie.io/gun";
          localStorage.setItem("peer", rr);
          db.opt({
            peers: [rr],
          });
          current = rr;
        }}
      >
        restore
      </Button>
    </div>
    <List>
      <div>Other relays</div>
      {#each relaylist as r (v4())}
        <ListItem
          style="font-size: small;opacity: 80%;"
          onClick={() => {
            localStorage.setItem("peer", r);
            db.opt({
              peers: [r],
            });
            f7.toast
              .create({
                text: "set",
                position: "center",
                closeTimeout: 2000,
              })
              .open();
            current = r;
          }}
        >
          {r}
        </ListItem>
      {/each}
    </List>
    <BlockFooter>relays help connect you to other peers</BlockFooter>
  </Block>
  <Block>
    <BlockTitle>Account</BlockTitle>
    <Button
      color="red"
      fill
      round
      onClick={() => {
        user.leave();
        localStorage.clear();
        sessionStorage.clear();
        f7router.navigate("/");
      }}
    >
      Log Out
    </Button>
  </Block>
</Page>
