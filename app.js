/*
 *  how to run this:
 *      > $DEBUG=3v3-front:*; npm start (using powershell)
 */

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var hbs = require('express-handlebars');

var httpLogger = require('./a/httpLogger').httpLogger;

var indexRouter = require('./routes/index');



var app = express();

// view engine
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'default',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, "views"));

// (custom) logging
app.use(httpLogger);

// parsing
app.use(express.json()); // parse json type requests
app.use(express.urlencoded({extended: false})); // parse application/x-www-form-urlencoded type requests (only POST)
app.use(cookieParser()); // parse cookies

// public
app.use(express.static(path.join(__dirname, 'public'))); // routes public files

// (custom) session handling
app.use(function(req, res, next) {req.locals = {}; next()});

// routing
app.use('/', indexRouter); // routes web?

// errors
app.use(function(req, res, next) { // creates 404 and forward to error handler (only none of the app.use doesn't above doesn't end req/res? cycle (*routers*))
    next(createError(404));
});

app.use(function(err, req, res, next) { // handles error
    // set locals (locals can be used in templates)
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);

    res.render('error', {notDisplayAccount: true});
});

module.exports = app;