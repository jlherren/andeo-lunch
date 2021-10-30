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

            <p class="text-body-2">
                To read the full terms of the GNU General Public License
                see <a href="https://www.gnu.org/licenses/">www.gnu.org/licenses/</a>.
            </p>

            <p class="text-body-2">
                Useful links:
            </p>

            <ul class="text-body-2">
                <li><a href="https://github.com/jlherren/andeo-lunch" target="_blank">github.com/jlherren/andeo-lunch</a></li>
                <li><a href="https://github.com/jlherren/andeo-lunch/issues/new" target="_blank">Report a bug</a></li>
            </ul>
        </v-container>
    </v-main>
</template>

<script>
    import TheAppBar from '../../components/TheAppBar';
    import {mapGetters} from 'vuex';

    export default {
        components: {
            TheAppBar,
        },

        computed: {
            ...mapGetters([
                'ownUser',
                'version',
            ]),

            appTitle() {
                return process.env.VUE_APP_BRANDING_TITLE;
            },
        },
    };
</script>
