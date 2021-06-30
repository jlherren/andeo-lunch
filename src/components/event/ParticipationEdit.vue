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
                    <points-field v-model="points" label="Points credited" :disabled="isBusy"/>
                </v-col>
                <v-col cols="6">
                    <v-text-field v-model="money" type="number" min="0" label="Money credited" :disabled="isBusy"/>
                </v-col>
            </v-row>
        </v-card-text>

        <v-card-actions>
            <v-btn text @click="cancel">
                Cancel
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="save">
                Save
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
    import ParticipationTypeWidget from '@/components/event/ParticipationTypeWidget';
    import PointsField from '@/components/PointsField';

    export default {
        name: 'ParticipationEdit',

        components: {
            ParticipationTypeWidget,
            PointsField,
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
