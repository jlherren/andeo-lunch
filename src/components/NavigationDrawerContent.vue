<template>
    <v-list>
        <v-list-item>
            <v-list-item-avatar color="primary">
                <v-icon dark>mdi-account-circle</v-icon>
            </v-list-item-avatar>

            <v-list-item-content>
                <v-list-item-title class="title">{{ ownUser.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ ownUser.username }}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>

        <v-divider />

        <settings-dialog />

        <v-list-item @click="openAboutDialog">
            <v-list-item-icon>
                <v-icon>mdi-information</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>About</v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-list-item @click.stop="logout">
            <v-list-item-icon>
                <v-icon>mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>Logout</v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-dialog v-model="aboutDialog">
            <v-card>
                <v-card-title>
                    About Lunch Money
                </v-card-title>

                <v-card-text>
                    Frontend version: {{ frontendVersion }}<br>

                    Backend version:
                    <v-progress-circular size="10" width="1" indeterminate v-if="backendVersionLoading"/>
                    <span v-else>{{ backendVersion }}</span>
                    <br>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn text @click="aboutDialog = false">
                        Close
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-list>
</template>

<script>
    import {mapGetters} from 'vuex';
    import SettingsDialog from './SettingsDialog';

    export default {
        name:       'navigationDrawerContent',
        components: {
            SettingsDialog,
        },
        data() {
            return {
                aboutDialog:           false,
                backendVersionLoading: false,
            };
        },
        computed: {
            ...mapGetters([
                'ownUser',
                'backendVersion',
                'frontendVersion',
            ]),
        },
        methods:  {
            logout() {
                this.$store.dispatch('logout');
            },
            openAboutDialog() {
                this.aboutDialog = true;
                this.backendVersionLoading = true;
                this.$store.dispatch('fetchBackendVersion')
                    .catch(() => null)
                    .then(() => this.backendVersionLoading = false);
            },
        },
    };
</script>
