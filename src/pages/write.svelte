<script>
  import { UploadClient } from "@uploadcare/upload-client";

  const client = new UploadClient({ publicKey: "085a3021b298fdaa0ac9" });

  import { Geolocation } from "@capacitor/geolocation";
  export let f7router;
  import {
    BlockHeader,
    Button,
    Icon,
    List,
    ListItem,
    Navbar,
    Page,
    Progressbar,
    TextEditor,
    f7,
  } from "framework7-svelte";

  let heading = "",
    desc = "";
  import { db, user } from "../js/gun";
  import axios from "axios";
  let processing = false;
  let loc;
  import { config } from "../js/init";
  import { v4 as uuidv4, v4 } from "uuid";

  function array2object(arr) {
    var obj = {};
    Gun.list.map(arr, function (v, f, t) {
      if (Gun.list.is(v) || Gun.obj.is(v)) {
        obj[f] = array2object(v);
        return;
      }
      obj[f] = v;
    });
    return obj;
  }

  async function post() {
    processing = true;
    let options = {
      pub: user.is.pub,
    };

    try {
      const coordinates = await Geolocation.getCurrentPosition();
      if (coordinates) {
        options["lat"] = coordinates.coords.latitude;
        options["long"] = coordinates.coords.longitude;
      }
    } catch (error) {}

    axios
      .post(config.api + "/api/geo", options)
      .then(async function (response) {
        loc = response.data;
        localStorage.setItem("loc", JSON.stringify(loc));
      })
      .catch((e) => {
        if (localStorage.getItem("loc")) {
          loc = JSON.parse(localStorage.getItem("loc"));
        }
      })
      .finally(async (e) => {
        let uidd = await uuidv4().split("-").join("");
        let data = {
          heading: heading,
          desc: desc,
          time: Math.floor(new Date().getTime() / 1000),
          uid: uidd,
          images: await array2object(selectedImage),
        };
        data = JSON.stringify(data);
        var hash = await SEA.work(data, null, null, {
          name: "SHA-256",
        });

        db.get(`#${loc.state}`).get(hash).put(data);
        db.get(`#${loc.country}`).get(hash).put(data);
        db.get(`#world`).get(hash).put(data);
        user
          .get("posts")
          .get(Math.floor(new Date().getTime() / 1000))
          .put(data);

        await axios.get(config.api + "/api/cache?pub=" + user.is.pub);
        await axios
          .post(config.api + "/api/submit", {
            heading: heading,
            content: desc,
            pub: user.is.pub || "",
            uid: uidd,
            images: await array2object(selectedImage),
          })
          .catch((e) => {
            processing = false;
            f7.toast
              .create({
                text: e.message,
                closeTimeout: 2000,
              })
              .open();
          });
        processing = false;
        f7router.back();
      });
    processing = false;
  }
  let disabledd;
  function prcess() {
    if (heading == "" || desc == "") {
      disabledd = true;
    } else {
      disabledd = false;
    }
  }

  $: heading || desc, prcess();

  let selectedImage = [];
  async function handleImageChange(event) {
    const file = event.target.files[0];
    if (file) {
      f7.dialog.progress("uploading");
      client.uploadFile(file).then((filee) => {
        selectedImage = [...selectedImage, { url: filee.cdnUrl }];
        f7.dialog.close();
      });
    }
  }

  function removeimg(url) {
    selectedImage = selectedImage.filter((a) => a.url !== url);
  }

  // axios
  //   .get(
  //     "https://newsapi.org/v2/everything?q=Delhi&sortBy=popularity&apiKey=05022151a37f4e7fb6b0befd60b1d156",
  //   )
  //   .then((res) => {
  //     let data = res.data;
  //
  //     if (confirm()) {
  //       let e = data.articles[(Math.random() * 100).toFixed(0)];
  //       if (e.description && e.url) {
  //         desc = e.description + "<br>" + `<a href="${e.url}">read more</a>`;
  //       } else {
  //         return;
  //       }
  //       if (e.urlToImage) {
  //         selectedImage = [{ url: e.urlToImage }];
  //       } else {
  //         return;
  //       }
  //       if (e.title) {
  //         heading = e.title;
  //         post();
  //       } else {
  //         return;
  //       }
  //     }
  //   });
</script>

<Navbar title="write" backLink=" " backLinkUrl="/" />
<Page>
  <List>
    <TextEditor
      onTextEditorChange={(v) => {
        heading = v;
      }}
      label="Headline"
      mode="popover"
      resizable
      type="text"
      placeholder="Add Title"
      clearButton
    />
    <TextEditor
      onTextEditorChange={(v) => {
        desc = v;
      }}
      buttons={[
        ["bold", "italic", "underline", "strikeThrough"],
        ["unorderedList"],
        ["link"],
        ["paragraph", "h1", "h2", "h3"],
        ["subscript", "superscript"],
      ]}
      placeholder="Add Context"
    />
    {#if processing}
      <BlockHeader>
        <Progressbar infinite />
      </BlockHeader>
    {/if}
    <ListItem>
      <div>
        <div class="image-picker">
          <input
            type="file"
            id="filepicker"
            name="filepicker"
            disabled={processing}
            class="hidden"
            accept="image/*"
            on:change={handleImageChange}
          />
          <label class="flex justify-center items-center" for="filepicker">
            <Icon f7="photo" color="blue" size="20" />
            <div class="ml-2">Add Media</div>
          </label>
        </div>
        <div class="flex gap-2 flex-wrap">
          {#each selectedImage as img (v4())}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <img
              on:click={() => {
                removeimg(img.url);
              }}
              class="h-28 w-28 object-cover rounded-md aspect-square"
              src={img.url + "-/preview/150x150/"}
              alt=""
            />
          {/each}
        </div>
      </div>
    </ListItem>
    <Button
      disabled={processing | disabledd}
      style="width: 20vw;margin: 10px;"
      onClick={post}
      fill
      round
      small
    >
      Post
    </Button>
  </List>
</Page>
