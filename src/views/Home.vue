<template>
  <div class="home">
    <!-- Stats-->
    <user-stats/>
  </div>
</template>

<script>
// @ is an alias to /src
import {mapGetters} from 'vuex';
import UserStats from "../components/userStats";

export default {
  name: 'Home',
  components: {
    UserStats
  },
  mounted: {
  }
}
</script>
