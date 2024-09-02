<template>
    <v-list-item :class="itemClass" @click="openDialog">
        <v-list-item-avatar>
            <v-avatar v-if="bigIcon !== null" :color="bigIconColor">
                <v-icon dark :data-type="participation.type">{{ bigIcon }}</v-icon>
            </v-avatar>
        </v-list-item-avatar>

        <v-list-item-content>
            <v-list-item-title>
                <span class="mr-4">{{ user.name }}</span>

                <v-chip v-if="participation.credits.points > 0" class="mr-1" small>
                    <balance :value="participation.credits.points" points small/>
                </v-chip>

                <v-chip v-if="participation.credits.money > 0" class="mr-1" small>
                    <v-icon small data-icon="money">{{ $icons.money }}</v-icon>
                </v-chip>
            </v-list-item-title>
        </v-list-item-content>

        <v-dialog v-model="editDialog" persistent max-width="600">
            <participation-edit
                v-if="editDialog"
                :event="event"
                :participation="participation"
                :readonly="readonly"
                @close="editDialog = false"
                @saved="saved"
            />
        </v-dialog>
    </v-list-item>
</template>

<script>
    import * as ParticipationUtils from '@/utils/participationUtils';
    import Balance from '@/components/Balance';
    import ParticipationEdit from '@/components/event/ParticipationEdit';

    export default {
        name: 'ParticipationListItem',

        components: {
            Balance,
            ParticipationEdit,
        },

        props: {
            event:         {
                type:     Object,
                required: true,
            },
            participation: {
                type:     Object,
                required: true,
            },
            readonly:      Boolean,
        },

        data() {
            return {
                editDialog: false,
            };
        },

        computed: {
            user() {
                return this.$store().user(this.participation.userId) ?? {};
            },

            bigIcon() {
                return ParticipationUtils.icon(this.participation.type);
            },

            bigIconColor() {
                switch (this.participation.type) {
                    case 'omnivorous':
                    case 'vegetarian':
                    case 'opt-in':
                        return 'primary';
                    default:
                        return 'gray';
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
            color: gray;
        }
    }

    .v-chip .v-icon {
        color: inherit;
    }
</style>
