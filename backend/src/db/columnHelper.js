import {DataTypes} from 'sequelize';

/**
 * Helper class to create columns
 */
export class ColumnHelper {
    /**
     * @param {Sequelize} sequelize
     */
    constructor(sequelize) {
        this.sequelize = sequelize;
    }

    /**
     * @param {number} len
     * @return {any}
     */
    ascii(len) {
        switch (this.sequelize.getDialect()) {
            case 'mysql':
            case 'mariadb':
                return `${DataTypes.STRING(len)} CHARSET ascii COLLATE ascii_bin`;

            default:
                return DataTypes.STRING(len);
        }
    }
}
