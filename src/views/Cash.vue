<template>
    <v-main>
        <custom-app-bar>Cash</custom-app-bar>

        <user-stats/>
        <v-divider/>
        <div class="center-btn">
            <v-btn>Create transaction</v-btn>
        </div>
    </v-main>
</template>

<script>
    import UserStats from '../components/userStats';
    import CustomAppBar from '@/components/lmAppBar';

    export default {
        name: 'Cash',
        components: {CustomAppBar, UserStats},
    };
</script>

<style scoped>
    .center-btn {
        display: flex;
        justify-content: center;
        margin: 16px;
    }
</style>
