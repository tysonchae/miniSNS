exports.active = function (app, db, sockets) {
    // only for test
    app.get('/users', function (request, response) {
        //performing database request
        db.users.find( function (error, data) {
            // response.
            response.json(data);
        });
    });

    app.get('/user', function (request, response) {
        if (request.user) {
            db.users.find({
                _id: []
            });
            response.json(request.user);
        } else {
            response.json({
                code: 1,
                message: 'You are not logged in now.'
            }, 400);
        }
    });

    //search
    app.get('/search/:query', function (request, response) {
        if (request.user) {
            // assigning variable.
            var query = request.param('query');
            
            // performing database request.
            db.users.find({
                email: new RegExp('.*' + query + '.*')
            }, {
                _id: true,
                email: true
            }, function (error, results) {
                // create data.
                var output = {
                    acceptFriends: [],
                    pendingFriends: [],
                    requestFriends: [],
                    other: []
                };
                results.forEach(function (item) {
                    if (request.user.acceptFriends.indexOf(item._id.toString()) != -1) {
                        //current Friend
                        output.acceptFriends.push(item);
                    } else if (request.user.pendingFriends.indexOf(item._id.toString()) != -1) {
                        //pending friend
                        output.pendingFriends.push(item);
                    } else if (request.user.requestFriends.indexOf(item._id.toString()) != -1) {
                        //requesting friend
                        output.requestFriends.push(item);
                    } else if (request.user._id.toString() != item._id.toString()) {
                        output.other.push(item);
                    }
                });

                // response
                response.json(output);
            });
        } else {
            response.json({
                code: 1,
                message: 'You are not logged in now.'
            }, 400);
        }
    });

    app.get('/friends/request/:id', function (request, response) {
        if (request.user) {
            // assigning variable
            var otherId = request.param('id');

            if (request.user._id.toString() == otherId) {
                response.json({
                    code: 5,
                    message: 'Cannot request friend to yourself.'
                }, 400);
            } else if(request.user.requestFriends.contain(otherId)) {
                // 에러 응답
                response.json({
                    code: 6,
                    message: 'Already sent friend request.'
                }, 400);
            } else {
                // retrieve other's data.
                db.users.findOne({
                    _id: db.ObjectId(otherId)
                }, function (error, other) {
                    if (other) {
                        // checking if he/she has sent friend request.
                        var position = request.user.pendingFriends.indexOf(otherId)
                        if (position != -1) {
                            // if it is in PendingFriends array: connect as a friend.
                            request.user.pendingFriends.splice(position, 1);
                            request.user.acceptFriends.push(otherId);

                            var otherPosition = other.requestFriends.indexOf(request.user._id.toString());
                            other.requestFriends.splice(otherPosition, 1);
                            other.acceptFriends.push(request.user._id.toString());

                            // save.
                            db.users.save(request.user);
                            db.users.save(other);

                            // response.
                            response.json({
                                code: 1,
                                message: 'Became friend.'
                            });

                            // perform push request.
                            sockets.emitTo(otherId, 'message', {
                                code: 1,
                                message: 'Became friend.'
                            });
                        } else {
                            // if Not in PendingFriends Array: send friend request.
                            request.user.requestFriends.push(otherId);
                            other.pendingFriends.push(request.user._id.toString())

                            // save.
                            db.users.save(request.user);
                            db.users.save(other);

                            // response.
                            response.json({
                                code: 2,
                                message: 'Sent friend request.'
                            });

                            // perform push request.
                            sockets.emitTo(otherId, 'message', {
                                code: 2,
                                message: 'Friend request completed'
                            });
                        }
                    } else {
                        response.json({
                            code: 7,
                            message: 'Not existing person.'
                        }, 400);
                    }
                });
            }
        } else {
            response.json({
                code: 1,
                message: 'You are not logged in now.'
            }, 400);
        }
    });
};