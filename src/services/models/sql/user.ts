import { SqlModel } from '../../../definations';
import { DataTypes } from 'sequelize';

class User extends SqlModel {
    declare id: number;
    declare firstName: string;
    declare lastName: string;
    declare emailId: string;
    declare password: string;
    declare initialPassword: string;
    declare firstLogin: boolean;
    declare countryCode: string;
    declare code: string;
    declare OTPCode: string;
    declare emailVerified: boolean;
    declare registrationDate: Date;
    declare codeUpdatedAt: Date;
    declare isBlocked: boolean;
}

const properties = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    emailId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    initialPassword: {
        type: DataTypes.STRING,
        allowNull: false
    },
    firstLogin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    countryCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    OTPCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    registrationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Date.now
    },
    codeUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Date.now
    },
    isBlocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
};

export default {
    name: 'user',
    Model: User,
    properties
};
