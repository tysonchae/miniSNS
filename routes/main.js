exports.active = function (app, db) {
    app.get('/', function (request, response) {
        if (request.user) {
            // when logged in
            response.render('index', {
                user: request.user
            });
        } else {
            // when user is not existed
            response.redirect('/login');
        }
    });
};