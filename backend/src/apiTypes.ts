export type ApiBalances = {
    points: number;
    money: number;
};

export type ApiUser = {
    id: number;
    name: string;
    balances: ApiBalances;
    hidden: boolean;
    pointExempted: boolean;
    hiddenFromEvents: boolean;
};

export type ApiTransfer = {
    id: number;
    senderId: number;
    recipientId: number;
    currency: string;
    amount: number;
    eventId: number;
    eventName?: string;
};

export type ApiTransaction = {
    id: number;
    date: Date;
    userId: number;
    contraUserId: number;
    currency: string;
    amount: number;
    balance: number;
    eventId: number;
    eventName?: string;
};

export type ApiEvent = {
    id: number;
    type: string;
    date: Date;
    name: string;
    costs?: ApiBalances;
    factors?: {vegetarian?: {money?: number}};
    transfers?: Array<ApiTransfer>;
    comment?: string;
    participationFlatRate?: number|null;
    participationFee?: number;
    participationFeeRecipientId?: number|null;
    triggerDefaultOptIn?: boolean;
    immutable?: boolean;
};

export type ApiParticipation = {
    userId: number;
    eventId: number;
    type: string;
    credits: ApiBalances;
    factors: {money: number};
};

export type ApiAudit = {
    id: number;
    date: Date;
    type: string;
    actingUserId: number;
    actingUserName: string;
    affectedUserId: number|null;
    affectedUserName: string|null;
    eventId: number|null;
    eventName: string|null;
    groceryId: number|null;
    groceryLabel: string|null;
    eventDate: Date|null;
    values: object|null;
};

export type ApiAbsence = {
    id: number;
    start: Date;
    end: Date;
};

export type ApiGrocery = {
    id: number;
    label: string;
    checked: boolean;
};
