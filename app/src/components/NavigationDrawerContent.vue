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
                <v-icon>{{ $icons.preferences }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>
                    Preferences
                </v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-list-item to="/grocery-list">
            <v-list-item-icon>
                <v-icon>{{ $icons.groceryList }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>
                    Grocery list
                </v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-list-item :to="`/history/${ownUser.id}`">
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

        <v-list-item to="/account">
            <v-list-item-icon>
                <v-icon>{{ $icons.accountCircle }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>
                    Account settings
                </v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-list-item to="/admin" v-if="hasPermissionPrefix('admin.')">
            <v-list-item-icon>
                <v-icon>{{ $icons.admin }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>
                    Admin
                </v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-list-item to="/tools">
            <v-list-item-icon>
                <v-icon>{{ $icons.tools }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>
                    Tools
                </v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-list-item to="/about">
            <v-list-item-icon>
                <v-icon>{{ $icons.information }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title>About</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
    </v-list>
</template>

<script>
    import {mapState} from 'pinia';
    import {useStore} from '@/store';

    export default {
        name: 'NavigationDrawerContent',

        computed: {
            ...mapState(useStore, [
                'ownUser',
                'hasPermissionPrefix',
            ]),
        },
    };
</script>
