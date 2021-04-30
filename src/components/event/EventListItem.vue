<template>
    <v-list-item :to="link">
        <template v-if="prominent">
            <v-list-item-content>
                <v-list-item-subtitle class="center-text">{{ formattedDate }}</v-list-item-subtitle>
                <v-list-item-title class="center-text">{{ event.name }}</v-list-item-title>

                <v-list-item-content>
                    <participation-summary class="justify-center" :participations="participations"/>
                </v-list-item-content>

            </v-list-item-content>

            <v-list-item-action v-if="undecidedParticipation">
                <v-icon>
                    mdi-alert
                </v-icon>
            </v-list-item-action>
        </template>

        <template v-else>
            <v-list-item-icon>
                <v-icon>{{ icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
                <v-list-item-title>
                    {{ event.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                    <span>{{ formattedDate }}</span>
                </v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action v-if="undecidedParticipation">
                <v-icon title="You have not decided yet!">
                    mdi-alert
                </v-icon>
            </v-list-item-action>
        </template>
    </v-list-item>
</template>

<script>
    import Balance from '@/components/Balance';
    import * as DateUtils from '@/utils/dateUtils';
    import ParticipationSummary from '@/components/event/ParticipationSummary';

    export default {
        name: 'eventListItem',

        components: {
            ParticipationSummary,
            Balance,
        },

        props: {
            event:     {
                type:     Object,
                required: true,
            },
            prominent: Boolean,
        },

        data() {
            return {
                ownUserId: this.$store.getters.ownUserId,
            };
        },

        created() {
            this.reload();
        },

        watch: {
            prominent(value, old) {
                this.reload();
            },
        },

        computed: {
            undecidedParticipation() {
                if (this.event.type === 'label') {
                    return false;
                }
                let ownParticipation = this.$store.getters.participation(this.event.id, this.ownUserId);
                return !ownParticipation || ownParticipation.type === 'undecided';
            },

            icon() {
                switch (this.event.type) {
                    case 'lunch':
                        return 'mdi-food-variant';
                    case 'event':
                        return 'mdi-party-popper';
                    case 'label':
                        return 'mdi-label';
                    default:
                        return 'mdi-help-circle';
                }
            },

            formattedDate() {
                return DateUtils.displayFormat(this.event.date);
            },

            link() {
                return `/events/${this.event.id}`;
            },

            participations() {
                return this.$store.getters.participations(this.event.id) ?? [];
            },
        },

        methods: {
            reload() {
                if (this.prominent) {
                    this.$store.dispatch('fetchParticipations', {eventId: this.event.id});
                } else {
                    let params = {
                        eventId: this.event.id,
                        userId:  this.ownUserId,
                    };
                    this.$store.dispatch('fetchSingleParticipation', params);
                }
            },
        },
    };
</script>

<style scoped lang="scss">
    span + span {
        margin-left: 1em;
    }
</style>
