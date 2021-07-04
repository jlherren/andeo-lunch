<template>
    <v-btn-toggle :value="value" @change="update($event)" :dense="$vuetify.breakpoint.xs" mandatory>
        <v-btn value="omnivorous" :disabled="disabled">
            <v-icon :large="$vuetify.breakpoint.mdAndUp" left>{{ $icons.omnivorous }}</v-icon>
            <span>Omni</span>
        </v-btn>
        <v-btn value="vegetarian" :disabled="disabled">
            <v-icon :large="$vuetify.breakpoint.mdAndUp" left>{{ $icons.vegetarian }}</v-icon>
            <span>Vegi</span>
        </v-btn>
        <v-btn value="opt-out" :disabled="disabled">
            <v-icon :large="$vuetify.breakpoint.mdAndUp" left>{{ $icons.optOut }}</v-icon>
            <span>Out</span>
        </v-btn>
        <v-btn value="undecided" :disabled="disabled">
            <v-icon :large="$vuetify.breakpoint.mdAndUp" left>{{ $icons.undecided }}</v-icon>
            <span>Undecided</span>
        </v-btn>
    </v-btn-toggle>
</template>

<script>
    export default {
        name: 'ParticipationTypeWidget',

        props: {
            value: {
                type:     String,
                required: true,
            },
            disabled: {
                type:    Boolean,
                default: false,
            },
        },

        methods: {
            update(value) {
                this.$emit('input', value);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .v-btn-toggle {
        display: flex;
        width: 100%;

        .v-btn {
            flex: 1 1 auto;
        }
    }
</style>
