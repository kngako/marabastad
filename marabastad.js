// App starts by loading the persistence which will then load the server...

// TODO: Read and set configs...
var config = require("config");

// var server = require('./server.js')(config);
var dbUtils = require('./persistence.js')(config);

dbUtils.LoadDB().then(db => {
    var server = require('./server.js')(config, db);
});

