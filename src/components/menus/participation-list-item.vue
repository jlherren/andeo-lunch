<template>
    <v-list-item>
        <v-list-item-avatar>
            <v-avatar color="primary">
                <v-icon dark>mdi-account-circle</v-icon>
            </v-avatar>
        </v-list-item-avatar>

        <v-list-item-content>
            <v-list-item-title>
                {{ user.name }}

                <span class="ml-4"/>

                <v-chip small v-if="participation.credits.points > 0" class="mr-1">
                    {{ participation.credits.points }}
                    <v-icon small>mdi-handshake</v-icon>
                </v-chip>

                <v-chip small class="mr-1" v-if="participation.type !== 'none'">
                    <v-icon small>{{ icon }}</v-icon>
                </v-chip>

                <v-chip small v-if="participation.provides.money" class="mr-1">
                    <v-icon small>mdi-cash-multiple</v-icon>
                </v-chip>
            </v-list-item-title>
        </v-list-item-content>

        <v-list-item-action>
            <v-btn icon @click="toggle">
                <v-icon>mdi-pencil</v-icon>
            </v-btn>
        </v-list-item-action>
    </v-list-item>
</template>

<script>
    export default {
        name: 'participation-list-item',

        props: {
            participation: Object,
        },

        data() {
            return {
                expanded: false,
            };
        },

        computed: {
            user() {
                return this.$store.getters.user(this.participation.userId);
            },

            icon() {
                switch (this.participation.type) {
                    case 'carnivore':
                        return 'mdi-food-steak';
                    case 'vegetarian':
                        return 'mdi-food-apple';
                    default:
                        return 'mdi-question';
                }
            },
        },

        methods: {
            toggle() {
                this.expanded = !this.expanded;
            },
        },
    };
</script>

<style lang="scss" scoped>
    .participants {
        display: inline-flex;
        align-items: center;
    }

    .participants-details {
        font-size: 12pt;
        line-height: 100%;

        .v-icon {
            font-size: inherit;
        }
    }

    .total {
        font-size: 28pt;
        color: #43a047;
        margin: 0 0.25em;
    }
</style>
