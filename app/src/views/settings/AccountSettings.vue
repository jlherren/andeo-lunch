<template>
    <v-main>
        <the-app-bar>
            Account settings
        </the-app-bar>

        <v-list>
            <v-list-item>
                <v-list-item-icon>
                    <v-icon>{{ $icons.account }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        Username
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        {{ ownUsername }}
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item>
                <v-list-item-icon>
                    <v-icon>{{ $icons.account }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        Display name
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        {{ ownUser.name }}
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item to="/account/password">
                <v-list-item-icon>
                    <v-icon>{{ $icons.password }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        Change password
                    </v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                    <v-icon>{{ $icons.chevronRight }}</v-icon>
                </v-list-item-action>
            </v-list-item>

            <v-list-item @click.stop="logout">
                <v-list-item-icon>
                    <v-icon>{{ $icons.logout }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Logout</v-list-item-title>
                </v-list-item-content>
            </v-list-item>
        </v-list>
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar';
    import {mapState} from 'pinia';
    import {useStore} from '@/store';

    export default {
        name: 'AccountSettings',

        components: {
            TheAppBar,
        },

        created() {
            this.$store().fetchUser({userId: this.$store().ownUserId});
        },

        computed: {
            ...mapState(useStore, [
                'ownUser',
                'ownUsername',
            ]),
        },

        methods: {
            logout() {
                this.$store().logout();
            },
        },
    };
</script>
