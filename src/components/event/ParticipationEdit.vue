<template>
    <v-card>
        <v-card-title>
            Edit participation
        </v-card-title>

        <v-card-text>
            <v-row>
                <v-col>
                    <v-btn-toggle v-model="type" mandatory dense>
                        <v-btn value="omnivorous">
                            <v-icon left>mdi-hamburger</v-icon>
                            <span>Omni</span>
                        </v-btn>
                        <v-btn value="vegetarian">
                            <v-icon left>mdi-apple</v-icon>
                            <span>Vegi</span>
                        </v-btn>
                        <v-btn value="opt-out">
                            <v-icon left>mdi-cancel</v-icon>
                            <span>Opt-out</span>
                        </v-btn>
                        <v-btn value="undecided">
                            <v-icon left>mdi-help-circle</v-icon>
                            <span>Undecided</span>
                        </v-btn>
                    </v-btn-toggle>
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="6">
                    <points-field label="Points credited" v-model="points"/>
                </v-col>
                <v-col cols="6">
                    <v-text-field type="number" label="Money credited" v-model="money"/>
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
    import PointsField from '@/components/PointsField';

    export default {
        name: 'ParticipationEdit',

        components: {
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
