<template>
    <v-main>
        <the-app-bar sub-page>
            ICS link creator
        </the-app-bar>

        <v-container>
            <p class="text-body-1">Create an ICS link to import into other applications.</p>

            <v-checkbox v-model="all" @change="update"
                        label="Also include events I don't participate in"
            />
            <v-checkbox v-model="alarm" @change="update"
                        label="Enable reminder for when I cook"
            />

            <v-text-field :value="link" readonly ref="link"/>

            <v-btn block :disabled="link === ''" @click="copy">
                {{ copied ? 'Copied!' : 'Copy to clipboard' }}
            </v-btn>
        </v-container>
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar.vue';

    export default {
        name: 'IcsCreator',

        components: {
            TheAppBar,
        },

        data() {
            return {
                all:    false,
                alarm:  false,
                link:   '',
                copied: false,
            };
        },

        created() {
            this.update();
        },

        methods: {
            async update() {
                this.link = '';
                let link = await this.$store().icsLink({
                    all:   this.all,
                    alarm: this.alarm,
                });
                this.link = process.env.VUE_APP_BACKEND_URL + link;
            },

            copy() {
                if (this.link !== '') {
                    this.$refs.link.$refs.input.select();
                    document.execCommand('copy');
                    this.copied = true;
                    setTimeout(() => {
                        this.copied = false;
                    }, 500);
                }
            },
        },
    };
</script>
