<template>
    <v-card>
        <v-card-title>
            Edit participation
        </v-card-title>

        <v-card-text>
            <v-select label="Participation type" :items="participationTypes" v-model="type"/>

            <v-row>
                <v-col cols="6">
                    <points-field label="Points credited" v-model="points"/>
                </v-col>
                <v-col cols="6">
                    <v-text-field type="number" label="Money spent" v-model="money"/>
                </v-col>
            </v-row>

        </v-card-text>

        <v-divider></v-divider>

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
    import PointsField from '@/components/pointsField';

    export default {
        name: 'ParticipationEdit',

        components: {
            PointsField,
        },

        props: {
            participation: Object,
        },

        data() {
            return {
                participationTypes: [
                    {value: 'omnivorous', text: 'Omnivorous'},
                    {value: 'vegetarian', text: 'Vegetarian'},
                    {value: 'opt-out', text: 'Opt-out'},
                    {value: 'undecided', text: 'Undecided'},
                ],

                points: this.participation.credits.points,
                money:  this.participation.credits.money,
                type:   this.participation.type,
            };
        },

        methods: {
            reset() {
                Object.assign(this.$data, this.$options.data.apply(this))
            },

            addPoints(increment) {
                let points = parseInt(this.points) || 0;
                points += increment;
                if (points < 0) {
                    points = 0;
                }
                this.points = points;
            },

            cancel() {
                this.$emit('close');
            },

            async save() {
                await this.$store.dispatch('saveParticipation', {
                    userId:   this.participation.userId,
                    eventId:  this.participation.eventId,
                    type:     this.type,
                    credits:  {
                        points: this.points,
                        money: this.money,
                    },
                });

                this.$emit('close');
            },
        },
    };
</script>
