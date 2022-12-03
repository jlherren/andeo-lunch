<template>
    <v-main>
        <the-app-bar>
            About
        </the-app-bar>

        <v-container>
            <h1 class="text-h5 mb-4">
                About {{ appTitle }}
            </h1>

            <p class="text-body-2">
                App version: {{ version }}<br>
            </p>

            <p class="text-body-2">
                This program is free software: you can redistribute it and/or modify
                it under the terms of the GNU General Public License as published by
                the Free Software Foundation, either version 3 of the License, or
                (at your option) any later version.
            </p>

            <p class="text-body-2">
                This program is distributed in the hope that it will be useful,
                but WITHOUT ANY WARRANTY; without even the implied warranty of
                MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
                GNU General Public License for more details.
            </p>

            <div class="buttons mt-8">
                <v-btn href="https://www.gnu.org/licenses/" color="primary" block target="_blank" class="my-2">
                    Read the full terms
                </v-btn>

                <v-btn href="https://github.com/jlherren/andeo-lunch" color="primary" block target="_blank" class="my-2">
                    Source / contribute
                </v-btn>

                <v-btn href="https://github.com/jlherren/andeo-lunch/issues/new" color="primary" block target="_blank" class="my-2">
                    Report a bug
                </v-btn>
            </div>
        </v-container>
    </v-main>
</template>

<script>
    import TheAppBar from '../../components/TheAppBar';
    import {mapState} from 'pinia';
    import {useStore} from '@/store';

    export default {
        components: {
            TheAppBar,
        },

        computed: {
            ...mapState(useStore, [
                'ownUser',
                'version',
            ]),

            appTitle() {
                return process.env.VUE_APP_BRANDING_TITLE;
            },
        },
    };
</script>

<style lang="scss" scoped>
    .buttons {
        margin: 0 auto;
        max-width: 400px;
    }
</style>
