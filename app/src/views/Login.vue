<template>
    <v-main>
        <v-container>
            <img src="/img/logo-large.svg" alt="Andeo Lunch logo">

            <v-form v-model="formValid" :disabled="isBusy" @submit.prevent="login">
                <v-text-field v-model="username" type="text" required
                              :rules="requiredRule" autofocus label="Username"
                              :append-icon="$icons.account"
                />
                <v-text-field v-model="password" type="password" required
                              :rules="requiredRule" label="Password"
                              :append-icon="$icons.password"
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
                    value => !!value || 'This field is required',
                ],
            };
        },

        methods: {
            async login() {
                this.isBusy = true;
                try {
                    await this.$store().login({username: this.username, password: this.password});
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
        width: 50%;
        max-width: 250px;
        display: block;
        margin: 50px auto;
    }
</style>
