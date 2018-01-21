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
    
    const confirmEmailPage = pug.compileFile('views/confirm-email.pug');
    const confirmationFailurePage = pug.compileFile('views/confirmation-failure.pug');
    const confirmationSuccessPage = pug.compileFile('views/confirmation-success.pug');
    const errorPage = pug.compileFile('views/error.pug');
    const loginPage = pug.compileFile('views/login.pug');
    const signupPage = pug.compileFile('views/signup.pug');
    const unauthorizedPage = pug.compileFile('views/unauthorized.pug');

    var router = express.Router();

    // Account page...
    router.route('/')
        .get(function(request, response, next) {
            // TODO: Decide what the account homepage should have...
            response.send(homePage({
                user: request.user,
                pageTitle: "Marabastad - Home"
            }))
        });

    // Account Signup Page...
    router.route('/signup/')
        .get(function(request, response, next) {
            if(request.user){ // User is already logged in so don't go to matches again...
                response.redirect('/account');
            } else {
                // TODO: Might wanna load the user from params/body...
                response.send(signupPage({
                    pageTitle: "Marabastad - Signup",
                    errorMessage: null,
                    subErrorMessage: null,
                    user: {}
                }))
            }
        })
        .post(function(request, response, next){
            var tmpUser = {
                email: request.body.username,
                firstName: request.body.firstName,
                lastName: request.body.lastName,
                phoneNumber: request.body.phoneNumber,
                password: request.body.password,
                activitedOn: Date.now() // TODO: don't activate if not through invitation...
            }
            if(request.user){ // User is already logged in so don't go to matches again...
                // Let them now User already registered...
                response.redirect("/account");
            } else {
                // TODO: Validate user input...
                if((request.body.password !== request.body.confirmPassword) || request.body.password.length == 0) { // TODO: Might do this on the database object...
                    // TODO: user flash... passwords don't match
                    response.send(signupPage({
                        pageTitle: "Money Jar - Signup",
                        errorMessage: "passwords don't match",
                        subErrorMessage: null,
                        user: tmpUser
                    }));
                } else {
                    db.Role.findOne({
                        // TODO: Handle ordering business...
                        where: {
                            type: "user"
                        }
                    })
                    .then(role => {
                        // Now we can create the user account...
                        db.User.create(tmpUser, {
                            include: [
                                {
                                    association: db.User.UserRoles
                                }
                            ]
                        })
                        .then(user => {
                            console.log("Created User: " + JSON.stringify(user)); 
                        
                            // TODO: Think about the below redundancy... 
            
                            var userRoles = [];
                            userRoles.push({
                                userId: user.id,
                                roleId: role.id
                            });
                            db.UserRole.bulkCreate(userRoles)
                            .then(dbUserRoles => {
                                console.log("Created User Roles: "+ JSON.stringify(dbUserRoles));
                                // Show user a confirmation page...
                                console.log('44364246256: Trying to login: ', request)
                                passport.authenticate('local')(request, response, () => {
                                    // TODO: Figure out what problems arises without saving session...
                                    response.send(confirmEmailPage({
                                        user: request.user,
                                        pageTitle: "Money Jar - Confirm email"
                                    }));
                                });
                                
                                // Confirm email...
                                db.Confirmation.create({
                                    userId: user.id,
                                    sent: 0
                                }).then(confirmation => {
                                    email.sendConfirmationEmail(
                                        user.firstName, 
                                        confirmation.token, 
                                        user.email, 
                                        function (info) {
                                            // Confirmation email sent successfully...
                                            return confirmation.increment({
                                                'sent': 1
                                            });
                                        });
                                        // TODO: Add error callback to check what went wrong...
                                }).catch(error => {
                                    console.error("Confirmation fial: ", error);
                                });

                                // TODO: Add user to all other memberships they may have been invited too...
                            })
                        })
                        .catch(error => {
                            console.error("Hanlde error: ", error);
                            var errorMessage = "Failed to create user";
                            if(error.errors[0].type) {
                                // TODO: replace "." with " "
                                errorMessage = "invalid " + error.errors[0].path
                                subErrorMessage = error.errors[0].message
                            }
                            response.send(signupPage({
                                pageTitle: "Money Jar - Signup",
                                errorMessage: errorMessage,
                                subErrorMessage: subErrorMessage,
                                user: tmpUser
                            }));
                        })
                    })
                    .catch(error => {
                        // TODO: Report error to user...
                        response.send(errorPage({
                            user: request.user,
                            pageTitle: "Money Jar - Signup ERROR"
                        }))
                    });
                }
                
            }
        });

    // Account Confirmation
    router.route('/confirmation/:confirmationToken')
        .get(function(request, response, next){
            db.Confirmation.findById(request.params.confirmationToken, {
                include: [
                    {
                        model: db.User,
                        attributes: ['id', 'firstName', 'lastName']
                    }
                ]
            })
            .then(confirmation => {
                if(confirmation) {
                    confirmation.user.update({
                        emailConfirmedOn: new Date()
                    }).then(() => {
                        return confirmation.destroy();
                    }).then(() => {
                        response.send(confirmationSuccessPage({
                            user: request.user,
                            pageTitle: "Money Jar - Confirmation Success"
                        }))
                        // response.redirect("/confirmation-success");
                    })
                    .catch(error => {
                        console.error("Error Confirmation: ", error);
                        // TODO: Show error info...
                        response.send(errorPage({
                            user: request.user,
                            pageTitle: "Money Jar - Error"
                        }))
                    });
                } else {
                    // TODO: Render confirmation error...
                    response.send(confirmationFailurePage({
                        user: request.user,
                        pageTitle: "Money Jar - Confirmation Failure"
                    }))
                    // response.status(400).send("Match not found");
                }
            })
        });

    router.route('/confirm-email/')
        .get(function(request, response, next){
            console.log("We should be here redirecting stuff...");
            if (request.user && request.user.emailConfirmedOn == null) {
                response.send(confirmEmailPage({
                    user: request.user,
                    pageTitle: "Money Jar - Confirm email"
                }))
            } else if(request.user){
                response.redirect('/account');
            } else  {
                response.redirect('/account/login');
            }
        });

    // Account login...
    router.route('/login')
        .get(function(request, response, next) {
            if(request.user){ // User is already logged in so don't go to matches again...
                response.redirect('/account');
            } else {
                response.send(loginPage({
                    pageTitle: "Money Jar - Login",
                    data: null
                }))
            }
        })
        .post(function(request, response, next) {
            if(request.user){ 
                // User is already logged in so don't go to matches again...
                response.redirect('/account');
            } else {
                // Check arguments and handle the errors...
                passport.authenticate('local', (error, user, info) => {                
                    if(info) {
                        response.send(loginPage({
                            pageTitle: "Money Jar - Login",
                            data: info
                        }))
                    }
                    if(user) {
                        request.logIn(user, function(err) {
                            if (err) { return next(err); }
                            return  response.redirect('/account');
                        });  
                    }
                })(request, response, next);
            }
        });

    // Account Logout
    router.get('/account/logout', function(request, response){
            if(request.user){
                request.logout();   
            } 
            response.redirect('/');
        });

    // Account Unauthorized
    router.get('/account/unauthorized', function(request, response){
            response.send(unauthorizedPage({
                user: request.user,
                pageTitle: "Money Jar - Unauthorized"
            }))
        });

    // Last thing that should be done is serve static files... public first

    return router;
};