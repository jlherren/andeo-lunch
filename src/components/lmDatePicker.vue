<template>
    <v-dialog v-model="open" width="290px">
        <template v-slot:activator="{ on, attr : attrs }">
            <v-text-field :label="label" :value="formatted" append-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"/>
        </template>
        <v-date-picker :value="value" @input="update($event)" first-day-of-week="1"/>
    </v-dialog>
</template>

<script>
    export default {
        name: 'LmDatePicker',

        props: {
            value: String,
            label: String,
        },

        computed: {
            formatted() {
                return new Date(this.value).toDateString();
            },
        },

        data() {
            return {
                open: false,
            };
        },

        methods: {
            update(value) {
                this.open = false;
                this.$emit('input', value);
            }
        }
    };
</script>
