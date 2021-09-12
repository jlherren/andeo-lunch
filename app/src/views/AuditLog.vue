<template>
    <v-main>
        <the-app-bar sub-page>
            Audit log
            <template v-slot:buttons>
                <dynamic-button label="Refresh" :icon="$icons.refresh" @click="refresh()"/>
            </template>
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-container v-if="!loading && audits.length === 0">
            <v-banner elevation="2" single-line :icon="$icons.information">
                No audit entries
            </v-banner>
        </v-container>

        <v-virtual-scroll :item-height="$vuetify.breakpoint.smAndDown ? 60 : 30" :items="audits" ref="scroll" bench="1">
            <template v-slot:default="{item: audit}">
                <v-list-item :key="audit.id" :class="audit.class">
                    <span>{{ formatDate(audit.date) }}</span>
                    <span>{{ audit.actingUserName }}</span>
                    <span>{{ audit.display }}</span>
                    <span>
                        <v-chip small outlined label v-for="element of audit.details" :key="element.name" :class="element.class">
                            <span v-if="element.name">{{ element.name }}</span>
                            <b>{{ element.value }}</b>
                        </v-chip>
                    </span>
                </v-list-item>
            </template>
        </v-virtual-scroll>
    </v-main>
</template>

<script>
    import * as Constants from '@/constants';
    import * as DateUtils from '@/utils/dateUtils';
    import DynamicButton from '../components/DynamicButton';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import Vue from 'vue';

    const AUDIT_TYPES = {
        'event.create':         'Event created',
        'event.update':         'Event updated',
        'event.delete':         'Event deleted',
        'participation.create': 'Participation created',
        'participation.update': 'Participation updated',
        'participation.delete': 'Participation deleted',
        'transfer.create':      'Transfer created',
        'transfer.update':      'Transfer updated',
        'transfer.delete':      'Transfer deleted',
    };

    const NAMES = {
        'participation.type':           'Type',
        'participation.credits.money':  'Money',
        'participation.credits.points': 'Points',
        'transfer.sender':              'Sender',
        'transfer.recipient':           'Recipient',
        'transfer.amount':              'Amount',
        'transfer.currency':            'Currency',
        'event.name':                   'Name',
        'event.date':                   'Date',
        'event.costs.points':           'Points',
        'event.costs.money':            'Money',
        'event.factors.2.2':            'Vegi factor',
    };

    const PARTICIPATION_TYPES = {
        [Constants.PARTICIPATION_TYPES.OMNIVOROUS]: 'Omni',
        [Constants.PARTICIPATION_TYPES.VEGETARIAN]: 'Vegi',
        [Constants.PARTICIPATION_TYPES.OPT_OUT]:    'Opt-out',
        [Constants.PARTICIPATION_TYPES.UNDECIDED]:  'Undecided',
    };

    const OPT_IN_TYPES = [
        Constants.PARTICIPATION_TYPES.OMNIVOROUS,
        Constants.PARTICIPATION_TYPES.VEGETARIAN,
    ];

    export default {
        components: {
            DynamicButton,
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                loading: true,
            };
        },

        async created() {
            await this.$store.dispatch('fetchAuditLog');
            this.loading = false;
            this.scrollToBottom();
        },

        computed: {
            audits() {
                let audits = this.$store.getters.audits;
                return audits.map((audit, i) => {
                    return {
                        ...audit,
                        display: AUDIT_TYPES[audit.type] ?? audit.type,
                        details: this.getDetails(audit),
                        class:   i % 2 ? 'odd' : null,
                    };
                });
            },
        },

        methods: {
            formatDate(date) {
                return DateUtils.isoDateTime(date);
            },

            scrollToBottom() {
                Vue.nextTick(() => {
                    let element = this.$refs.scroll.$el;
                    element.scrollTop = element.scrollHeight;
                });
            },

            getDetails(audit) {
                let details = [];
                if (audit.type !== 'event.delete' && audit.eventName !== null) {
                    details.push({
                        name:  'Event',
                        value: this.abbreviate(audit.eventName),
                    });
                }
                if (audit.type.match(/^participation\./u) && audit.eventDate) {
                    let [typeBefore, typeAfter] = this.getBeforeAfterParticipationType(audit);
                    if (typeBefore && typeAfter && typeBefore !== typeAfter && (OPT_IN_TYPES.includes(typeBefore) || OPT_IN_TYPES.includes(typeAfter))) {
                        if (audit.eventDate < audit.date) {
                            details.push({
                                value: 'After event!',
                                class: 'alert',
                            });
                        } else if (DateUtils.previousMonday(audit.eventDate) < audit.date) {
                            details.push({
                                value: 'Current week!',
                                class: 'warning',
                            });
                        }
                    }
                }
                if (audit.affectedUserName !== null) {
                    details.push({
                        name:  'Affected',
                        value: audit.affectedUserName,
                        class: audit.affectedUserId !== audit.actingUserId ? 'alert' : null,
                    });
                }
                let values = audit.values;
                if (values) {
                    values = this.flatten(values);
                    let keys = Object.keys(values);
                    keys.sort();
                    for (let key of keys) {
                        let value = values[key];
                        let prefix = audit.type.split('.', 1)[0];
                        let keyWithPrefix = `${prefix}.${key}`;
                        let name = NAMES[keyWithPrefix] ?? key;
                        if (Array.isArray(value)) {
                            details.push({
                                name,
                                value: `${this.prettifyValue(keyWithPrefix, value[0])} \u{2192} ${this.prettifyValue(keyWithPrefix, value[1])}`,
                            });
                        } else {
                            details.push({
                                name,
                                value: this.prettifyValue(keyWithPrefix, value),
                            });
                        }
                    }
                }
                return details;
            },

            getBeforeAfterParticipationType(audit) {
                switch (audit.type) {
                    case 'participation.create':
                        return [Constants.PARTICIPATION_TYPES.UNDECIDED, audit.values?.type];
                    case 'participation.update':
                        return [audit.values?.type?.[0], audit.values?.type?.[1]];
                    case 'participation.delete':
                        return [audit.values?.type, Constants.PARTICIPATION_TYPES.UNDECIDED];
                    default:
                        return [undefined, undefined];
                }
            },

            flatten(object, prefix = '') {
                let ret = {};
                for (let key of Object.keys(object)) {
                    let value = object[key];
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        ret = {
                            ...ret,
                            ...this.flatten(value, `${prefix}${key}.`),
                        };
                    } else {
                        ret[prefix + key] = value;
                    }
                }
                return ret;
            },

            prettifyValue(key, value) {
                switch (key) {
                    case 'transfer.sender':
                    case 'transfer.recipient':
                        if (value === -1) {
                            return 'Temporary pot';
                        }
                        return this.$store.getters.user(value)?.name ?? 'Unknown';

                    case 'transfer.currency':
                        return value === 1 ? 'points' : 'money';

                    case 'transfer.amount':
                        if (typeof value === 'number') {
                            return value.toFixed(2)
                                .replace(/\.?0+$/u, '');
                        }
                        return value;

                    case 'participation.type':
                        return PARTICIPATION_TYPES[value] ?? value;

                    case 'event.factors.2.2':
                        value = parseFloat((value * 100).toPrecision(4));
                        return `${value}%`;

                    case 'event.date':
                        if (typeof value === 'string') {
                            value = new Date(value);
                        }
                        return value instanceof Date ? DateUtils.isoDateTime(value) : value;

                    default:
                        return value;
                }
            },

            abbreviate(text, length = 20) {
                if (text.length > length) {
                    text = text.substr(0, length);
                    return `${text}\u{2026}`;
                }
                return text;
            },

            async refresh() {
                this.loading = true;
                await this.$store.dispatch('fetchAuditLog', true);
                this.loading = false;
                this.scrollToBottom();
            },
        },
    };
</script>

<style lang="scss" scoped>
    .v-virtual-scroll {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        height: auto;
    }

    .v-list-item {
        padding: 0.5ex 1em;
        height: 30px;
        min-height: auto;
        display: flex;
        align-items: flex-start;
        max-width: 1200px;
        margin: 0 auto;
        font-size: 14px;

        & > span {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        & > span:nth-child(1) {
            flex: 0 0 150px;
            color: gray;
        }

        & > span:nth-child(2) {
            flex: 0 0 120px;
            font-weight: bold;
        }

        & > span:nth-child(3) {
            flex: 1 0 100px;
        }

        & > span:nth-child(4) {
            flex: 4 0 200px;
        }
    }

    .v-virtual-scroll__item {
        .theme--light.odd {
            background: #f5f5f5;
        }

        .theme--dark.odd {
            background: #000000;
        }
    }

    .v-chip {
        margin-right: 0.33em;
        padding: 0 0.33em;

        span {
            color: gray;
            font-size: smaller;
        }

        span + b {
            margin-left: 0.33em;
        }

        &.warning {
            border: 2px solid orange;
        }

        &.alert {
            border: 2px solid red;
        }
    }

    .theme--light.v-chip {
        b {
            color: black;
        }
    }

    .theme--dark.v-chip {
        b {
            color: white;
        }
    }

    @media #{map-get($display-breakpoints, 'sm-and-down')} {
        .v-list-item {
            height: 60px;
            flex-wrap: wrap;

            & > span:nth-child(1) {
                flex: 0 0 35%;
            }

            & > span:nth-child(2) {
                flex: 0 0 25%;
            }

            & > span:nth-child(3) {
                flex: 0 0 40%;
            }

            & > span:nth-child(4) {
                flex: 1 0 100%;
            }
        }
    }
</style>
