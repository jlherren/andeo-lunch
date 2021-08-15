<template>
    <div>
        <v-app-bar app :extension-height="extensionHeight" flat dark>
            <v-app-bar-nav-icon v-if="!subPage" @click="toggleDrawer">
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
            subPage:         {
                type:    Boolean,
                default: false,
            },
            extensionHeight: {
                type: [Number, String],
            },
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
