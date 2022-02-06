<template>
    <v-card>
        <v-form :disabled="isBusy" @submit.prevent="save()" ref="form">
            <v-card-title>
                Edit participation
            </v-card-title>

            <v-card-text>
                <v-select v-model="user" label="User" :disabled="!!this.participation"
                          :items="eligibleUsers" item-text="name" item-value="id"
                          :rules="userRules"
                          :append-icon="$icons.account"/>

                <v-row>
                    <v-col>
                        <participation-type-widget v-model="type" :disabled="isBusy" label :event-type="event.type"/>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col cols="6">
                        <number-field v-model="pointsCredited" label="Points credited" :icon="$icons.points"/>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field v-model="moneyCredited" type="number" min="0"
                                      label="Money credited" :append-icon="$icons.money"/>
                        <number-field v-model="moneyFactor" min="0" step="5" v-if="event.type === 'special'"
                                      label="Money factor" suffix="%" :icon="$icons.money"/>
                    </v-col>
                </v-row>

                <!-- Button is to make it submittable by pressing enter -->
                <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
            </v-card-text>

            <v-card-actions>
                <v-btn text :disabled="isBusy" @click="cancel">
                    Cancel
                </v-btn>
                <v-spacer></v-spacer>
                <v-progress-circular v-if="isBusy" indeterminate size="20" width="2"/>
                <v-btn color="primary" :disabled="isBusy" @click="save">
                    Save
                </v-btn>
            </v-card-actions>
        </v-form>
    </v-card>
</template>

<script>
    import NumberField from '@/components/NumberField';
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
            participation: Object,
        },

        data() {
            let defaultType = this.event.type === 'special' ? 'opt-out' : 'undecided';
            return {
                user:           this.participation?.userId,
                pointsCredited: this.participation?.credits?.points ?? 0,
                moneyCredited:  this.participation?.credits?.money ?? 0,
                moneyFactor:    (this.participation?.factors?.money ?? 1) * 100,
                type:           this.participation?.type ?? defaultType,
                isBusy:         false,
                userRules:      [
                    user => !!user,
                ],
            };
        },

        created() {
            if (this.participation) {
                this.$store.dispatch('fetchUser', {userId: this.participation.userId});
            } else {
                this.$store.dispatch('fetchUsers');
                // Existing participations need to be refreshed for eligibleUsers to be correct
                this.$store.dispatch('fetchParticipations', {eventId: this.event.id});
            }
        },

        computed: {
            eligibleUsers() {
                if (this.participation) {
                    // Don't bother listing all users, since the dropdown is disabled anyway
                    return [
                        this.$store.getters.user(this.participation.userId),
                    ];
                }
                let passiveType = this.event.type === 'special' ? 'opt-out' : 'undecided';
                let substantialExistingParticipationUserIds = this.$store.getters.participations(this.event.id)
                    .filter(p => p.type !== passiveType || p.credits.points > 0 || p.credits.money > 0)
                    .map(p => p.userId);
                return this.$store.getters.users
                    .filter(u => !substantialExistingParticipationUserIds.includes(u.id));
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
                if (!this.$refs.form.validate()) {
                    return;
                }
                this.isBusy = true;
                try {
                    await this.$store.dispatch('saveParticipation', {
                        userId:  this.user,
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
