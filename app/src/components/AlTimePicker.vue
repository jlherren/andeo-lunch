<template>
    <v-dialog v-model="open" width="290px">
        <template #activator="{ on, attrs }">
            <v-text-field v-bind="attrs" v-on="on" :append-icon="$icons.clock"
                          :label="label" :rules="rules" :value="value" readonly
            />
        </template>
        <v-time-picker :value="value" @input="update" @click:minute="open = false" format="24hr"/>
    </v-dialog>
</template>

<script>
    export default {
        name: 'AlTimePicker',

        props: {
            value:    String,
            label:    {
                type:    String,
                default: 'Time',
            },
            required: {
                type:    Boolean,
                default: false,
            },
        },

        data() {
            return {
                open:  false,
                rules: [
                    value => !this.required || !!value || 'A time is required',
                ],
            };
        },

        methods: {
            update(value) {
                // this.open = false;
                this.$emit('input', value);
            },
        },
    };
</script>
