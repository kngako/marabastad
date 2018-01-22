/**
 * This router handles things related to the web browser experience...
 */
// This is the mock data we working with...
var stalls = [
    {   
        id: 12,
        name: "Short Stories",
        description: "Short Stories written by your favourite author.",
        image: {
            src: "/account/static/img/share_image.jpg"
        }
    },
    {
        id: 123,
        name: "I Am Your Crush. These Are My Selfies",
        description: "Daily selfies from the ones out there.",
        image: {
            src: "/account/static/img/coins.jpg"
        }
    }
]
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
    
    const marketPage = pug.compileFile('views/market.pug');
    const stallPage = pug.compileFile('views/stall.pug');
    const errorPage = pug.compileFile('views/error.pug');

    var router = express.Router();

    // Account page...
    router.route('/')
        .get(function(request, response, next) {
            // TODO: Pass the best selling stall...
            response.send(marketPage({
                user: request.user,
                pageTitle: "Marabastad - Market",
                stalls: stalls
            }))
        });

    router.route('/:stallId')
        .get(function(request, response, next) {
            response.send(stallPage({
                user: request.user,
                pageTitle: "Marabastad - " + stalls[0].name,
                stall: stalls[0]
            }))
        });
    return router;
};