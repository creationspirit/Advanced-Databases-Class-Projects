var express = require('express');
var router = express.Router();
var db = require('../db/database');
var mongodb = require('mongodb');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/mapreduce/comments', function(req, res, next) {
  
  var map = function() {
    emit(this.naslov, this.comments.length);
   };
  
  var reduce = function(key, values) {
    return Array.sum(values)
  }; 
  
  db.get().collection('entries').mapReduce(map, reduce, { out: "commentSort"}, function(err, collection) {
    if(err) return res.status(500).json({error: err});
    else {
      collection.find().sort({value: -1}).toArray(function (err, result) {
        if(err) return res.status(500).json({error: err});
        else {
          console.log(result);
          return res.render('mr-komentari', {result: result});
        }
      });
    }
  });

});

router.get('/mapreduce/authors', function(req, res, next) {

  var map = function() {  
    var summary = this.sadrzaj;
    if (summary) { 
        summary = summary.toLowerCase().replace(/\.|\,|\?|\!/g, "").split(" "); 
        for (var i = summary.length - 1; i >= 0; i--) {
            if (summary[i])  {     
               emit( this.autor, {word: summary[i]});
            }
        }
    }
  };

  var reduce = function( key, values ) {    
    var count = [];    
    values.forEach(function(v) {
      var ind = false;
      for(var i = 0; i < count.length; i++) {
        if(count[i].word == v.word) {
          count[i].count += 1;
          ind = true;
        } 
      }           
      if(!ind) count.push({word: v.word, count: 1});
    });
    return {result: count};
  }

  var fin = function (key, reducedVal) {
    var final = [];
    results = reducedVal.result;
    for(var i = 0; i < 10; i++) {
      var tempIndex = 0;
      for(var j = 0; j < results.length; j++) {
        if(results[j].count > results[tempIndex].count) tempIndex = j;
      }
      final.push(results[tempIndex]);
      results.splice(tempIndex, 1);
    }
    return final;
   }; 

  var o = {};
  o.out = 'wordsCount';
  o.finalize = fin;

  db.get().collection('entries').mapReduce(map, reduce, o, function(err, collection) {
    if(err) return res.status(500).json({error: err});
    else {
      collection.find().toArray(function (err, result) {
        if(err) return res.status(500).json({error: err});
        else {
          console.log(result);
          return res.render('mr-autori', {result: result});
        }
      });
    }
  });
});

module.exports = router;
