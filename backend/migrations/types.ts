import type {Model, Sequelize} from 'sequelize';
import type {MigrationFn} from 'umzug';

export type Migration = MigrationFn<Sequelize>;

declare module 'sequelize' {
    // The generic parameter must match Sequelize's declaration for interface merging.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ModelAttributeColumnOptions<M extends Model = Model> {
        /** MariaDB/MySQL column placement option supported by QueryInterface. */
        after?: string;
    }
}
