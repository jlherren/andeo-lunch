<template>
    <v-list-item :class="itemClass">
        <v-list-item-avatar>
            <v-avatar :color="bigIconColor">
                <v-icon dark>{{ bigIcon }}</v-icon>
            </v-avatar>
        </v-list-item-avatar>

        <v-list-item-content>
            <v-list-item-title>
                <span class="mr-4">{{ user.name }}</span>

                <v-chip small class="mr-1" v-if="participation.credits.points > 0">
                    <balance :value="participation.credits.points" points small/>
                </v-chip>

                <v-chip small v-if="participation.credits.money > 0" class="mr-1">
                    <v-icon small>mdi-cash-multiple</v-icon>
                </v-chip>
            </v-list-item-title>
        </v-list-item-content>

        <v-list-item-action>
            <v-btn icon @click="openDialog()">
                <v-icon>mdi-pencil</v-icon>
            </v-btn>
        </v-list-item-action>

        <v-dialog v-model="editDialog">
            <participation-edit :participation="participation" @close="editDialog = false" ref="editForm"/>
        </v-dialog>
    </v-list-item>
</template>

<script>
    import ParticipationEdit from '@/components/event/ParticipationEdit';
    import Balance from '@/components/Balance';
    import Vue from 'vue';

    export default {
        name: 'ParticipationListItem',

        components: {
            Balance,
            ParticipationEdit,
        },

        props: {
            participation: {
                type:     Object,
                required: true,
            },
        },

        data() {
            return {
                editDialog: false,
            };
        },

        computed: {
            user() {
                return this.$store.getters.user(this.participation.userId) ?? {};
            },

            bigIcon() {
                switch (this.participation.type) {
                    case 'omnivorous':
                        return 'mdi-hamburger';
                    case 'vegetarian':
                        return 'mdi-apple';
                    case 'opt-out':
                        return 'mdi-cancel';
                    case 'undecided':
                        return 'mdi-help-circle';
                    default:
                        return 'mdi-alert-circle';
                }
            },

            bigIconColor() {
                switch (this.participation.type) {
                    case 'omnivorous':
                    case 'vegetarian':
                        return 'primary';
                    default:
                        return 'grey';
                }
            },

            itemClass() {
                switch (this.participation.type) {
                    case 'omnivorous':
                    case 'vegetarian':
                        return 'optIn';
                    default:
                        return 'optOut';
                }
            },
        },

        methods: {
            openDialog() {
                this.editDialog = true;
                Vue.nextTick(() => this.$refs.editForm.reset());
            },
        },
    };
</script>

<style scoped lang="scss">
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

    .optIn {
        .v-list-item__content, .v-chip {
            color: black;
        }
    }

    .optOut {
        .v-list-item__content, .v-chip {
            // TODO: use text--secondary mixin?
            color: grey;
        }
    }

    .v-chip .v-icon {
        color: inherit;
    }
</style>
