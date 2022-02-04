<template>
    <div>
        <label v-if="label" class="v-label" :class="$vuetify.theme.dark ? 'theme--dark' : 'theme--light'">
            Participation type{{ $vuetify.breakpoint.xs ? ': ' + displayName(value) : '' }}
        </label>
        <v-btn-toggle :value="value" @change="update($event)" :dense="$vuetify.breakpoint.xs" mandatory class="full-width">
            <v-btn v-for="type of types" :key="type.id" :value="type.id" :disabled="disabled">
                <v-icon :large="$vuetify.breakpoint.mdAndUp" left>{{ type.icon }}</v-icon>
                <span class="hidden-xs-only">{{ type.name }}</span>
            </v-btn>
        </v-btn-toggle>
    </div>
</template>

<script>
    export default {
        name: 'ParticipationTypeWidget',

        props: {
            value:     {
                type:     String,
                required: true,
            },
            eventType: {
                type:     String,
                required: true,
            },
            disabled:  Boolean,
            label:     Boolean,
        },

        data() {
            if (this.eventType === 'special') {
                return {
                    types: [{
                        id:   'opt-in',
                        name: 'In',
                        icon: this.$icons.optIn,
                    }, {
                        id:   'opt-out',
                        name: 'Out',
                        icon: this.$icons.optOut,
                    }],
                };
            }

            return {
                types: [{
                    id:   'omnivorous',
                    name: 'Omni',
                    icon: this.$icons.omnivorous,
                }, {
                    id:   'vegetarian',
                    name: 'Vegi',
                    icon: this.$icons.vegetarian,
                }, {
                    id:   'opt-out',
                    name: 'Out',
                    icon: this.$icons.optOut,
                }, {
                    id:   'undecided',
                    name: 'Undecided',
                    icon: this.$icons.undecided,
                }],
            };
        },

        methods: {
            update(value) {
                this.$emit('input', value);
            },

            displayName(value) {
                return this.types.find(type => type.id === value)?.name;
            },
        },
    };
</script>

<style lang="scss" scoped>
    .v-label {
        // Default label size is 16px, and 0.75 is the scaling factor for when it minifies
        font-size: 16px * 0.75;
    }
</style>
