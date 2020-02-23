<template>
    <div>
        <user-stats/>
        <v-divider/>
        <div class="center-btn">
            <v-btn>Überweisung erstellen</v-btn>
        </div>
    </div>
</template>

<script>
    import UserStats from "../components/userStats";

    export default {
        name: "Cash",
        components: {UserStats}
    }
</script>

<style scoped>
    .center-btn {
        display: flex;
        justify-content: center;
        margin: 16px;
    }
</style>