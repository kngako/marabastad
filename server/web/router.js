/**
 * This router handles things related to the web browser experience...
 */
// This is the mock data we working with...

module.exports = function (options) {
    var path = require('path');
    var multer  = require('multer');
    var mime = require('mime');
    
    var storage = multer.diskStorage({
        destination: function (request, file, cb) {
            cb(null, 'files/')
        },
        filename: function (request, file, cb) {
            // TODO: Error handling...
            cb(null, file.fieldname + '-' + Date.now() + "." + mime.getExtension(file.mimetype))
        }
    });
    var imageUploads = multer({ 
        storage: storage,
        fileFilter: function (request, file, cb) {
            if (request.user && file.mimetype && file.mimetype.toLowerCase().startsWith("image/")) {
                cb(null, true);
            } else if (request.user) {
                // return cb(null, false)
                return cb(new Error('Only images are allowed')); // Skips this upload...
            } else {
                return cb(new Error('Not authorizedx    '));
            }
            
        }
    });

    var express = options.express;
    var db = options.db;
    var passport = options.passport;
    var email = options.email;

    const pug = require('pug');
    
    // TODO: Compile all the pug views
    const notFoundPage = pug.compileFile('views/404.pug'); 
    const errorPage = pug.compileFile('views/error.pug');
    const homePage = pug.compileFile('views/home.pug');

    var router = express.Router();

    // Home page...
    router.route('/')
        .get(function(request, response, next) {
            response.redirect("eepurl.com/b653bL");
            // response.send(homePage({
            //     user: request.user,
            //     pageTitle: "Money Jar - Home"
            // }))
        });
    
    // router.use(function (request, response, next) {
    //     response.status(500).redirect("/error");
    // })
    return router;
};