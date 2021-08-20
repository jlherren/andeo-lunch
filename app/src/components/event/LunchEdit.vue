<template>
    <v-card>
        <v-form :disabled="isBusy" @submit.prevent="save()" ref="form">
            <v-card-title>{{ title }}</v-card-title>

            <v-card-text>
                <v-row>
                    <v-col>
                        <v-text-field v-model="name" :rules="nameRules" label="Name" autofocus required
                                      :append-icon="$icons.label"
                        />
                    </v-col>
                    <v-col>
                        <lm-date-picker v-model="date" required/>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col v-if="type !== 'label'">
                        <number-field v-model="points" label="Points" :min="0" :icon="$icons.points"/>
                    </v-col>
                    <v-col>
                        <number-field v-model="vegetarianFactor" label="Vegetarian factor" suffix="%"
                                      :min="0" :max="100" :step="5"/>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions>
                <v-btn text :disabled="isBusy" @click="cancel()">Cancel</v-btn>
                <v-spacer></v-spacer>
                <v-progress-circular v-if="isBusy" indeterminate size="20" width="2"/>
                <v-btn type="submit" :disabled="isBusy" color="primary">Save</v-btn>
            </v-card-actions>
        </v-form>
    </v-card>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import LmDatePicker from '@/components/LmDatePicker';
    import NumberField from '@/components/NumberField';

    export default {
        name: 'LunchEdit',

        components: {
            LmDatePicker,
            NumberField,
        },

        props: {
            event: Object,
        },

        data() {
            return {
                type:   this.event?.type,
                name:   this.event?.name,
                date:   this.event?.date ? DateUtils.isoDate(this.event.date) : null,
                points: this.event?.costs?.points,

                /* eslint-disable-next-line no-extra-parens */
                vegetarianFactor: (this.event?.factors?.vegetarian?.money ?? 0.5) * 100,

                nameRules: [
                    v => !!v || 'A name is required',
                ],

                isBusy: false,
            };
        },

        computed: {
            title() {
                return `${this.titlePrefix} ${this.eventTypeName}`;
            },

            titlePrefix() {
                return this.event?.id ? 'Edit' : 'New';
            },

            eventTypeName() {
                switch (this.event.type) {
                    case 'special':
                        return 'special event';

                    default:
                        // The rest of internal type names happen to coincide with english words
                        return this.event.type;
                }
            },
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
                    this.isBusy = true;
                    let data = {
                        name: this.name,
                        date: this.date,
                    };
                    if (this.event?.id) {
                        data.id = this.event?.id;
                    } else {
                        data.type = this.type;
                    }
                    if (this.type !== 'label') {
                        data.costs = {
                            points: this.points,
                        };
                        data.factors = {
                            vegetarian: {
                                money: this.vegetarianFactor / 100,
                            },
                        };
                    }
                    await this.$store.dispatch('saveEvent', data);
                    this.$emit('close');
                } catch (err) {
                    // Disabled flag is only released on errors, otherwise we risk double saving after the first
                    // one is successful and the modal is closing.
                    this.isBusy = false;
                    throw err;
                }
            },
        },
    };
</script>
