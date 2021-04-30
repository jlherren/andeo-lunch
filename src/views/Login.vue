<template>
    <v-main>
        <v-app-bar app>
            <v-toolbar-title>
                Lunch Money
            </v-toolbar-title>
        </v-app-bar>

        <v-container>
            <v-form @submit.prevent="login" v-model="formValid" :disabled="isBusy">
                <h1>Login</h1>

                <v-text-field type="text" label="Username" v-model="username" :rules="requiredRule" autofocus required/>
                <v-text-field type="password" label="Password" v-model="password" :rules="requiredRule" required/>

                <v-btn block color="primary" type="submit" :disabled="!formValid || isBusy">
                    Login
                </v-btn>

                <div class="text-center" v-if="isBusy">
                    <v-progress-circular indeterminate class="mt-4"/>
                </div>
            </v-form>
        </v-container>
    </v-main>
</template>

<script>
    export default {
        name: 'Login',
        data: () => ({
            formValid: false,
            isBusy: false,
            username: '',
            password: '',
            requiredRule: [
                v => !!v,
            ],
        }),

        methods: {
            async login() {
                this.isBusy = true;
                try {
                    await this.$store.dispatch('login', {username: this.username, password: this.password});
                } finally {
                    this.isBusy = false;
                }
            },
        },
    };
</script>

<style scoped lang="scss">
    .v-form {
        max-width: 30em;
        margin: 0 auto;
    }
</style>
