<template>
    <v-main>
        <v-container>
            <img src="/img/login.svg" alt="Application logo">

            <v-form v-model="formValid" :disabled="isBusy" @submit.prevent="login">
                <v-text-field v-model="username" type="text" required
                              :rules="requiredRule" autofocus label="Username"
                              :prepend-icon="$icons.account"
                />
                <v-text-field v-model="password" type="password" required
                              :rules="requiredRule" label="Password"
                              :prepend-icon="$icons.password"
                />

                <v-btn type="submit" :disabled="!formValid || isBusy" color="primary" block>
                    Login
                </v-btn>

                <div v-if="isBusy" class="text-center">
                    <v-progress-circular class="mt-4" indeterminate/>
                </div>
            </v-form>
        </v-container>
    </v-main>
</template>

<script>
    export default {
        name: 'Login',

        data() {
            return {
                formValid:    false,
                isBusy:       false,
                username:     '',
                password:     '',
                requiredRule: [
                    v => !!v,
                ],
            };
        },

        computed: {
            appTitle() {
                return process.env.VUE_APP_BRANDING_TITLE;
            },
        },

        methods: {
            async login() {
                this.isBusy = true;
                try {
                    await this.$store.dispatch('login', {username: this.username, password: this.password});
                } catch (err) {
                    // Only release on error, not on success
                    this.isBusy = false;
                    throw err;
                }
            },
        },
    };
</script>

<style lang="scss" scoped>
    .v-form {
        max-width: 30em;
        margin: 0 auto;
    }

    h1 {
        text-align: center;
    }

    img {
        width: 33%;
        max-width: 250px;
        display: block;
        margin: 50px auto;
    }
</style>
