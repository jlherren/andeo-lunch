<template>
    <v-main>
        <the-app-bar sub-page>
            Users

            <template #buttons>
                <dynamic-button icon="$icons.plus" label="Add" @click="createUser" :disabled="isBusy"/>
            </template>
        </the-app-bar>

        <shy-progress v-if="users === null"/>

        <v-container>
            <v-simple-table v-if="users !== null">
                <template #default>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Name</th>
                            <th>Flags</th>
                            <th>Edit limit (days)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user of users" :key="user.id" @click="edit(user)">
                            <td>{{ user.username }}</td>
                            <td>{{ user.name }}</td>
                            <td>{{ getFlags(user) }}</td>
                            <td>{{ user.maxPastDaysEdit ?? '&mdash;' }}</td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-container>
    </v-main>
</template>

<script>
    import DynamicButton from '@/components/DynamicButton.vue';
    import ShyProgress from '@/components/ShyProgress.vue';
    import TheAppBar from '@/components/TheAppBar.vue';

    export default {
        name: 'Users',

        components: {
            DynamicButton,
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                users:  null,
                isBusy: true,
            };
        },

        async created() {
            this.users = await this.$store().adminFetchUsers();
            this.isBusy = false;
        },

        methods: {
            createUser() {
                this.$router.push('/admin/users/new');
            },

            edit(user) {
                if (this.isBusy) {
                    return;
                }
                this.$router.push(`/admin/users/${user.id}`);
            },

            getFlags(user) {
                let flags = [];
                if (!user.active) {
                    flags.push('inactive');
                }
                if (user.hidden) {
                    flags.push('hidden');
                }
                if (user.pointExempted) {
                    flags.push('point exempted');
                }
                if (user.hiddenFromEvents) {
                    flags.push('no participation');
                }
                return flags.join(', ');
            },
        },
    };
</script>
