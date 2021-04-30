<template>
    <div>
        <v-app-bar app :extension-height="extensionHeight">
            <v-app-bar-nav-icon @click="toggleDrawer" v-if="!subPage"/>
            <v-app-bar-nav-icon @click="goBack" v-if="subPage">
                <v-icon>mdi-arrow-left</v-icon>
            </v-app-bar-nav-icon>
            <v-app-bar-title>
                <slot/>
            </v-app-bar-title>
            <v-spacer/>
            <slot name="buttons"/>
            <template v-slot:extension v-if="$slots.extension">
                <slot name="extension"/>
            </template>
        </v-app-bar>

        <v-navigation-drawer v-model="drawerOpen" app fixed temporary>
            <navigation-drawer-content/>
        </v-navigation-drawer>
    </div>
</template>

<script>
    import NavigationDrawerContent from '@/components/navigationDrawerContent';

    export default {
        name: 'lmAppBar',

        props: {
            subPage:         {
                type:    Boolean,
                default: false,
            },
            extensionHeight: {
                type: [Number, String],
            },
        },

        components: {
            NavigationDrawerContent,
        },

        data: () => ({
            drawerOpen: false,
        }),

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
