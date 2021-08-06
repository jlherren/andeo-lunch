<template>
    <v-main>
        <the-app-bar sub-page>
            Profile
        </the-app-bar>

        <v-list>
            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title>
                        Username
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        {{ $store.getters.ownUsername }}
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title>
                        Display name
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        {{ $store.getters.ownUser.name }}
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item to="/profile/password">
                <v-list-item-content>
                    <v-list-item-title>
                        Change password
                    </v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                    <v-icon>{{ $icons.chevronRight }}</v-icon>
                </v-list-item-action>
            </v-list-item>
        </v-list>
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'Profile',

        components: {
            TheAppBar,
        },
    };
</script>
