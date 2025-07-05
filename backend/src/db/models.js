import * as Constants from '../constants.js';
import * as EventManager from '../eventManager.js';
import {DataTypes, Model} from 'sequelize';
import {ColumnHelper} from './columnHelper.js';
import jsonWebToken from 'jsonwebtoken';

/**
 * @class Model
 * @property {number} id
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @property {string} name
 * @property {string} value
 */
export class Configuration extends Model {
}

/**
 * @property {string} name
 * @property {string} value
 */
export class Secret extends Model {
}

/**
 * @property {string} username
 * @property {boolean} active Whether this user can log in, and can be added or removed from events
 * @property {boolean} hidden Whether the user should be displayed in a normal user listing
 * @property {string} name
 * @property {number} points
 * @property {number} money
 * @property {number} maxPastDaysEdit
 * @property {number} pointExempted
 * @property {number} hiddenFromEvents
 * @property {Object} settings
 * @property {Array<Permission>} Permissions
 */
export class User extends Model {
    /**
     * @param {string} secret
     * @param {object} [options]
     * @param {object} [extraPayload] Only for testing.
     * @return {Promise<string>}
     */
    generateToken(secret, options, extraPayload = {}) {
        // sign() is supposed to return a promise, but it doesn't
        return Promise.resolve(jsonWebToken.sign({...extraPayload, id: this.id}, secret, options));
    }

    /**
     * @param {string} name
     * @return {boolean}
     */
    hasPermission(name) {
        if (!this.Permissions) {
            throw new Error('User object was not loaded with Permissions');
        }
        return this.Permissions.some(permission => permission.name === name);
    }

    /**
     * Map a user to an object suitable to return over the API
     *
     * @return {ApiUser}
     */
    toApi() {
        return {
            id:               this.id,
            name:             this.name,
            balances:         {
                points: this.points,
                money:  this.money,
            },
            hidden:           this.hidden,
            pointExempted:    this.pointExempted,
            hiddenFromEvents: this.hiddenFromEvents,
        };
    }
}

/**
 * @property {string} password
 * @property {Date|null} lastPasswordChange
 */
export class UserPassword extends Model {
}

/**
 * @property {string} name
 */
export class Permission extends Model {
}

/**
 * @property {number} user
 * @property {number} permission
 */
export class UserPermission extends Model {
}

export class EventType extends Model {
}

/**
 * @property {number} type
 * @property {Date} date
 * @property {string} name
 * @property {Lunch} [Lunch]
 * @property {Array<Transfer>} [Transfers]
 * @property {boolean} immutable
 */
export class Event extends Model {
    /**
     * Map a user to an object suitable to return over the API
     *
     * @param {User} user
     * @param {number} systemUserId
     * @return {ApiEvent}
     */
    toApi(user, systemUserId) {
        return {
            id:                          this.id,
            type:                        Constants.EVENT_TYPE_NAMES[this.type],
            date:                        this.date,
            name:                        this.name,
            costs:                       this.Lunch && {
                points: this.Lunch.pointsCost,
                money:  this.Lunch.moneyCost,
            },
            factors:                     this.Lunch && {
                [Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.VEGETARIAN]]: {
                    [Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY]]: this.Lunch.vegetarianMoneyFactor,
                },
            },
            participationFlatRate:       this.Lunch?.participationFlatRate,
            participationFee:            this.Lunch?.participationFee,
            participationFeeRecipientId: this.Lunch?.participationFeeRecipient,
            transfers:                   this.Transfers?.map(transfer => transfer.toApi(systemUserId)),
            comment:                     this.Lunch?.comment,
            canEdit:                     EventManager.userCanEditDate(user, this.date),
            immutable:                   this.type === Constants.EVENT_TYPES.TRANSFER ? this.immutable : undefined,
        };
    }

    toSnapshot() {
        // null comments don't need to appear in the log at all
        let comment = this.Lunch?.comment;
        if (comment === null) {
            comment = undefined;
        }
        return {
            date:                  this.date,
            name:                  this.name,
            costs:                 this.Lunch && {
                points: this.Lunch.pointsCost,
            },
            factors:               this.Lunch && {
                [Constants.PARTICIPATION_TYPES.VEGETARIAN]: {
                    [Constants.CURRENCIES.MONEY]: this.Lunch.vegetarianMoneyFactor,
                },
            },
            participationFlatRate: this.Lunch?.participationFlatRate,
            participationFee:      this.Lunch?.participationFee,
            comment:               comment,
        };
    }
}

/**
 * @property {number} pointsCost
 * @property {number} moneyCost
 * @property {number|null} vegetarianMoneyFactor
 * @property {number|null} participationFlatRate
 * @property {number} participationFee
 * @property {number|null} participationFeeRecipient
 * @property {User} [ParticipationFeeRecipient]
 * @property {string|null} comment
 * @property {number} event
 * @property {Event} [Event]
 */
export class Lunch extends Model {
}

/**
 * @property {number} event
 * @property {Event} [Event]
 * @property {number} sender
 * @property {User} [Sender]
 * @property {number} recipient
 * @property {User} [Recipient]
 * @property {number} currency
 * @property {number} amount
 */
export class Transfer extends Model {
    /**
     * Map to an object suitable to return over the API
     *
     * @param {number} systemUserId
     * @return {ApiTransfer}
     */
    toApi(systemUserId) {
        return {
            id:          this.id,
            eventId:     this.event,
            eventName:   this.Event?.name,
            senderId:    systemUserId === this.sender ? -1 : this.sender,
            recipientId: systemUserId === this.recipient ? -1 : this.recipient,
            currency:    Constants.CURRENCY_NAMES[this.currency],
            amount:      this.amount,
        };
    }

    toSnapshot(systemUserId) {
        return {
            sender:    systemUserId === this.sender ? -1 : this.sender,
            recipient: systemUserId === this.recipient ? -1 : this.recipient,
            currency:  this.currency,
            amount:    this.amount,
        };
    }
}

/**
 * @property {string} label
 */
export class ParticipationType extends Model {
}

/**
 * @property {number} user
 * @property {User} [User]
 * @property {number} event
 * @property {Event} [Event]
 * @property {number} type
 * @property {number} pointsCredited
 * @property {number} moneyCredited
 * @property {number} moneyFactor
 */
export class Participation extends Model {
    /**
     * Map an event participation to an object suitable to return over the API
     *
     * @return {ApiParticipation}
     */
    toApi() {
        return {
            userId:  this.user,
            eventId: this.event,
            type:    Constants.PARTICIPATION_TYPE_NAMES[this.type],
            credits: {
                points: this.pointsCredited,
                money:  this.moneyCredited,
            },
            factors: {
                money: this.moneyFactor,
            },
        };
    }

    toSnapshot() {
        return {
            type:    this.type,
            credits: {
                points: this.pointsCredited,
                money:  this.moneyCredited,
            },
            factors: {
                money: this.moneyFactor,
            },
        };
    }
}

/**
 * @property {Date} date
 * @property {number} user
 * @property {User} [User]
 * @property {number} contraUser
 * @property {User} [ContraUser]
 * @property {number} currency
 * @property {number} amount
 * @property {number} balance
 * @property {number} event
 * @property {Event} [Event]
 */
export class Transaction extends Model {
    /**
     * Map a transaction to an object suitable to return over the API
     *
     * @return {ApiTransaction}
     */
    toApi() {
        return {
            id:           this.id,
            date:         this.date,
            userId:       this.user,
            contraUserId: this.contraUser,
            eventId:      this.event,
            eventName:    this.Event?.name,
            currency:     Constants.CURRENCY_NAMES[this.currency],
            amount:       this.amount,
            balance:      this.balance,
        };
    }
}

/**
 * @property {number} user
 * @property {User} [User]
 * @property {Date|null} start
 * @property {Date|null} end
 */
export class Absence extends Model {
    /**
     * @return {ApiAbsence}
     */
    toApi() {
        return {
            id:     this.id,
            userId: this.user.id,
            start:  this.start,
            end:    this.end,
        };
    }

    toSnapshot() {
        return {
            user:  this.user,
            start: this.start,
            end:   this.end,
        };
    }
}

/**
 * @property {Date} date
 * @property {number|null} actingUser
 * @property {User|null} [ActingUser]
 * @property {string} type
 * @property {number|null} event
 * @property {Event|null} Event
 * @property {number|null} grocery
 * @property {Grocery|null} Grocery
 * @property {number|null} affectedUser
 * @property {User|null} AffectedUser
 * @property {object|null} values
 */
export class Audit extends Model {
    /**
     * Map an audit to an object suitable to return over the API
     *
     * @return {ApiAudit}
     */
    toApi() {
        return {
            id:               this.id,
            date:             this.date,
            type:             this.type,
            actingUserId:     this.actingUser,
            actingUserName:   this.getActingUserName(),
            eventId:          this.event,
            eventName:        this.getEventName(),
            eventDate:        this.Event?.date,
            groceryId:        this.grocery,
            groceryLabel:     this.getGroceryLabel(),
            affectedUserId:   this.affectedUser,
            affectedUserName: this.getAffectedUserName(),
            values:           this.values,
        };
    }

    getActingUserName() {
        if (this.ActingUser) {
            return this.ActingUser.name;
        } else if (this.ActingUser === null && this.actingUser !== null) {
            return 'Deleted user';
        }
        return null;
    }

    getEventName() {
        if (this.Event) {
            return this.Event.name;
        } else if (this.Event === null && this.event !== null) {
            return 'Deleted event';
        }
        return null;
    }

    getGroceryLabel() {
        if (this.Grocery) {
            return this.Grocery.label;
        } else if (this.Grocery === null && this.grocery !== null) {
            return 'Deleted grocery';
        }
        return null;
    }

    getAffectedUserName() {
        if (this.AffectedUser) {
            return this.AffectedUser.name;
        } else if (this.AffectedUser === null && this.affectedUser !== null) {
            return 'Deleted user';
        }
        return null;
    }
}

export class Grocery extends Model {
    /**
     * @return {ApiGrocery}
     */
    toApi() {
        return {
            id:      this.id,
            label:   this.label,
            checked: this.checked,
        };
    }

    toSnapshot() {
        return {
            label:   this.label,
            checked: this.checked,
        };
    }
}

export class DeviceVersion extends Model {
}

/**
 * @param {Sequelize} sequelize
 */
export function initModels(sequelize) {
    let ch = new ColumnHelper(sequelize);

    // Default cascading options
    let cascade = {
        onDelete: 'restrict',
        onUpdate: 'restrict',
    };

    Configuration.init({
        name:  {type: ch.ascii(32), allowNull: false, unique: 'configuration_name_idx'},
        value: {type: DataTypes.TEXT, allowNull: false},
    }, {
        sequelize,
        modelName: 'configuration',
    });

    Secret.init({
        name:  {type: ch.ascii(32), allowNull: false, unique: 'secret_name_idx'},
        value: {type: DataTypes.STRING(255), allowNull: false},
    }, {
        sequelize,
        modelName: 'secret',
    });

    User.init({
        username:         {type: ch.ascii(64), allowNull: false, unique: 'user_username_idx'},
        name:             {type: DataTypes.STRING(64), allowNull: false},
        active:           {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        hidden:           {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        points:           {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        money:            {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        maxPastDaysEdit:  {type: DataTypes.SMALLINT, allowNull: true, defaultValue: null},
        pointExempted:    {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        hiddenFromEvents: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        settings:         {type: DataTypes.JSON, allowNull: true, defaultValue: null},
        // Note: Couldn't manage to set default on 'settings'
    }, {
        sequelize,
        modelName: 'user',
    });

    UserPassword.init({
        user:       {type: DataTypes.INTEGER, allowNull: false, unique: 'userPassword_user_idx'},
        password:   {type: ch.ascii(255), allowNull: false},
        lastChange: {type: DataTypes.DATE, allowNull: true, defaultValue: null},
    }, {
        sequelize,
        modelName: 'userPassword',
    });
    UserPassword.belongsTo(User, {foreignKey: {name: 'user'}, as: 'User', ...cascade});
    User.hasOne(UserPassword, {foreignKey: {name: 'user'}, as: 'UserPassword', ...cascade});

    Permission.init({
        name: {type: ch.ascii(64), allowNull: false, unique: 'permission_name_idx'},
    }, {
        sequelize,
        modelName: 'permission',
    });

    UserPermission.init({}, {
        sequelize,
        modelName:  'userPermission',
        indexes:    [{
            name:   'userPermission_permission_idx',
            fields: ['permission'],
        }],
        timestamps: false,
    });
    User.belongsToMany(Permission, {
        through:    UserPermission,
        foreignKey: 'user',
        otherKey:   'permission',
        as:         'Permissions',
    });

    EventType.init({
        id: {type: DataTypes.TINYINT, allowNull: false, primaryKey: true, autoIncrement: true},
        // API names should eventually be moved into this table
    }, {
        sequelize,
        modelName: 'eventType',
    });

    Event.init({
        type:      {type: DataTypes.TINYINT, allowNull: false},
        date:      {type: DataTypes.DATE, allowNull: false},
        name:      {type: DataTypes.STRING(255), allowNull: false},
        // immutable currently only affects transfer events
        immutable: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    }, {
        sequelize,
        modelName: 'event',
        indexes:   [{
            name:   'event_type_idx',
            fields: ['type'],
        }],
    });
    Event.belongsTo(EventType, {foreignKey: {name: 'type'}, as: 'EventType', ...cascade});

    Lunch.init({
        event:      {type: DataTypes.INTEGER, allowNull: false, unique: 'lunch_event_idx'},
        pointsCost: {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},

        // Note: moneyCost is purely informational and won't affect calculations!  The moneyCredited field
        // of participations is what will actually be used for calculations.
        moneyCost:                 {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        vegetarianMoneyFactor:     {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 1},
        participationFlatRate:     {type: DataTypes.DOUBLE, allowNull: true, defaultValue: null},
        participationFee:          {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        participationFeeRecipient: {type: DataTypes.INTEGER, allowNull: true, defaultValue: null},
        comment:                   {type: DataTypes.TEXT, allowNull: true, defaultValue: null},
    }, {
        sequelize,
        modelName: 'lunch',
        indexes:   [{
            name:   'lunch_participationFeeRecipient_idx',
            fields: ['participationFeeRecipient'],
        }],
    });
    Lunch.belongsTo(Event, {foreignKey: {name: 'event'}, as: 'Event', ...cascade});
    Lunch.belongsTo(User, {foreignKey: {name: 'participationFeeRecipient'}, as: 'ParticipationFeeRecipient', ...cascade});
    Event.hasOne(Lunch, {foreignKey: {name: 'event'}, as: 'Lunch', ...cascade});

    Transfer.init({
        event:     {type: DataTypes.INTEGER, allowNull: false},
        sender:    {type: DataTypes.INTEGER, allowNull: false},
        recipient: {type: DataTypes.INTEGER, allowNull: false},
        amount:    {type: DataTypes.DOUBLE, allowNull: false},
        currency:  {type: DataTypes.TINYINT, allowNull: false},
    }, {
        sequelize,
        modelName: 'transfer',
        indexes:   [{
            name:   'transfer_event_idx',
            fields: ['event'],
        }, {
            name:   'transfer_sender_idx',
            fields: ['sender'],
        }, {
            name:   'transfer_recipient_idx',
            fields: ['recipient'],
        }],
    });
    Transfer.belongsTo(User, {foreignKey: {name: 'sender'}, as: 'Sender', ...cascade});
    Transfer.belongsTo(User, {foreignKey: {name: 'recipient'}, as: 'Recipient', ...cascade});
    Transfer.belongsTo(Event, {foreignKey: {name: 'event'}, as: 'Event', ...cascade});
    Event.hasMany(Transfer, {foreignKey: {name: 'event'}, as: 'Transfers', ...cascade});

    ParticipationType.init({
        label: {type: DataTypes.STRING(64), allowNull: false},
    }, {sequelize, modelName: 'participationType'});

    Participation.init({
        event:          {type: DataTypes.INTEGER, allowNull: false},
        user:           {type: DataTypes.INTEGER, allowNull: false},
        type:           {type: DataTypes.INTEGER, allowNull: false},
        pointsCredited: {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        moneyCredited:  {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        moneyFactor:    {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 1.0},
    }, {
        sequelize,
        modelName: 'participation',
        indexes:   [{
            name:   'participation_userEvent_idx',
            fields: ['user', 'event'],
            unique: true,
        }, {
            name:   'participation_event_idx',
            fields: ['event'],
        }, {
            name:   'participation_type_idx',
            fields: ['type'],
        }],
    });
    Participation.belongsTo(ParticipationType, {foreignKey: {name: 'type'}, as: 'ParticipationType', ...cascade});
    Participation.belongsTo(User, {foreignKey: {name: 'user'}, as: 'User', ...cascade});
    Participation.belongsTo(Event, {foreignKey: {name: 'event'}, as: 'Event', ...cascade});
    Event.hasMany(Participation, {foreignKey: {name: 'event'}, as: 'Participations', ...cascade});

    Transaction.init({
        date:       {type: DataTypes.DATE, allowNull: false},
        user:       {type: DataTypes.INTEGER, allowNull: false},
        contraUser: {type: DataTypes.INTEGER, allowNull: false},
        event:      {type: DataTypes.INTEGER, allowNull: false},
        currency:   {type: DataTypes.TINYINT, allowNull: false},
        amount:     {type: DataTypes.DOUBLE, allowNull: false},
        balance:    {type: DataTypes.DOUBLE, allowNull: false},
    }, {
        sequelize,
        modelName: 'transaction',
        indexes:   [{
            name:   'transaction_user_idx',
            fields: ['user'],
        }, {
            name:   'transaction_contraUser_idx',
            fields: ['contraUser'],
        }, {
            name:   'transaction_event_idx',
            fields: ['event'],
        }, {
            name:   'transaction_dateId_idx',
            fields: ['date', 'id'],
        }, {
            name:   'transaction_userCurrencyDateId',
            fields: ['user', 'currency', 'date', 'id'],
        }],
    });
    Transaction.belongsTo(Event, {foreignKey: {name: 'event'}, as: 'Event', ...cascade});
    Transaction.belongsTo(User, {foreignKey: {name: 'user'}, as: 'User', ...cascade});
    Transaction.belongsTo(User, {foreignKey: {name: 'contraUser'}, as: 'ContraUser', ...cascade});

    Absence.init({
        user:  {type: DataTypes.INTEGER, allowNull: false},
        start: {type: DataTypes.DATEONLY, allowNull: true, defaultValue: null},
        end:   {type: DataTypes.DATEONLY, allowNull: true, defaultValue: null},
    }, {
        sequelize,
        modelName: 'absence',
        indexes:   [{
            name:   'absence_user_idx',
            fields: ['user'],
        }],
    });
    Absence.belongsTo(User, {foreignKey: {name: 'user'}, as: 'User', ...cascade});

    Grocery.init({
        label:   {type: DataTypes.STRING(255), allowNull: false},
        checked: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        order:   {type: DataTypes.INTEGER, allowNull: false},
    }, {
        sequelize,
        modelName: 'grocery',
        indexes:   [{
            name:   'checked_order_idx',
            fields: ['checked', 'order'],
        }],
    });

    Audit.init({
        date:         {type: DataTypes.DATE, allowNull: false},
        type:         {type: ch.ascii(32), allowNull: false},
        actingUser:   {type: DataTypes.INTEGER, allowNull: false},
        event:        {type: DataTypes.INTEGER, allowNull: true, defaultValue: null},
        grocery:      {type: DataTypes.INTEGER, allowNull: true, defaultValue: null},
        affectedUser: {type: DataTypes.INTEGER, allowNull: true, defaultValue: null},
        values:       {type: DataTypes.JSON, allowNull: true, defaultValue: null},
    }, {
        sequelize,
        modelName: 'audit',
        indexes:   [{
            name:   'audit_actingUser_idx',
            fields: ['actingUser'],
        }, {
            name:   'audit_event_idx',
            fields: ['event'],
        }, {
            name:   'audit_affectedUser_idx',
            fields: ['affectedUser'],
        }, {
            name:   'audit_grocery_idx',
            fields: ['grocery'],
        }],
    });
    // These do not enforce the FK constraint on purpose, to allow deleting objects but keeping the audits for it
    Audit.belongsTo(User, {foreignKey: {name: 'actingUser'}, constraints: false, as: 'ActingUser'});
    Audit.belongsTo(Event, {foreignKey: {name: 'event'}, constraints: false, as: 'Event'});
    Audit.belongsTo(Grocery, {foreignKey: {name: 'grocery'}, constraints: false, as: 'Grocery'});
    Audit.belongsTo(User, {foreignKey: {name: 'affectedUser'}, constraints: false, as: 'AffectedUser'});

    DeviceVersion.init({
        device:   {type: ch.ascii(64), allowNull: false, unique: 'deviceVersion_device_idx'},
        version:  {type: ch.ascii(16), allowNull: false},
        lastSeen: {type: DataTypes.DATE, allowNull: false},
    }, {
        sequelize,
        modelName: 'deviceVersion',
    });
}
