<template>
    <v-main>
        <the-app-bar>
            Admin
        </the-app-bar>

        <v-list>
            <v-list-item to="/admin/users" v-if="hasPermission('admin.user')">
                <v-list-item-icon>
                    <v-icon>{{ $icons.admin }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        Users
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
        name: 'Admin',

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
