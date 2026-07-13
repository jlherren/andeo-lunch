import {DataTypes, type Sequelize} from 'sequelize';
import type {DataType} from 'sequelize/types/data-types';

/**
 * Helper class to create columns
 */
export class ColumnHelper {
    sequelize: Sequelize;

    constructor(sequelize: Sequelize) {
        this.sequelize = sequelize;
    }

    ascii(len: number): DataType {
        switch (this.sequelize.getDialect()) {
            case 'mysql':
            case 'mariadb':
                return `${DataTypes.STRING(len)} CHARSET ascii COLLATE ascii_bin`;

            default:
                return DataTypes.STRING(len);
        }
    }
}
