<template>
    <v-card>
        <v-form :disabled="isBusy || readonly" @submit.prevent="save()" ref="form">
            <v-card-title>
                {{ readonly ? 'View' : 'Edit' }} participation for {{ userName() }}
            </v-card-title>

            <v-card-text>
                <v-row>
                    <v-col>
                        <participation-type-widget v-model="type" :disabled="isBusy || readonly" label :event-type="event.type"/>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col cols="6">
                        <number-field v-model="pointsCredited" label="Points credited" :icon="$icons.points"/>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field v-model="moneyCredited" type="number" min="0"
                                      label="Money credited" :append-icon="$icons.money"/>
                        <number-field v-model="moneyFactor" :min="0" :step="5" v-if="event.type === 'special'"
                                      label="Money factor" suffix="%" :icon="$icons.money" :disabled="type === 'opt-out'"/>
                    </v-col>
                </v-row>

                <v-radio-group v-if="isSus"
                               label="This event is either in the past or the groceries for it have already been bought. Please Specify the reason for this late participation change:"
                               :rules="susRules"
                >
                    <v-radio label="I have discussed this with the cooks and they're okay with it" value="okay"/>
                    <v-radio label="Higher power prevents me from participating" value="notMyFault"/>
                    <v-radio label="I'm a dishonorable bastard" value="bastard"/>
                </v-radio-group>

                <!-- Button is to make it submittable by pressing enter -->
                <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
            </v-card-text>

            <v-card-actions>
                <v-btn text :disabled="isBusy" @click="cancel">
                    Cancel
                </v-btn>
                <v-spacer></v-spacer>
                <v-progress-circular v-if="isBusy" indeterminate size="20" width="2"/>
                <v-btn color="primary" :disabled="isBusy || readonly" @click="save">
                    Save
                </v-btn>
            </v-card-actions>
        </v-form>
    </v-card>
</template>

<script>
    import * as DateUtils from '../../utils/dateUtils.js';
    import NumberField from '@/components/NumberField';
    import {OPT_IN_PARTICIPATIONS} from '@/utils/participationUtils';
    import ParticipationTypeWidget from '@/components/event/ParticipationTypeWidget';

    export default {
        name: 'ParticipationEdit',

        components: {
            NumberField,
            ParticipationTypeWidget,
        },

        props: {
            event:         {
                type:     Object,
                required: true,
            },
            participation: {
                type:     Object,
                required: true,
            },
            readonly:      Boolean,
        },

        data() {
            let defaultType = this.event.type === 'special' ? 'opt-out' : 'undecided';

            // Check if groceries are likely already done for this event
            let cutoff = DateUtils.previousMonday(this.event.date);
            cutoff.setHours(10, 0, 0);
            let groceriesDone = this.event.type === 'lunch' && cutoff.getTime() < Date.now();

            return {
                pointsCredited: this.participation.credits?.points ?? 0,
                moneyCredited:  this.participation.credits?.money ?? 0,
                moneyFactor:    (this.participation.factors?.money ?? 1) * 100,
                type:           this.participation.type ?? defaultType,
                previousType:   this.participation.type ?? defaultType,
                isBusy:         true,
                groceriesDone,
                susRules:       [
                    value => !!value,
                ],
            };
        },

        async created() {
            await this.$store().fetchUser(this.participation.userId);
            this.isBusy = false;
        },

        computed: {
            isSus() {
                return this.groceriesDone
                    && this.$store().ownUserId === this.participation.userId
                    && OPT_IN_PARTICIPATIONS.includes(this.previousType) !== OPT_IN_PARTICIPATIONS.includes(this.type);
            },
        },

        methods: {
            userName() {
                return this.$store().user(this.participation.userId)?.name;
            },

            cancel() {
                this.$emit('close');
            },

            async save() {
                if (this.readonly || !this.$refs.form.validate()) {
                    return;
                }
                this.isBusy = true;
                try {
                    await this.$store().saveParticipation({
                        userId:  this.participation.userId,
                        eventId: this.event.id,
                        type:    this.type,
                        credits: {
                            points: this.pointsCredited,
                            money:  this.moneyCredited,
                        },
                        factors: {
                            money: this.moneyFactor / 100,
                        },
                    });
                    this.$emit('saved');
                    this.$emit('close');
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
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
