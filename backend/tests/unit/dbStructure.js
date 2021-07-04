'use strict';

module.exports = {
    audit:             {
        actingUser:   {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'INTEGER',
            unique:       false,
        },
        affectedUser: {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'INTEGER',
            unique:       false,
        },
        createdAt:    {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        date:         {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        details:      {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'VARCHAR(255)',
            unique:       false,
        },
        event:        {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'INTEGER',
            unique:       false,
        },
        id:           {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   true,
            type:         'INTEGER',
            unique:       false,
        },
        type:         {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'VARCHAR(32)',
            unique:       false,
        },
        updatedAt:    {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
    },
    configuration:     {
        createdAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        id:        {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   true,
            type:         'INTEGER',
            unique:       false,
        },
        name:      {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'VARCHAR(32)',
            unique:       true,
        },
        value:     {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'VARCHAR(255)',
            unique:       false,
        },
        updatedAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
    },
    event:             {
        createdAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        date:      {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        id:        {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   true,
            type:         'INTEGER',
            unique:       false,
        },
        name:      {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'VARCHAR(255)',
            unique:       false,
        },
        type:      {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'TINYINT',
            unique:       false,
        },
        updatedAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
    },
    lunch:             {
        createdAt:             {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        event:                 {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            references:   {
                key:   'id',
                model: 'event',
            },
            type:         'INTEGER',
            unique:       true,
        },
        id:                    {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   true,
            type:         'INTEGER',
            unique:       false,
        },
        moneyCost:             {
            allowNull:    false,
            defaultValue: '0',
            primaryKey:   false,
            type:         'DOUBLE PRECISION',
            unique:       false,
        },
        pointsCost:            {
            allowNull:    false,
            defaultValue: '0',
            primaryKey:   false,
            type:         'DOUBLE PRECISION',
            unique:       false,
        },
        updatedAt:             {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        vegetarianMoneyFactor: {
            allowNull:    false,
            defaultValue: '1',
            primaryKey:   false,
            type:         'DOUBLE PRECISION',
            unique:       false,
        },
    },
    participation:     {
        createdAt:      {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        event:          {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            references:   {
                key:   'id',
                model: 'event',
            },
            type:         'INTEGER',
            unique:       true,
        },
        id:             {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   true,
            type:         'INTEGER',
            unique:       false,
        },
        moneyCredited:  {
            allowNull:    false,
            defaultValue: '0',
            primaryKey:   false,
            type:         'DOUBLE PRECISION',
            unique:       false,
        },
        pointsCredited: {
            allowNull:    false,
            defaultValue: '0',
            primaryKey:   false,
            type:         'DOUBLE PRECISION',
            unique:       false,
        },
        type:           {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            references:   {
                key:   'id',
                model: 'participationType',
            },
            type:         'INTEGER',
            unique:       false,
        },
        updatedAt:      {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        user:           {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            references:   {
                key:   'id',
                model: 'user',
            },
            type:         'INTEGER',
            unique:       true,
        },
    },
    participationType: {
        createdAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        id:        {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   true,
            type:         'INTEGER',
            unique:       false,
        },
        label:     {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'VARCHAR(64)',
            unique:       false,
        },
        updatedAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
    },
    absence:           {
        createdAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        end:       {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATE',
            unique:       false,
        },
        id:        {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   true,
            type:         'INTEGER',
            unique:       false,
        },
        start:     {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATE',
            unique:       false,
        },
        updatedAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        user:      {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            references:   {
                key:   'id',
                model: 'user',
            },
            type:         'INTEGER',
            unique:       false,
        },
    },
    transfer:          {
        createdAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        event:     {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            references:   {
                key:   'id',
                model: 'event',
            },
            type:         'INTEGER',
            unique:       true,
        },
        id:        {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   true,
            type:         'INTEGER',
            unique:       false,
        },
        money:     {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DOUBLE PRECISION',
            unique:       false,
        },
        points:    {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DOUBLE PRECISION',
            unique:       false,
        },
        recipient: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            references:   {
                key:   'id',
                model: 'user',
            },
            type:         'INTEGER',
            unique:       false,
        },
        sender:    {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            references:   {
                key:   'id',
                model: 'user',
            },
            type:         'INTEGER',
            unique:       false,
        },
        updatedAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
    },
    user:              {
        active:    {
            allowNull:    false,
            defaultValue: false,
            primaryKey:   false,
            type:         'TINYINT(1)',
            unique:       false,
        },
        createdAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        hidden:    {
            allowNull:    false,
            defaultValue: false,
            primaryKey:   false,
            type:         'TINYINT(1)',
            unique:       false,
        },
        id:        {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   true,
            type:         'INTEGER',
            unique:       false,
        },
        money:     {
            allowNull:    false,
            defaultValue: '0',
            primaryKey:   false,
            type:         'DOUBLE PRECISION',
            unique:       false,
        },
        name:      {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'VARCHAR(64)',
            unique:       false,
        },
        password:  {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'VARCHAR(255)',
            unique:       false,
        },
        points:    {
            allowNull:    false,
            defaultValue: '0',
            primaryKey:   false,
            type:         'DOUBLE PRECISION',
            unique:       false,
        },
        settings:  {
            allowNull:    true,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'JSON',
            unique:       false,
        },
        updatedAt: {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'DATETIME',
            unique:       false,
        },
        username:  {
            allowNull:    false,
            defaultValue: undefined,
            primaryKey:   false,
            type:         'VARCHAR(64)',
            unique:       true,
        },
    },
};
