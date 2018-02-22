var express = require('express');
var router = express.Router();
var db = require('../db/database');
var mongodb = require('mongodb');

router.get('/', function(req, res, next) {
    db.get().collection('entries').find().sort({date: -1}).limit(5).toArray(function (err, result) {
        if (err) return res.status(404).json({error: err});
        else return res.status(201).json(result);
      })
});

router.get('/image/:imageId', function(req, res, next) {
    res.contentType('image/jpg');
    const bucket = new mongodb.GridFSBucket(db.get());
      
      bucket.openDownloadStream(new mongodb.ObjectId(req.params.imageId)).
        pipe(res).
        on('error', function(error) {
          assert.ifError(error);
        }).
        on('finish', function() {
        });
});

router.post('/comment/:entryId', function(req, res, next) {
    const data = req.body;
    db.get().collection('entries')
        .updateOne({_id : new mongodb.ObjectId(req.params.entryId)}, {$push: {comments: data}}, function(err, result) {
            if (err) return res.status(404).json({error: err});
            else return res.status(201).json(result);
        });
});

module.exports = router;
