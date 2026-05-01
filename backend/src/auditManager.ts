import {Audit, User} from './db/models.ts';
import type {Transaction} from 'sequelize';

interface AuditRest {
    event?: number;
    grocery?: number;
    affectedUser?: number;
    values?: object|null;
}

interface AuditEntry extends AuditRest {
    type: string;
}

export async function log(transaction: Transaction, actingUser: User, type: string, rest: AuditRest): Promise<void> {
    await Audit.create({
        date:       new Date(),
        type,
        actingUser: actingUser.id,
        ...rest,
    }, {transaction});
}

export async function logMultiple(transaction: Transaction, actingUser: User, entries: Array<AuditEntry>): Promise<void> {
    let inserts = [];
    let date = Date.now();

    for (let entry of entries) {
        inserts.push({
            date:       date,
            actingUser: actingUser.id,
            ...entry,
        });
    }

    await Audit.bulkCreate(inserts, {transaction});
}
