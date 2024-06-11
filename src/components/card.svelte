<script>
  import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    Icon,
    f7,
    Link,
    Popup,
    Page,
    Block,
    Navbar,
    NavRight,
    Messagebar,
    Button,
    BlockFooter,
    f7ready,
    Preloader,
  } from "framework7-svelte";
  import sanitizeHtml from "sanitize-html";
  import { db, user } from "../js/gun";
  import _ from "underscore";
  export let f;
  import { v4 } from "uuid";
  import News from "./news.svelte";

  let comment = [];
  let element;
  let messageText;
  let commentsopened = false;
  let comments_graph = db.get("comments").get(`#${f.uid}`);
  let vote = [];
  let voted = false;
  let userpub = user.is.pub;
  let upvotingprogress = false;

  function stopupvotingprogress() {
    upvotingprogress = false;
  }

  $: vote, stopupvotingprogress();

  db.get("upvotes")
    .get(`#${f.uid}`)
    .once((a) => {
      if (a) {
        delete a._;
        Object.entries(a).forEach((a) => {
          try {
            a = JSON.parse(a[1]);
            if (a.pub == userpub) {
              voted = true;
            }
            vote = [...vote, a];
          } catch (error) {}
        });
      }
    });

  async function upvote() {
    upvotingprogress = true;
    let data = {
      pub: user.is.pub,
      vote: "up",
    };
    data = JSON.stringify(data);
    var hash = await SEA.work(data, null, null, {
      name: "SHA-256",
    });
    await db
      .get("upvotes")
      .get(`#${f.uid}`)
      .get(hash)
      .put(data, (a) => {
        if (a.err) {
          f7.toast
            .create({
              text: a.err,
              position: "bottom",
              closeTimeout: 3000,
            })
            .open();
        } else {
          voted = true;
          vote = [...vote, data];
          user.get("upvoted").get(f.hash).put(f.channel);
        }
      });
  }

  function process() {
    comment = comment.filter((object, index) => {
      const found = comment.findIndex(
        (obj) => obj.uid === object.uid || obj.comment == undefined,
      );
      return found === index;
    });
    comment.sort((b, a) => {
      return new String(a.time).localeCompare(b.time);
    });
  }

  let loadcommentsplace = {};

  function addreply(key, value) {
    comment[key]["replies"] = [...comment[key]["replies"], value];
  }

  async function loadcomments() {
    commentsopened = true;
    loadcommentsplace = {};
    comment = [];
    try {
      await db
        .get("comments")
        .get(`#${f.uid}`)
        .once((a) => {
          if (a) {
            delete a._;
            Object.entries(a).forEach((c) => {
              try {
                let data = JSON.parse(c[1]);

                if (
                  data.hasOwnProperty("uid") &&
                  data.hasOwnProperty("time") &&
                  data.hasOwnProperty("comment") &&
                  data.hasOwnProperty("pub")
                ) {
                  let usergraph = db.user(data.pub);
                  usergraph.get("alias").once((n) => {
                    if (n) {
                      data["name"] = n;
                      data["replies"] = [];
                      loadcommentsplace[data.uid] = false;
                      usergraph
                        .get("comments")
                        .get(data.uid)
                        .get("verify")
                        .once((a) => {
                          if (a == data.comment) {
                            if (_.has(data, "replyto")) {
                              ///reply \((.*)\)\: /.test(data.comment)) {
                              data.comment = data.comment.replace(
                                /reply \((.*)\)\: /,
                                "",
                              );
                              Object.entries(comment).forEach((e) => {
                                let key = e[0];
                                let value = e[1];

                                if (value.uid == data["replyto"]) {
                                  addreply(key, data);
                                }
                              });
                            } else {
                              comment = [...comment, data];
                            }
                          }
                        });
                    }
                  });
                }
              } catch (e) {}
            });
          }
        });
    } catch (error) {
      comment = [];
    }
  }

  $: comment, process();

  let replyto = "";
  let replytoname = "";

  async function sendMessage() {
    try {
      if (messageText) {
        let uuis = v4().split("-").join("");
        let data = {
          comment: messageText,
          pub: user.is.pub,
          uid: uuis,
          time: Math.floor(new Date().getTime() / 1000),
        };
        if (replyto !== "") {
          data["replyto"] = replyto;
        }

        data = JSON.stringify(data);
        var hash = await SEA.work(data, null, null, {
          name: "SHA-256",
        });
        await user.get("comments").get(uuis).get("verify").put(messageText);
        await comments_graph.get(hash).put(data);
        messageText = "";
        replyto = "";
        replytoname = "";
        loadcomments();
      }
    } catch (error) {}
  }
  async function upvotecomment() {}

  let popup;
  let images = [];
  let thumbs = [];
  if (!_.has(f, "images")) {
    f["images"] = [];
  }
  Object.values(f.images).forEach((e) => {
    images.push({ url: e.url });
    if (/ucarecdn/.test(e.url)) {
      thumbs.push(e.url + "-/preview/500x500/");
    } else {
      thumbs.push(e.url);
    }
  });

  f7ready(() => {
    popup = f7.photoBrowser.create({
      photos: images,
      thumbs: thumbs,
      closeByBackdropClick: true,
    });
  });

  let newsopened = false;

  import { inview } from "svelte-inview";
  import { sha256 } from "hash.js";
  import Skeleton from "./skeleton.svelte";
  const options = {};
  let timeout_;
  export let justrender;
</script>

<div
  use:inview={options}
  on:inview_enter={(event) => {
    if (!justrender) {
      timeout_ = setTimeout(async () => {
        user.get("seenPostCopy").get(f.hash).put(f.channel);
        user
          .get("seen")
          .get(await sha256().update(JSON.stringify(f)).digest("hex"))
          .put(true);
      }, 5000);
    }
  }}
  on:inview_leave={(event) => {
    if (!justrender) {
      clearInterval(timeout_);
    }
  }}
>
  <Popup
    class="demo-popup"
    opened={commentsopened}
    onPopupClosed={() => {
      commentsopened = false;
      comment = [];
      loadcommentsplace = {};
    }}
  >
    <Page>
      <Navbar title={f.heading}>
        <NavRight>
          <Link popupClose>Close</Link>
        </NavRight>
      </Navbar>
      {#if comment.length > 0}
        {#each comment as f (v4())}
          <Card>
            <div class="flex">
              <Button
                disabled={true}
                on:click={() => {
                  upvotecomment(f.uid);
                }}
                style="margin: 10px;"
              >
                <img
                  class="aspect-square h-4 w-4 rounded object-cover"
                  src={`https://api.dicebear.com/7.x/identicon/svg?seed=${f.pub}&backgroundColor=transparent`}
                  alt=""
                />
              </Button>
              <div
                class="flex flex-col mt-auto mb-auto items-center justify-center"
              >
                {f.comment}
              </div>
            </div>

            <CardFooter style="margin-left: 23px;">
              <Link
                color="blue"
                onClick={() => {
                  messageText = `reply (${f.comment}): `;
                  replyto = f.uid;
                  replytoname = f.name;
                }}
              >
                reply
              </Link>
            </CardFooter>
            {#if f.replies.length !== 0}
              <div class="ml-4 flex flex-col">
                {#if loadcommentsplace[f.uid] == true}
                  {#each f.replies as f (v4())}
                    <Card outline>
                      <CardFooter>
                        <div class="flex justify-center gap-2 items-center">
                          <img
                            class="aspect-square rounded h-4 w-4 object-cover"
                            src={`https://api.dicebear.com/7.x/identicon/svg?seed=${f.pub}&backgroundColor=transparent`}
                            alt=""
                          />
                          <div class="ml-2">
                            {f.comment.replace(/reply \((.*)\)\: /, "")}
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  {/each}
                {:else}
                  <Card outline>
                    <CardFooter>
                      <div class="flex justify-center gap-2 items-center">
                        <img
                          class="aspect-square rounded h-4 w-4 object-cover"
                          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${f.replies[0].pub}&backgroundColor=transparent`}
                          alt=""
                        />
                        <div class="ml-2">
                          {f.replies[0].comment.replace(
                            /reply \((.*)\)\: /,
                            "",
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                {/if}
              </div>
            {/if}
            {#if f.replies.length > 1 && loadcommentsplace[f.uid] == false}
              <div style="margin-left: 23px;" class="mb-2">
                <Link
                  onClick={() => {
                    loadcommentsplace[f.uid] = true;
                  }}
                >
                  load replies
                </Link>
              </div>
            {/if}
          </Card>
        {/each}
      {:else if comment == 0}
        <BlockFooter>Be The First One To Comment</BlockFooter>
      {:else}
        <Skeleton />
      {/if}

      <Messagebar
        placeholder="Type a comment"
        value={messageText}
        onInput={(e) => (messageText = e.target.value)}
      >
        <Button class="link icon-only" slot="inner-end" on:click={sendMessage}>
          <Icon ios="f7:arrow_up_circle_fill" md="material:send" />
        </Button>
      </Messagebar>
    </Page>
  </Popup>

  <News {thumbs} {popup} {f} bind:opened={newsopened} />

  <!--
  CARD COMPONENT
-->

  <Card outline>
    <CardHeader class="line-clamp-3" style="padding-bottom: 0px;">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        on:click={() => {
          newsopened = true;
        }}
      >
        {f.heading}
      </div>
    </CardHeader>
    <CardContent
      class="line-clamp-2 mb-1 opacity-80"
      style="font-size: 13px;padding-top: 10px;"
    >
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        on:click={() => {
          newsopened = true;
        }}
      >
        {@html sanitizeHtml(f.desc || f.content).replace(/href\=\"(.*)\"/)}
      </div>
    </CardContent>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="flex overflow-x-scroll m-2"
      on:click={() => {
        popup.open();
      }}
    >
      {#each thumbs as img (v4())}
        <img
          class="h-28 {thumbs.length == 1
            ? 'w-full'
            : 'w-28 aspect-square'} ml-2 object-cover rounded-md"
          src={img}
          alt=""
        />
      {/each}
    </div>
    <CardFooter style="font-size: 12px;padding-top: 0px;">
      <Button
        disabled={voted}
        color={voted ? "red" : "blue"}
        small
        on:click={() => {
          if (!voted) {
            upvote();
          }
        }}
      >
        {#if upvotingprogress}
          <span class="animate-spin mr-0.5">
            <Preloader size="15" color="blue" />
          </span>
        {:else}
          <Icon f7="arrow_up" size="18" />
        {/if}
        {vote.length}
      </Button>
      <Button rounded onClick={loadcomments}>
        <Icon f7="chat_bubble" size="19" />
      </Button>
    </CardFooter>
  </Card>
</div>
