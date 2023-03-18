<template>
    <v-btn :text="large" :icon="!large" :disabled="disabled" @click="$emit('click')" :to="to" :color="color">
        <v-icon v-if="!right" :left="large">{{ icon }}</v-icon>
        <span v-if="large">{{ label }}</span>
        <v-icon v-if="right" :right="large">{{ icon }}</v-icon>
    </v-btn>
</template>

<script>
    export default {
        name: 'DynamicButton',

        props: {
            label:    String,
            icon:     String,
            right:    Boolean,
            disabled: Boolean,
            to:       String,
            color:    String,
        },

        computed: {
            large() {
                return this.$vuetify.breakpoint.smAndUp;
            },
        },
    };
</script>
