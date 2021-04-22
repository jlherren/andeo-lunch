<template>
    <v-form @submit="login" v-model="valid">
        <v-text-field type="text" label="Username" v-model="username" :rules="requiredRule" required />
        <v-text-field type="password" label="Password" v-model="password" :rules="requiredRule" required />
        <v-btn block color="primary" type="submit" :disabled="!valid" @click="login">Login</v-btn>
    </v-form>
</template>

<script>
    export default {
        name:    'Login',
        data:    () => ({
            valid:        false,
            username:     '',
            password:     '',
            requiredRule: [
                v => !!v,
            ],
        }),
        methods: {
            login() {
                // TODO
            },
        },
    };
</script>

<style scoped>

</style>
