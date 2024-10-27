<template>
    <v-main>
        <the-app-bar>
            Tools
        </the-app-bar>

        <v-list>
            <v-list-item to="/tools/ics">
                <v-list-item-icon>
                    <v-icon>{{ $icons.calendar }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        Create ICS link
                    </v-list-item-title>
                </v-list-item-content>
            </v-list-item>

            <v-list-item to="/tools/device-versions" v-if="hasPermission('tools.deviceVersions')">
                <v-list-item-icon>
                    <v-icon>{{ $icons.tools }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        Device versions
                    </v-list-item-title>
                </v-list-item-content>
            </v-list-item>

            <v-list-item to="/tools/configurations" v-if="hasPermission('tools.configurations')">
                <v-list-item-icon>
                    <v-icon>{{ $icons.tools }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        Configurations
                    </v-list-item-title>
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
        name: 'Tools',

        components: {
            TheAppBar,
        },

        computed: {
            ...mapState(useStore, [
                'hasPermission',
            ]),
        },
    };
</script>
