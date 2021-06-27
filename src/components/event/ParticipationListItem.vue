<template>
    <v-list-item :class="itemClass">
        <v-list-item-avatar>
            <v-avatar v-if="bigIcon !== null" :color="bigIconColor">
                <v-icon dark>{{ bigIcon }}</v-icon>
            </v-avatar>
        </v-list-item-avatar>

        <v-list-item-content>
            <v-list-item-title>
                <span class="mr-4">{{ user.name }}</span>

                <v-chip v-if="participation.credits.points > 0" class="mr-1" small>
                    <balance :value="participation.credits.points" points small/>
                </v-chip>

                <v-chip v-if="participation.credits.money > 0" class="mr-1" small>
                    <v-icon small>{{ $icons.money }}</v-icon>
                </v-chip>
            </v-list-item-title>
        </v-list-item-content>

        <v-list-item-action>
            <v-btn icon @click="openDialog()">
                <v-icon>{{ $icons.edit }}</v-icon>
            </v-btn>
        </v-list-item-action>

        <v-dialog v-model="editDialog">
            <participation-edit :participation="participation" @close="editDialog = false" @saved="saved()" ref="editForm"/>
        </v-dialog>
    </v-list-item>
</template>

<script>
    import * as ParticipationUtils from '@/utils/participationUtils';
    import Balance from '@/components/Balance';
    import ParticipationEdit from '@/components/event/ParticipationEdit';
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
                return ParticipationUtils.icon(this.participation.type);
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

            saved() {
                // Notify parent
                this.$emit('saved');
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
