module.exports = function (sequelize, DataTypes, options) {
    var model = sequelize.define("userRole", {
        // Attributes...
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            unique: true
        }
    });

    return model;
};