module.exports = function (sequelize, DataTypes, options) {
    var model = sequelize.define("product", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            unique: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        comment: "Product sold on the system"
    });

    return model;
};