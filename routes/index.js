var express = require('express');
var router = express.Router();
var conf = require('../_config');

var Datastore = require('nedb')
    , db = new Datastore({filename: 'data/db.json', autoload: true});


router.get('/read', function (req, res) {
    // todo: add parameter of quote ID
    db.find({}).sort({_id: 1}).exec(function (err, docs) {
        res.send(docs).end();
    });
});

router.post(conf.adminUrl + '/create', function (req, res) {
    console.log('creating:', req.body);
    db.insert(req.body, function (err, newDoc) {   // Callback is optional
        res.send(newDoc);
    });
});

router.post(conf.adminUrl + '/update', function (req, res) {
    console.log('updating:', req.body);
    var id = req.body._id;
    delete req.body._id;
    db.update({_id: id}, req.body, {}, function (err, numReplaced) {
        res.send({_id:"Ok"}); // todo: redo on some more codes
    });
});

router.post(conf.adminUrl + '/delete', function (req, res) {
    console.log('deleting', req.body._id);
    db.remove({_id: req.body._id}, req.query, function (err, numRemoved) {
        res.send({_id: "Ok", err: err});
    });
});

router.post(conf.adminUrl + '/db/compact', function (req, res) {
    console.log('compacting DB');
    db.persistence.compactDatafile();
    res.send({code: "Ok"});
});

router.get(conf.adminUrl + '/db/export', function (req, res) {
    console.log('compacting DB');
    db.persistence.compactDatafile();
    res.send({code: "Ok"});
});

// LOGIN+
router.get(conf.adminUrl + '/enter', function (req, res) {
    res.render('login', {adminUrl: conf.adminUrl});
});
router.post(conf.adminUrl + '/enter', function (req, res) {
    console.log('Do login', req.body);
    var login = req.body.login;
    var pwd = req.body.password;
    if (login === conf.login && pwd === conf.pwd) { // root )
        req.session.user = req.body.login;
        res.redirect(conf.adminUrl);
    } else {
        res.render('login', {});
    }
});
router.get(conf.adminUrl + '/logout', function (req, res) {
    console.log('Do logout');
    req.session.destroy();
    res.render('login', {adminUrl: conf.adminUrl});
});
// LOGIN-


module.exports = router;
