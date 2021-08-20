<template>
    <div>
        <v-app-bar app :extension-height="extensionHeight" flat dark>
            <v-app-bar-nav-icon v-if="!subPage && !noMenu" @click="toggleDrawer">
                <template v-slot:default>
                    <v-badge :value="$global.hasUpdate" dot>
                        <v-icon>{{ $icons.appMenu }}</v-icon>
                    </v-badge>
                </template>
            </v-app-bar-nav-icon>
            <v-app-bar-nav-icon v-if="subPage" @click="goBack">
                <v-icon>{{ $icons.arrowLeft }}</v-icon>
            </v-app-bar-nav-icon>
            <v-app-bar-title>
                <slot/>
            </v-app-bar-title>
            <v-spacer/>
            <slot name="buttons"/>
            <img v-if="logo" src="/img/app-bar.svg" alt="">
            <template v-if="$slots.extension" v-slot:extension>
                <slot name="extension"/>
            </template>
        </v-app-bar>

        <v-navigation-drawer v-model="drawerOpen" app fixed temporary>
            <navigation-drawer-content/>
        </v-navigation-drawer>
    </div>
</template>

<script>
    import NavigationDrawerContent from '@/components/NavigationDrawerContent';

    export default {
        name: 'TheAppBar',

        components: {
            NavigationDrawerContent,
        },

        props: {
            subPage:         Boolean,
            extensionHeight: {
                type: [Number, String],
            },
            logo:            Boolean,
            noMenu:          Boolean,
        },

        data() {
            return {
                drawerOpen: false,
            };
        },

        methods: {
            goBack() {
                this.$router.go(-1);
            },

            toggleDrawer() {
                this.drawerOpen = !this.drawerOpen;
            },
        },
    };
</script>

<style lang="scss" scoped>
    .v-app-bar img {
        height: 42px;
    }
</style>
