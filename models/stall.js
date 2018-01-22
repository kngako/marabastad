module.exports = function (sequelize, DataTypes, options) {
    var model = sequelize.define("stall", {
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
        comment: "Stalls that users can open"
    });

    return model;
};