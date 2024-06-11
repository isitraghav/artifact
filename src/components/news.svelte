<script>
  import {
    Actions,
    ActionsButton,
    ActionsGroup,
    Block,
    BlockTitle,
    Icon,
    Link,
    NavLeft,
    NavRight,
    NavTitle,
    Navbar,
    Page,
    Popup,
  } from "framework7-svelte";
  import sanitizeHtml from "sanitize-html";
  import { v4 } from "uuid";
  export let opened;
  export let f;
  export let popup, thumbs; //, images;

  import { Share } from "@capacitor/share";
  import { Browser } from "@capacitor/browser";
  window.open = async (url) => {
    await Browser.open({ url: url }).catch((e) => {});
  };

  // import { Directory, Filesystem } from "@capacitor/filesystem";
  // async function downloadAll() {
  //   Filesystem.requestPermissions().then((a) => {
  //
  //   });
  //   if (images.length !== 0) {
  //     images.forEach(async (img) => {
  //       img = img.url;
  //
  //       await Filesystem.downloadFile({
  //         url: img,
  //         path: Directory.Data,
  //         progress: ({ a }, b, c) => {
  //
  //         },
  //         recursive: true,
  //       }).then((a) => {
  //
  //       });
  //     });
  //   }
  // }
</script>

<Popup
  class="demo-popup"
  {opened}
  onPopupClosed={() => {
    opened = false;
  }}
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <Page>
    <Navbar>
      <NavLeft>
        <Link popupClose>close</Link>
      </NavLeft>
      <NavTitle>
        {f.heading}
      </NavTitle>
      <NavRight>
        <Link actionsOpen="#actionss">
          <i class="fa-solid fa-ellipsis fs-xl"></i>
        </Link>
      </NavRight>
    </Navbar>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="flex gap-2 overflow-x-scroll m-2"
      on:click={() => {
        popup.open();
      }}
    >
      {#each thumbs as img (v4())}
        <img
          class="h-28 {thumbs.length == 1
            ? 'w-full'
            : 'w-28 aspect-square'} object-cover rounded-md"
          src={img}
          alt=""
        />
      {/each}
    </div>
    <Block>
      <div class="text-lg">
        {f.heading}
      </div>
      {@html sanitizeHtml(f.desc).replace(
        /href\=\"(.*)\"/,
        "onclick=\"window.open('$1')\" class='underline'",
      )}
    </Block>
    <Actions id="actionss">
      <ActionsGroup>
        <ActionsButton
          onClick={async () => {
            await Share.share({
              url: `https://artifactapp.xyz/${f.pub}/${f.uid}`,
            });
          }}>share</ActionsButton
        >
        <!-- <ActionsButton onClick={downloadAll}>Download Media</ActionsButton> -->
        <ActionsButton>report</ActionsButton>
      </ActionsGroup>
      <ActionsGroup>
        <ActionsButton color="red">Cancel</ActionsButton>
      </ActionsGroup>
    </Actions>
  </Page>
</Popup>
