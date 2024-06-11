<script>
  import {
    Block,
    BlockHeader,
    Link,
    List,
    ListItem,
    Navbar,
    Page,
  } from "framework7-svelte";
  let posts = [];
</script>

<Navbar title="history" />
<Page name="history">
  <List>
    <ListItem link="/activity">Your Activity</ListItem>
    <ListItem link="/upvoted">Upvoted Posts</ListItem>
    <ListItem link="/seen">Seen Posts</ListItem>
  </List>
</Page>
