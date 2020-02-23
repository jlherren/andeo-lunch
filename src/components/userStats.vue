<template>
    <v-container>
        <v-row no-gutters>
            <v-col cols="6">
                <div class="center-text">Points</div>
                <div :class="getValueClass(this.points)">{{ points }}</div>
            </v-col>
            <v-col cols="6">
                <div class="center-text">Money</div>
                <div :class="getValueClass(this.money)">{{ money }}</div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import {mapGetters} from 'vuex';

    export default {
        name: "userStats",
        computed: {
            ...mapGetters({
                points: 'getPoints',
                money: 'getMoney'
            })
        },
        methods: {
            getValueClass(value) {
                let classString = 'center-text ';
                classString += value > 0 ? 'positiveValue' : 'negativeValue';
                return classString;
            }
        }
    }
</script>

<style scoped lang="scss">
    $value-text-size: 16pt;

    .positiveValue {
        color: #43A047;
        font-size: $value-text-size;
    }

    .negativeValue {
        color: #C62828;
        font-size: $value-text-size;
    }
</style>