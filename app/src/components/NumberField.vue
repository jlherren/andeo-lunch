<template>
    <v-text-field type="number" :min="min" :max="max" :step="step" :label="label" :value="value"
                  @input="input($event)" class="no-spinner" :disabled="disabled" :suffix="suffix">
        <template v-slot:append>
            <v-btn small icon @click="addPoints(-step)" :disabled="min !== undefined && value <= min">
                <v-icon small>{{ $icons.minus }}</v-icon>
            </v-btn>
            <v-btn small icon @click="addPoints(step)" :disabled="max !== undefined && value >= max">
                <v-icon small>{{ $icons.plus }}</v-icon>
            </v-btn>
            <v-icon>{{ icon }}</v-icon>
        </template>
    </v-text-field>
</template>

<script>
    export default {
        name: 'NumberField',

        props: {
            value: {
                type:     Number,
                required: false,
            },

            disabled: {
                type:    Boolean,
                default: false,
            },

            min: {
                type:    Number,
                default: 0,
            },

            max: {
                type:    Number,
                default: undefined,
            },

            step: {
                type:    Number,
                default: 1,
            },

            label: {
                type: String,
            },

            suffix: {
                type: String,
            },

            icon: {
                type: String,
            },
        },

        methods: {
            validate(value) {
                return parseFloat(`${value}`) || 0;
            },

            addPoints(increment) {
                let value = this.validate(this.value);
                value += increment;
                if (value < this.min) {
                    value = this.min;
                } else if (value > this.max) {
                    value = this.max;
                }
                this.$emit('input', value);
            },

            input(value) {
                this.$emit('input', this.validate(value));
            },
        },
    };
</script>
