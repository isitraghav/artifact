<script>
  import eruda from "eruda";
  eruda.init();
  // locking orientation
  window.screen.orientation.lock("portrait");

  import { onMount } from "svelte";
  import { getDevice } from "framework7/lite-bundle";
  import {
    f7,
    f7ready,
    App,
    Views,
    View,
    Page,
    Toolbar,
    Link,
    Block,
    LoginScreen,
    LoginScreenTitle,
    List,
    ListInput,
    BlockFooter,
    Button,
    Progressbar,
    Icon,
  } from "framework7-svelte";

  import capacitorApp from "../js/capacitor-app";
  import routes from "../js/routes";
  import store from "../js/store";
  import { db, themeapp, user } from "../js/gun";

  let loading;

  const device = getDevice();
  // Framework7 Parameters
  let f7params = {
    name: "artifact", // App name
    theme: "ios", // Automatic theme detection
    darkMode: true,
    // App store
    store: store,
    // App routes
    routes: routes,
    // Register service worker (only on production build)
    serviceWorker:
      process.env.NODE_ENV === "production"
        ? {
            path: "/service-worker.js",
          }
        : {},
    // Input settings
    input: {
      scrollIntoViewOnFocus: device.capacitor,
      scrollIntoViewCentered: device.capacitor,
    },
    // Capacitor Statusbar settings
    statusbar: {
      iosOverlaysWebView: true,
      androidOverlaysWebView: false,
    },
  };

  onMount(() => {
    f7ready(() => {
      // Init capacitor APIs (see capacitor-app.js)
      if (f7.device.capacitor) {
        capacitorApp.init(f7);
      }
    });
  });

  let loginScreenOpened = true;
  let username = "";
  let password = "";

  import { Geolocation } from "@capacitor/geolocation";
  async function setloc() {}

  async function setup() {
    return new Promise(async (resolve, reject) => {
      if (!Capacitor.isNativePlatform()) {
        resolve();
      }
      await Geolocation.checkPermissions().then((a) => {
        if (a.location == "denied" || a.location == "prompt") {
          //not granted
          f7ready(() => {
            f7.dialog.confirm(
              "geographical data required for news!",
              "setup",
              () => {
                //granted
                Geolocation.requestPermissions().then((a) => {
                  if (a.location == "granted") {
                    resolve();
                  } else {
                    setloc();
                    resolve();
                  }
                });
              },
              () => {
                //denied
                f7.dialog.confirm(
                  "allow location for a better experience",
                  "setup",
                  () => {
                    //granted
                    Geolocation.requestPermissions().then((a) => {
                      if (a.location == "granted") {
                        resolve();
                      } else {
                        setloc();
                        resolve();
                      }
                    });
                  },
                  () => {
                    setloc();
                    resolve();
                  },
                );
              },
            );
          });
        } else {
          resolve();
        }
      });
    });
  }

  f7ready(() => {
    themeapp.subscribe((a) => {
      if (localStorage.getItem("dark") == "false") {
        f7.setDarkMode(false);
      } else {
        f7.setDarkMode(true);
      }
    });
  });

  import { Capacitor } from "@capacitor/core";
  async function signIn() {
    await setup().then(() => {
      loading = true;
      user.auth(username, password, (a) => {
        loading = true;
        let txt;
        if (a.err) {
          loading = false;
          txt = a.err;
          loginScreenOpened = true;
        } else {
          loading = false;
          txt = "logged in";
          loginScreenOpened = false;
          localStorage.setItem("keys", JSON.stringify(a.sea));
        }
        f7.toast
          .create({
            text: txt,
            position: "center",
            closeTimeout: 5000,
          })
          .open();
      });
    });
  }

  async function signUp() {
    await setup().then(() => {
      loading = true;
      db.user().create(username, password, (a) => {
        if (a.err) {
          f7.toast
            .create({
              text: a.err,
              position: "center",
              closeTimeout: 5000,
            })
            .open();
        } else {
          user.auth(username, password, (a) => {
            localStorage.setItem("keys", JSON.stringify(a.sea));
            loginScreenOpened = false;
          });
        }
        loading = false;
      });
    });
  }

  if (localStorage.getItem("keys")) {
    loading = true;
    user.auth(JSON.parse(localStorage.getItem("keys")), (a) => {
      if (a.err) {
        f7.toast
          .create({
            text: a.err,
            position: "bottom",
            closeTimeout: 5000,
          })
          .open();
      } else {
        loginScreenOpened = false;
      }
      loading = false;
    });
  }

  let useroffline;
</script>

<App {...f7params}>
  <!-- Views/Tabs container -->
  <Views tabs class="safe-areas">
    <LoginScreen class="demo-login-screen" opened={useroffline}>
      <Page>
        <center>
          <Icon f7="wifi_exclamationmark" color="yellow" />
          <div>you're offline!</div>
        </center>
      </Page>
    </LoginScreen>
    <LoginScreen class="demo-login-screen" opened={loginScreenOpened}>
      <Page loginScreen>
        {#if loading}
          <Block>
            loading...
            <Progressbar infinite />
          </Block>
        {:else}
          <LoginScreenTitle>artifact</LoginScreenTitle>
          <List form>
            <ListInput
              label="Username"
              type="text"
              placeholder="Your username"
              value={username}
              onInput={(e) => (username = e.target.value)}
            />
            <ListInput
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onInput={(e) => (password = e.target.value)}
            />
          </List>
          <Block style="display: flex;justify-content:center;">
            <Button
              disabled={loading}
              style="width: 20vw;"
              round
              fill
              onClick={signIn}>login</Button
            >
            <Button
              disabled={loading}
              style="width: 20vw;"
              round
              onClick={signUp}>signup</Button
            >
          </Block>
          <BlockFooter>
            by registering you agree to our term and conditions
          </BlockFooter>
        {/if}
      </Page>
    </LoginScreen>
    <!-- Tabbar for switching views-tabs -->
    <Toolbar tabbar icons bottom>
      <Link tabLink="#view-home" tabLinkActive iconF7="house_alt_fill" />
      <Link tabLink="#view-catalog" iconF7="search" />
      <Link tabLink="#view-history" iconF7="person_crop_circle_fill" />
      <Link tabLink="#view-settings" iconF7="gear" />
    </Toolbar>

    <!-- Your main view/tab, should have "view-main" class. It also has "tabActive" prop -->
    <View id="view-home" main tab tabActive url="/" />

    <View id="view-write" tab name="write" />

    <View id="view-seen" tab name="seen" />

    <View id="view-upvoted" tab name="upvoted" />

    <View id="view-activity" tab name="activity" />

    <View id="view-history" tab name="history" url="/history" />

    <!-- Catalog View -->
    <View id="view-catalog" name="catalog" tab url="/catalog/" />

    <!-- Settings View -->
    <View id="view-settings" name="settings" tab url="/settings/" />
  </Views>
</App>

<style>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
