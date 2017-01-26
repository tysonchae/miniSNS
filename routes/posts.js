exports.active = function (app, db, sockets) {
    app.get('/posts', function (request, response) {
        if (request.user) {
            // declaring variable.
            var count = Number(request.param('count')) || 5;
            var time = Number(request.param('time')) || Date.now();

            // create array for user searched.
            request.user.acceptFriends.push(request.user._id.toString());

            // perform database request.
            db.posts.find({
                authorId: { $in: request.user.acceptFriends },
                regdate: { $lt: time }
            }).sort({
                regdate: -1
            }).limit(count, function (error, posts) {
                // response.
                response.json(posts);
            });
        } else {
            response.json({
                code: 1,
                message: 'You are not logged in now.'
            }, 400);
        }
    });

    app.get('/postsOf/:id', function (request, response) {
        if (request.user) {
            // decalring variable.
            var id = request.param('id');
            console.log(id);
            var time = Number(request.param('time')) || Date.now();
            console.log(request.user.acceptFriends);
            if (id == request.user._id.toString() || request.user.acceptFriends.indexOf(id) != -1) {
                // performing database request.
                db.posts.find({
                    authorId: id,
                    regdate: { $lt: time }
                }).sort({
                    _id: -1
                }, function (error, post) {
                    // response.
                    response.json(post);
                });
            } else {
                response.json({
                    code: 2,
                    message: 'Not a friend.'
                }, 400);
            }
        } else {
            response.json({
                code: 1,
                message: 'You are not logged in now.'
            }, 400);
        }
    });

    app.post('/posts', function (request, response) {
        if (request.user) {
            // declaring variable.
            var authorId = request.user._id.toString();
            var authorName = request.user.email.split('@')[0];
            var status = request.param('status');
            var regdate = Date.now();

            // validation.
            if (status && (status = status.trim()) != '') {
                // performing database request.
                db.posts.insert({
                    authorId: authorId,
                    authorName: authorName,
                    status: status,
                    regdate: regdate,
                    replies: []
                }, function (error, post) {
                    // response.
                    response.json(post[0]);

                    // push.
                    request.user.acceptFriends.push(request.user._id.toString());
                    request.user.acceptFriends.forEach(function (item) {
                        sockets.emitTo(item, 'message',{
                            code: 3,
                            message: 'New message created.',
                            data: post[0]
                        });
                    });
                });
            } else {
                response.json({
                    code: 3,
                    message: 'Did not write a message.'
                }, 400);
            }
        } else {
            response.json({
                code: 1,
                message: 'You are not logged in now.'
            }, 400);
        }
    });

    /* will work for these later
    app.put('/posts', function (request, response) { });
    app.del('/posts', function (request, response) { });
    */
};