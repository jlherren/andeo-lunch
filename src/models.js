'use strict';

const {Model, DataTypes} = require('sequelize');

class User extends Model {
}

class Event extends Model {
}

class Lunch extends Model {
}

class Participation extends Model {
}

class Transaction extends Model {
}

class Presence extends Model {
}

exports.User = User;
exports.Event = Event;
exports.Lunch = Lunch;
exports.Participation = Participation;
exports.Transaction = Transaction;
exports.Presence = Presence;

/**
 * @param {Sequelize} sequelize
 */
module.exports.initModels = function initModels(sequelize) {
    /**
     * @param {number} len
     * @returns {any}
     */
    function ascii(len) {
        switch (sequelize.getDialect()) {
            case 'mysql':
                return `${DataTypes.STRING(len)} CHARSET ascii COLLATE ascii_bin`;
            default:
                return DataTypes.STRING(len);
        }
    }

    User.init({
        username:      {type: ascii(64), allowNull: false, unique: true},
        password:      {type: ascii(255), allowNull: false},
        active:        {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        hidden:        {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        name:          {type: DataTypes.STRING(64), allowNull: false},
        currentPoints: {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        currentMoney:  {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
    }, {sequelize, modelName: 'user'});

    Lunch.init({}, {sequelize, modelName: 'lunch'});

    Event.init({
        type:       {type: DataTypes.TINYINT, allowNull: false},
        date:       {type: DataTypes.DATE, allowNull: false},
        name:       {type: DataTypes.STRING(255), allowNull: false},
        lunch:      {type: DataTypes.INTEGER, allowNull: true, references: {model: Lunch}},
        pointsCost: {type: DataTypes.DOUBLE, allowNull: false},
        moneyCost:  {type: DataTypes.DOUBLE, allowNull: false},
    }, {sequelize, modelName: 'event'});

    Participation.init({
        user:           {type: DataTypes.INTEGER, allowNull: false, unique: 'userEvent', references: {model: User}},
        event:          {type: DataTypes.INTEGER, allowNull: false, unique: 'userEvent', references: {model: Event}},
        type:           {type: DataTypes.TINYINT, allowNull: false},
        pointsCredited: {type: DataTypes.DOUBLE, allowNull: false},
        buyer:          {type: DataTypes.BOOLEAN, allowNull: false},
    }, {sequelize, modelName: 'participation'});

    Transaction.init({
        date:       {type: DataTypes.DATE, allowNull: false},
        user:       {type: DataTypes.INTEGER, allowNull: false, references: {model: User}},
        contraUser: {type: DataTypes.INTEGER, allowNull: false, references: {model: User}},
        currency:   {type: DataTypes.TINYINT, allowNull: false},
        amount:     {type: DataTypes.DOUBLE, allowNull: false},
        balance:    {type: DataTypes.DOUBLE, allowNull: false},
        event:      {type: DataTypes.INTEGER, allowNull: false, references: {model: Event}},
    }, {
        sequelize,
        modelName: 'transaction',
        indexes:   [
            {
                name:   'dateId',
                fields: ['date', 'id'],
            },
        ],
    });

    Presence.init({
        user:  {type: DataTypes.INTEGER, allowNull: false, references: {model: User}},
        start: {type: DataTypes.DATEONLY, allowNull: true},
        end:   {type: DataTypes.DATEONLY, allowNull: true},
    }, {sequelize, modelName: 'presence'});
};
