<template>
    <v-progress-linear v-if="show" absolute indeterminate/>
</template>

<script>
    export default {
        name: 'ShyProgress',

        data() {
            return {
                show: false,
            };
        },

        computed: {
            showLoading() {
                return this.loading;
            },
        },

        mounted() {
            setTimeout(() => {
                this.show = true;
            }, 50);
        },
    };
</script>
