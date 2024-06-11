import GUN from "gun";
import "gun/sea";
import { writable } from "svelte/store";
export const db = new GUN({
  peers: [localStorage.getItem("peer") || "https://peer.wallie.io/gun"],
  localStorage: true,
  radisk: true,
});

export const user = db.user().recall({ sessionStorage: true });

export let loggedin = writable(false);
db.on("auth", (a, b, c) => {
  loggedin.set(true);
});

export const themeapp = writable(true);
