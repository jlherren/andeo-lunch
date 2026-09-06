<template>
    <v-dialog v-model="open" width="290px">
        <template #activator="{ on, attrs }">
            <v-text-field v-bind="attrs" v-on="on" :append-icon="icons.clock"
                          :label="label" :rules="rules" :value="modelValue" readonly
            />
        </template>
        <v-time-picker :value="modelValue" @input="update" @click:minute="open = false" format="24hr"/>
    </v-dialog>
</template>

<script>
    import {icons} from '@/plugins/icons';

    export default {
        setup() {
            return {icons};
        },

        name: 'AlTimePicker',

        model: {
            prop:  'modelValue',
            event: 'update:modelValue',
        },

        emits: ['update:modelValue'],

        props: {
            modelValue: String,
            label:      {
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
                this.$emit('update:modelValue', value);
            },
        },
    };
</script>
