<template>
    <div>
        <v-card flat>
            <v-card-subtitle class="center-text">{{subtitle}}</v-card-subtitle>
            <h2 class="center-text">{{menu.name}}</h2>
            <v-row class="justify-center">
                <participants class="justify-center" :participants="menu.participants"/>
                <span class="cost">CHF 126</span>
            </v-row>

            <v-container>
                <v-row dense>
                    <v-col cols="10">Total Helper Points</v-col>
                    <v-col cols="2"><v-text-field type="number"></v-text-field></v-col>
                </v-row>

                <v-row class="gray" dense v-for="helper in menu.helpers" :key="helper.firstName + helper.lastName">
                    <v-col cols="8">{{helper.firstName}} {{helper.lastName}}</v-col>
                    <v-col cols="2"><v-btn color="error" icon><v-icon color="error">mdi-delete</v-icon></v-btn></v-col>
                    <v-col cols="2"><v-text-field type="number"></v-text-field></v-col>
                </v-row>
            </v-container>
        </v-card>
    </div>
</template>

<script>
    import Participants from "../components/menus/participants";

    export default {
        name: "MenuDetail",
        components: {Participants},
        data() {
            let id = parseInt(this.$route.params.id, 10);
            return {
                menu: this.$store.getters.getMenuById(id),
            }
        },
        computed: {
            subtitle() {
                if (this.menu) {
                    return this.menu.weekday.substr(0, 2) + ' - ' + this.menu.date;
                }
                return "";
            }
        },
        mounted() {

        }
    }
</script>

<style lang="scss" scoped>
    .cost {
        margin-left: 30px;
        color: #C62828;
        font-size: 28pt;
    }
</style>
