<template>
    <lunch-detail v-if="eventType === 'lunch' || eventType === 'special' || eventType === 'label'"/>
    <transfer-detail v-else-if="eventType === 'transfer'"/>
    <loading v-else/>
</template>

<script>
    import Loading from '@/views/Loading';
    import LunchDetail from '@/views/event/LunchDetail';
    import TransferDetail from '@/views/event/TransferDetail';

    export default {
        name: 'EventDetail',

        components: {
            Loading,
            LunchDetail,
            TransferDetail,
        },

        data() {
            return {
                eventId: parseInt(this.$route.params.id, 10),
            };
        },

        async created() {
            try {
                await this.$store.dispatch('fetchEvent', {eventId: this.eventId});
            } catch (err) {
                if (err?.response?.status === 404) {
                    await this.$router.push('/');
                } else {
                    throw err;
                }
            }
        },

        computed: {
            eventType() {
                return this.$store.getters.event(this.eventId)?.type;
            },
        },
    };
</script>
