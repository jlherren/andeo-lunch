<template>
  <div class="home">
    <!-- Stats-->
    <user-stats/>
    <v-divider/>
    <menu-list/>
  </div>
</template>

<script>
// @ is an alias to /src
import {mapGetters} from 'vuex';
import UserStats from "../components/userStats";
import MenuList from "../components/menuList";

export default {
  name: 'Home',
  components: {
    MenuList,
    UserStats
  },
  mounted: {
  }
}
</script>
