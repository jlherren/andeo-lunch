<template>
    <v-main>
        <the-app-bar sub-page>
            Event help
        </the-app-bar>

        <v-container>
            <h5 class="text-h5">Lunch events</h5>
            <p class="text-body-1">
                Lunch events are used for normal daily lunches where users can opt-in, opt-out or have their defaults
                be applied.  Feature set:
            </p>
            <ul>
                <li>Default opt-ins according to user settings.</li>
                <li>Opt-ins can be omnivorous or vegetarian with a configurable vegetarian factor.</li>
            </ul>

            <h5 class="text-h5 mt-4">Special events</h5>
            <p class="text-body-1 mt-4">
                Special events are used for points and/or money settlements which are usually not related to a meal,
                but involve many participants. Feature set:
            </p>
            <ul>
                <li>Default is opt-out for everyone, regardless of default opt-in settings.</li>
                <li>There is no <q>undecided</q> participation state.</li>
                <li>There is no distinction between omnivorous or vegetarian opt-ins.</li>
                <li>Per-user money factors can be configured.</li>
            </ul>

            <h5 class="text-h5 mt-4">Label events</h5>
            <p class="text-body-1 mt-4">
                Label events are just placeholders which allow to distinguish between days on which it is planned to
                not have a lunch, from days for which no planning has been done yet.  Example: National holidays.
            </p>
        </v-container>
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar';

    export default {
        components: {
            TheAppBar,
        },
    };
</script>
