exports.active = function (everyauth, db) {
    // make default setting for EveryAuth module.
    var auth = everyauth.password.loginWith('email');
    everyauth.everymodule.userPkey('_id');
    everyauth.everymodule.findUserById(function (id, callback) {
        db.users.findOne({ _id: db.ObjectId(id) }, function (error, user) {
            callback(error, user);
        });
    });

    // setting logout
    everyauth.everymodule.logoutPath('/logout');
    everyauth.everymodule.logoutRedirectPath('/login');

    // setting register
    auth.registerView('register');
    auth.getRegisterPath('/register');
    auth.postRegisterPath('/register');
    auth.extractExtraRegistrationParams(function (request) {
        return {
            confirmPassword: request.param('password-confirm')
        }
    });
    auth.validateRegistration(function (userAttribute, errors) {
        // assigning variable
        var promise = this.Promise();

        // verifying string length.
        if (!/\w+@\w+\.\w+/.test(userAttribute.email)) {
            errors.push('This is not a right form for email.');
        }
        // verifying password length
        if (userAttribute.password.length < 8) {
            errors.push('Password must be longer than 8 words.');
        }
        // verifying password.
        if (userAttribute.confirmPassword != userAttribute.password) {
            errors.push('Password does not match properly');
        }
        // requesting data from database.
        db.users.findOne({ email: userAttribute.email }, function (error, result) {
            if (result) {
                errors.push('ID already existed.');
                promise.fulfill(errors);
            } else if (errors.length) {
                promise.fulfill(errors);
            } else {
                promise.fulfill(userAttribute);
            }
        });

        // return
        return promise;
    });
    auth.registerUser(function (userAttribute) {
        // assigning variable.
        var promise = this.Promise();
        var user = {
            email: userAttribute.email,
            password: userAttribute.password,
            acceptFriends: [],
            requestFriends: [],
            pendingFriends: []
        };

        // requesting inserting data into database.
        db.users.insert(user, function (error, result) {
            if (error) {
                promise.fulfill([error]);
            } else if (result[0]) {
                // return.
                promise.fulfill(result[0]);

                // default message
                var authorId = result[0]._id.toString();
                var authorName = result[0].email.split('@')[0];

                db.posts.insert({
                    authorId: authorId,
                    authorName: authorName,
                    status: 'Welcome, ' + authorName ,
                    regdate: Date.now(),
                    replies: []
                });
            } else {
                promise.fulfill(['An error has been occured.']);
            }
        });

        // return.
        return promise;
    });
    auth.registerSuccessRedirect('/');

    // login setting
    auth.loginView('login');
    auth.getLoginPath('/login');
    auth.postLoginPath('/login')
    auth.authenticate(function (email, password) {
        // assigning variable.
        var promise = this.Promise();
        var errors = [];

        // validation.
        if (!email) errors.push('input Email.');
        if (!password) errors.push('input password.');
        if (errors.length) {
            return errors;
        }

        // requesting data from database.
        db.users.findOne({
            email: email,
            password: password
        }, function (error, user) {
            if (error) {
                promise.fulfill(['An error has been occured.']);
            } else if (user) {
                promise.fulfill(user);
            } else {
                promise.fulfill(['Either password or Email address is wrong.']);
            }
        });

        // return.
        return promise;

    });
    auth.loginSuccessRedirect('/');
};