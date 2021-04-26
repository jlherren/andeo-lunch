<template>
    <v-text-field type="number" label="Points credited" :value="value" @input="input($event)" class="no-spinner">
        <template v-slot:append>
            <v-btn small icon @click="addPoints(-1)" :disabled="value <= 0">
                <v-icon small>mdi-minus</v-icon>
            </v-btn>
            <v-btn small icon @click="addPoints(1)">
                <v-icon small>mdi-plus</v-icon>
            </v-btn>
        </template>
    </v-text-field>
</template>

<script>
    export default {
        name: 'PointsField',

        props: {
            value: Number,
        },

        methods: {
            validate(value) {
                return parseInt('' + value) || 0;
            },

            addPoints(increment) {
                let value = this.validate(this.value);
                value += increment;
                if (value < 0) {
                    value = 0;
                }
                this.$emit('input', value);
            },

            input(value) {
                this.$emit('input', this.validate(value));
            },
        },
    };
</script>
