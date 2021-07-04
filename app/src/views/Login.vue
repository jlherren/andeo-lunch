<template>
    <v-main>
        <v-app-bar app>
            <v-toolbar-title>
                {{ appTitle }}
            </v-toolbar-title>
        </v-app-bar>

        <v-container>
            <v-form v-model="formValid" :disabled="isBusy" @submit.prevent="login">
                <h1>Login</h1>

                <v-text-field v-model="username" type="text" :rules="requiredRule" autofocus label="Username" required/>
                <v-text-field v-model="password" type="password" :rules="requiredRule" label="Password" required/>

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
</style>
