exports.active = function (io, client, parseCookie, sessionStore) {
    io.set('authorization', function (data, accept) {
        if (data.headers.cookie) {
            //declaring variable
            var cookies = parseCookie(data.headers.cookie);
            if (cookies.session) {
                //extracting user information
                sessionStore.get(cookies.session, function (error, session) {
                    if (session && session.auth) {
                        data.userId = session.auth.userId;
                        accept(null, true);
                    } else {
                        accept('ERROR', true);
                    }
                });
            }
        } else {
            accept('ERROR', false);
        };
    });

    // setting socket sever event
    io.sockets.on('connection', function (socket) {
        // declaring variable
        var userId = socket.handshake.userId;

        // adding socket id to user
        client.lpush('sockets:' + userId, socket.id);
        socket.emit('sucecss');

        // disconnect event
        socket.on('disconnect', function () {
            // removing socket id from user : 0 means removing all.
            client.lrem('sockets:' + userId, 0, socket.id);
        });
    });

    // user define method
    io.sockets.sockets.emitTo = function (userId, name, message) {
        // perform push request.
        client.lrange('sockets:' + userId, 0, -1, function (error, data) {
            if (data) {
                console.log(data)
                data.forEach(function (item) {
                    if (io.sockets.sockets[item]) {
                        //response
                        io.sockets.sockets[item].emit(name, message);
                    }
                });
            }
        });
    };
};