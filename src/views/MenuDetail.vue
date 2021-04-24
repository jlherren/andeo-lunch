<template>
    <v-main>
        <lm-app-bar>{{ menu.name }}</lm-app-bar>

        <v-card-subtitle class="center-text">{{ subtitle }}</v-card-subtitle>

        <h2 class="center-text">{{ menu.name }}</h2>

        <div class="center-text participants-and-cost">
            <participants class="justify-center" :participants="menu.participants"/>
            <span class="cost">CHF 126</span>
        </div>

        <v-container>
            <v-row dense>
                <v-col cols="10">Total Helper Points</v-col>
                <v-col cols="2">
                    <v-text-field type="number"></v-text-field>
                </v-col>
            </v-row>

            <v-row class="gray" dense v-for="helper in menu.helpers" :key="helper.firstName + helper.lastName">
                <v-col cols="8">{{ helper.firstName }} {{ helper.lastName }}</v-col>
                <v-col cols="2">
                    <v-btn color="error" icon>
                        <v-icon color="error">mdi-delete</v-icon>
                    </v-btn>
                </v-col>
                <v-col cols="2">
                    <v-text-field type="number"></v-text-field>
                </v-col>
            </v-row>
        </v-container>
    </v-main>
</template>

<script>
    import Participants from '../components/menus/participants';
    import LmAppBar from '@/components/lmAppBar';

    export default {
        name: 'MenuDetail',
        components: {LmAppBar, Participants},

        data() {
            let id = parseInt(this.$route.params.id, 10);
            return {
                menu: this.$store.getters.menuById(id),
            };
        },

        computed: {
            subtitle() {
                if (this.menu) {
                    return this.menu.weekday.substr(0, 2) + ' - ' + this.menu.date;
                }
                return '';
            },
        },
    };
</script>

<style lang="scss" scoped>
    .cost {
        margin-left: 30px;
        color: #C62828;
        font-size: 28pt;
    }

    .participants-and-cost {
        text-align: center;
    }
</style>
