<template>
    <v-card>
        <v-card-title>
            Edit participation
        </v-card-title>

        <v-card-text>
            <v-row>
                <v-col>
                    <participation-type-widget v-model="type" :disabled="isBusy"/>
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="6">
                    <number-field v-model="points" label="Points credited" :disabled="isBusy" :icon="$icons.points"/>
                </v-col>
                <v-col cols="6">
                    <v-text-field v-model="money" type="number" min="0" label="Money credited" :disabled="isBusy" :append-icon="$icons.money"/>
                </v-col>
            </v-row>
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
            participation: {
                type:     Object,
                required: true,
            },
        },

        data() {
            return {
                points: this.participation.credits.points,
                money:  this.participation.credits.money,
                type:   this.participation.type,
                isBusy: false,
            };
        },

        computed: {
            mdAndUp() {
                return this.$vuetify.breakpoint.mdAndUp;
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
                this.isBusy = true;
                try {
                    await this.$store.dispatch('saveParticipation', {
                        userId:  this.participation.userId,
                        eventId: this.participation.eventId,
                        type:    this.type,
                        credits: {
                            points: this.points,
                            money:  this.money,
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
