var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require("client-sessions");

var routes = require('./routes/index');
var conf = require('./_config');
var app = express();
var env = process.argv[2] || process.env.NODE_ENV || 'production';
app.set('env', env);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// LOGIN+
app.use(session({
    cookieName: 'session',
    secret: 'the world secret',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));
app.all(conf.adminUrl + '/*', function (req, res, next) {
    if (req.session.user) {
        next();
    } else {
        if (req.path === conf.adminUrl + '/enter') {
            next();
        } else {
            res.redirect(conf.adminUrl + '/enter');
        }
    }
});

app.get(conf.adminUrl, function (req, res) {
    if (req.session.user) {
        res.render('admin', {version: conf.version, adminUrl: conf.adminUrl});
    } else {
        res.render('login', {adminUrl: conf.adminUrl});
    }
});
// LOGIN-
app.get('/', function (req, res) {
    res.render('index', {contactEmail: conf.contactEmail, googleAnalytics: conf.googleAnalytics});
});
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    console.log('__Express server in development mode!');
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
    livereload = require('livereload');
    server = livereload.createServer();
    server.watch(__dirname + "/public");
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


app.set('port', conf.serverPort || 2000);

var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + server.address().port);
});
