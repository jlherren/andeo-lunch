<template>
    <v-text-field
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :label="label"
        :value="value"
        @input="input"
        class="no-spinner"
        :disabled="isDisabled"
        :suffix="suffix"
        :hint="hint"
        :persistent-hint="hint !== null"
    >
        <template #append>
            <v-btn small icon @click="addPoints(-step)" :disabled="isDisabled || min !== undefined && value <= min">
                <v-icon small>{{ $icons.minus }}</v-icon>
            </v-btn>
            <v-btn small icon @click="addPoints(step)" :disabled="isDisabled || max !== undefined && value >= max">
                <v-icon small>{{ $icons.plus }}</v-icon>
            </v-btn>
            <v-icon>{{ icon }}</v-icon>
        </template>
    </v-text-field>
</template>

<script>
    export default {
        name: 'NumberField',

        inject: [
            'form',
        ],

        props: {
            value:    Number,
            disabled: Boolean,
            min:      {
                type:    Number,
                default: 0,
            },
            max:      {
                type:    Number,
                default: undefined,
            },
            step:     {
                type:    Number,
                default: 1,
            },
            label:    String,
            suffix:   String,
            icon:     String,
            hint:     String,
        },

        computed: {
            isDisabled() {
                return this.disabled || this.form?.disabled;
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
