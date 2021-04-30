<template>
    <v-card>
        <v-form v-model="valid" :disabled="saving" @submit.prevent="save()" ref="form">
            <v-card-title v-if="type === 'lunch'">
                New lunch
            </v-card-title>
            <v-card-title v-else-if="type === 'label'">
                New label
            </v-card-title>
            <v-card-title v-else>
                New event
            </v-card-title>

            <v-card-text>
                <v-text-field label="Name" v-model="name" :rules="nameRules" autofocus required/>

                <v-row>
                    <v-col>
                        <lm-date-picker v-model="date" required/>
                    </v-col>
                    <v-col v-if="type !== 'label'">
                        <points-field label="Points credited" v-model="points"/>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions>
                <v-btn text @click="cancel()">Cancel</v-btn>
                <v-spacer></v-spacer>
                <v-btn text color="primary" type="submit">Save</v-btn>
            </v-card-actions>
        </v-form>
    </v-card>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar';
    import LmDatePicker from '@/components/LmDatePicker';
    import PointsField from '@/components/PointsField';
    import * as DateUtils from '@/utils/dateUtils';

    export default {
        name: 'EventEdit',

        components: {
            TheAppBar,
            LmDatePicker,
            PointsField,
        },

        props: {
            event: {
                type:     Object,
            },
        },

        data() {
            return {
                type:   this.event?.type,
                name:   this.event?.name,
                date:   this.event?.date ? DateUtils.isoDate(this.event.date) : null,
                points: this.event?.costs?.points,

                nameRules: [
                    v => !!v || 'A name is required',
                ],

                saving: false,
                valid:  false,
            };
        },

        methods: {
            reset() {
                Object.assign(this.$data, this.$options.data.apply(this));
            },

            cancel() {
                this.$emit('close');
            },

            async save() {
                // For reasons I don't understand using <v-form v-model="valid"> will not work correctly.  The form
                // will randomly be considered invalid when it's not.
                if (!this.$refs.form.validate()) {
                    return;
                }
                try {
                    this.saving = true;
                    let data = {
                        name: this.name,
                        date: this.date,
                    };
                    if (this.event?.id) {
                        data.id = this.event?.id;
                    }else {
                        data.type = this.type;
                    }
                    if (this.type !== 'label') {
                        data.costs = {
                            points: this.points,
                        };
                        data.factors = {
                            vegetarian: {
                                money: 1,
                            },
                        };
                    }
                    await this.$store.dispatch('saveEvent', data);
                    this.$emit('close');
                } finally {
                    this.saving = false;
                }
            },
        },
    };
</script>
