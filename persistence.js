import { resolve } from '../../../.cache/typescript/2.6/node_modules/@types/bluebird';

module.exports = function (config) {
    var db = {};

    var dbOptions = {
        db: db
    };

    dbOptions.Sequelize = require('sequelize');
    // require('sequelize-hierarchy')(dbOptions.Sequelize);
    dbOptions.bcrypt = require('bcrypt'); // Used to hash the passwords...
    
    // Add the config of the things...
    var database = config.get('database.database');
    var username = config.get('database.username');
    var password = config.get('database.password');
    
    dbOptions.sequelize = new dbOptions.Sequelize(database, username, password, {
        host: config.get('database.host'),
        dialect: config.get('database.dialect'),
        
        // SQLite only
        storage: config.get('database.storage')
    }, {
        // don't delete database entries but set the newly added attribute deletedAt
        // to the current date (when deletion was done). paranoid will only work if
        // timestamps are enabled
        paranoid: true,
    });
    
    // Test out the connection
    dbOptions.sequelize
        .authenticate()
        .then(() => {
            console.log('Connection has been established successfully.');
        })
        .catch(err => {
            console.error('Unable to connect to the database:', err);
            // TODO: Fix 
        });
    
    // TODO: Import the modules...
    db.User = require('./models/user.js')(dbOptions.sequelize, dbOptions.Sequelize, dbOptions);
    db.Role = require('./models/role.js')(dbOptions.sequelize, dbOptions.Sequelize, dbOptions);
    db.UserRole = require('./models/user_role.js')(dbOptions.sequelize, dbOptions.Sequelize, dbOptions);
    db.Location = require('./models/location.js')(dbOptions.sequelize, dbOptions.Sequelize, dbOptions);
    db.Confirmation = require('./models/confirmation.js')(dbOptions.sequelize, dbOptions.Sequelize, dbOptions);
    db.Image = require('./models/image.js')(dbOptions.sequelize, dbOptions.Sequelize, dbOptions);
    
    // Time for the associations...
    // User 1:N associations
    db.User.UserRoles = db.User.hasMany(db.UserRole);
    db.UserRole.belongsTo(db.User);

    // User 1:1 associations
    db.User.hasOne(db.Confirmation);
    db.Confirmation.belongsTo(db.User);
    
    // Roles 1:N associations...
    db.Role.UserRoles = db.Role.hasMany(db.UserRole);
    db.UserRole.belongsTo(db.Role);

    db.User.Images = db.User.hasMany(db.Image);
    db.Image.User = db.Image.belongsTo(db.User);
    
    db.LoadDB = (callback) => {
        return new Promise((resolve, reject) => {
            dbOptions.sequelize.sync()
            .then(() => {
                resolve(db);
            })
            .catch(error => {
                // Do the things...
                console.error('Unable to connect to the database:', error);
                reject(error);
            })
        })
        
    } // TODO: Turn this into a promise to be like all the other cool kids...

    /**
     * TODO: 
     * 
     * @param {*} callback 
     */
    db.updateDatabaseFromModels = (callback) => {
        return new Promise((resolve, reject) => {
            dbOptions.sequelize.sync({
                alter: true
            })
            .then(() => {
                resolve(db);
                console.log("DB update successful.");
            })
            .catch(error => {
                // Do the things...
                reject(error);
                console.error('Unable to connect to the database:', error);
            })
        });
        
    } // TODO: Turn this into a promise to be like all the other cool kids...
    return db;

    
};

