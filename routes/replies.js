exports.active = function (app, db, sockets) {
    app.post('/replies/:id', function (request, response) {
        if (request.user) {
            // declaring variable.
            var postId = request.param('id');
            var authorId = request.user._id;
            var authorName = request.user.email.split('@')[0];
            var status = request.param('status');
            var regdate = Date.now();

            // validation.
            if (status && (status = status.trim()) != '') {
                 // performing database request.
                db.posts.update({
                    _id: db.ObjectId(postId)
                }, {
                    //creating reply
                    $push: {
                        replies: {
                            authorId: authorId,
                            authorName: authorName,
                            status: status,
                            regdate: regdate
                        }
                    }
                }, function (error, replies) {
                    // response.
                    response.json(replies[0]);
                    
                    // push.
                    request.user.acceptFriends.push(request.user._id.toString());
                    request.user.acceptFriends.forEach(function (item) {
                        sockets.emitTo(item, 'message', {
                            code: 4,
                            message: 'New reply created.',
                            target: postId,
                            data: {
                                authorId: authorId,
                                authorName: authorName,
                                status: status,
                                regdate: regdate
                            }
                        });
                    });
                });
            } else {
                response.json({
                    code: 4,
                    message: 'Did not write a reply.'
                }, 400);
            }
        } else {
            response.json({
                code: 1,
                message: 'You are not logged in.'
            }, 400);
        }
    });

    /* will work for these later.
    app.put('/replies/:id', function (request, response) { });
    app.del('/replies/:id', function (request, response) { });
    */
};