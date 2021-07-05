<template>
    <v-list>
        <v-list-item>
            <v-list-item-avatar color="primary">
                <v-icon dark>{{ $icons.accountCircle }}</v-icon>
            </v-list-item-avatar>

            <v-list-item-content>
                <v-list-item-title class="title">{{ ownUser.name }}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-divider/>

        <v-list-item to="/preferences">
            <v-list-item-icon>
                <v-icon>{{ $icons.cog }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>
                    Preferences
                </v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-list-item to="/history">
            <v-list-item-icon>
                <v-icon>{{ $icons.balanceHistory }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>Balance history</v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-list-item to="/log">
            <v-list-item-icon>
                <v-icon>{{ $icons.log }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>Audit log</v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-list-item @click="aboutDialog = true">
            <v-list-item-icon>
                <v-icon>{{ $icons.information }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>About</v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-list-item @click.stop="logout">
            <v-list-item-icon>
                <v-icon>{{ $icons.logout }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>Logout</v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-dialog v-model="aboutDialog">
            <about-content @close="aboutDialog = false"/>
        </v-dialog>
    </v-list>
</template>

<script>
    import AboutContent from '@/components/AboutContent';
    import {mapGetters} from 'vuex';

    export default {
        name: 'navigationDrawerContent',

        components: {
            AboutContent,
        },

        data() {
            return {
                aboutDialog: false,
            };
        },

        computed: {
            ...mapGetters([
                'ownUser',
            ]),
        },

        methods: {
            logout() {
                this.$store.dispatch('logout');
            },
        },
    };
</script>
