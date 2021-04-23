<template>
    <div>
        <v-app-bar app>
            <v-btn icon @click="drawerOpen = !drawerOpen">
                <v-icon>mdi-menu</v-icon>
            </v-btn>
            <v-toolbar-title>
                <slot/>
            </v-toolbar-title>
            <v-spacer/>
            <slot name="buttons"/>
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

        components: {
            NavigationDrawerContent,
        },

        data: () => ({
            drawerOpen: false,
        }),
    };
</script>
