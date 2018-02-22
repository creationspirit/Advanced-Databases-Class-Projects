var express = require('express');
var router = express.Router();
const db = require('../db/database')
const path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/search', function(req, res, next){
  res.render('search');
});

router.get('/analysis', function(req, res, next){
  res.render('analysis');
});

router.post('/movies', (req, res, next) => {
  
  const data = req.body;
  errors = {};
  if(typeof(data.title) === "undefined" || data.title == "") errors.title = "Title is required";
  if(typeof(data.categories) === "undefined" || data.categories == "") errors.categories = "Category is required";
  if(typeof(data.summary) === "undefined" || data.summary == "") errors.summary = "Summary is required";
  if(typeof(data.description) === "undefined" || data.description == "") errors.description = "Description is required";
  
  if(Object.keys(errors).length != 0) return res.json({success: false, errors: errors});
  
  const query = "INSERT INTO movie(title, categories, summary, description) VALUES($1, $2, $3, $4)";
  const parameters = [data.title, data.categories, data.summary, data.description];
   
  db.query(query, parameters, (err, response) => {
    if(err) {
      console.log(err);
      return res.status(500).json({success: false, err: err});
    }
    return res.status(201).json({success: true, message: "Movie successfully added into database"})
  });
});

router.post('/search', (req, res, next) => {
  
  const data = req.body;
  if(typeof(data.text) === undefined || data.text == "") return res.json({success: false, text: "Search input is required"});

  let tokens = [].concat.apply([], data.text.split('"').map(function(v,i){
     return i%2 ? v : v.split(' ')
  })).filter(Boolean);

  let logic_phrases = [];
  tokens.forEach( function(s) {
      if(s.indexOf(" ") >= 0) {
        logic_phrases.push("(" + s.split(" ").join(" & ") + ")");
      } else  logic_phrases.push(s);
  });

  let query_string;
  if(data.type === "AND") query_string = logic_phrases.join(" & ");
  else query_string = logic_phrases.join(" | ");

  let where_queries = [];
    logic_phrases.forEach( function(s){
      where_queries.push("alltsv @@ to_tsquery('english', '"+ s + "')")
    });
  
  let where_queries_string;
  if(data.type === "AND") where_queries_string = where_queries.join("\n AND ");
  else where_queries_string = where_queries.join("\n OR ");

  let log_query;
  if(data.type === "AND") log_query = tokens.join(' & ');
  else log_query = tokens.join(' | ');

  const q =
  `SELECT ts_headline(title, to_tsquery('english', '` + query_string + `')) AS title,
          ts_headline(categories, to_tsquery('english', '` + query_string + `')) AS categories,
          ts_headline(summary, to_tsquery('english', '` + query_string + `'), 'MaxFragments=4,MaxWords=10,MinWords=3') AS summary,
          ts_rank(alltsv, to_tsquery('english', '` + query_string + `'), 1) AS rank
    FROM movie
    WHERE ` + where_queries_string + ` ORDER BY rank DESC;`;

  db.query(q, (err, response) => {
    if(err) {
      console.log(err);
      return res.status(500).json({success: false, err: err});
    } else {
        logging_q = "INSERT INTO querylog(squery, tstamp) VALUES($1, current_timestamp)";
        db.query(logging_q, [log_query], (err2, response2) => {
          if(err2) console.log(err2);
        }); 
    } return res.status(201).json({success: true, result: response.rows, query: q })
  });
});

router.post('/autocomplete/', (req, res, next) => {
  const phrase = req.body.phrase;
  const query = "SELECT title, summary, similarity(summary, $1) AS sml FROM movie WHERE similarity(summary, $1) > 0.1 ORDER BY sml DESC, summary LIMIT 5"
  db.query(query, [phrase], (err, response) => {
    if(err) {
      console.log(err);
      return res.status(500).json({success: false, err: err});
    } else res.status(201).json({result: response.rows});
  });
});

router.post('/analysis/', (req, res, next) => {
  const data = req.body;
  let temp_table;
  let pivot_design;
  let hour_query;
  let day_query;
  if(data.type === "HOUR") {
      temp_table = `CREATE TEMP TABLE IF NOT EXISTS sati (sat int) ON COMMIT DROP;
      INSERT INTO sati VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23);`;
      pivot_design = `pivotTable( querystring char(200), s00_01 int, s01_02 int, s02_03 int, s03_04 int, s04_05 int, s05_06 int, s06_07 int, s07_08 int, s08_09 int,
      s09_10 int, s10_11 int, s11_12 int, s12_13 int, s13_14 int, s14_15 int, s15_16 int, s16_17 int, s17_18 int, s18_19 int, s19_20 int, s20_21 int, s21_22 int,
      s22_23 int, s23_24 int)`;

      hour_query = `SELECT *
      FROM crosstab('SELECT CAST(squery as char(200)), CAST(EXTRACT(hour from tstamp) as INT) AS sat, COUNT(*) FROM querylog
          WHERE tstamp BETWEEN ''`+ data.from +`''::date AND ''`+ data.to +`''::date
          GROUP BY squery, sat
          ORDER BY squery, sat',
          'SELECT CAST(sat as INT) FROM sati ORDER BY sat')
        AS ` + pivot_design + ` ORDER BY querystring`;
       
    }
  else {
      let fromDate = new Date(data.from);
      let toDate = new Date(data.to);
      let dateRange = getDates(fromDate, toDate);
      temp_table = `CREATE TEMP TABLE IF NOT EXISTS dani (dan int) ON COMMIT DROP;
      INSERT INTO dani VALUES `;
      pivot_design = `pivotTable( querystring char(200)`;
      dateRange.forEach(function(d) {
        temp_table = temp_table + "(" + d.getDate() + "),";
        pivot_design = pivot_design + ", " + d.yyyymmdd() + " int";
      });
      temp_table = temp_table.slice(0, -1);
      temp_table = temp_table + ";";
      pivot_design = pivot_design + ")";

      day_query =  `SELECT *
      FROM crosstab('SELECT CAST(squery as char(200)), CAST(EXTRACT(day from tstamp) as INT) AS dan, COUNT(*) FROM querylog
          WHERE tstamp BETWEEN ''`+ data.from +`''::date AND ''`+ data.to +`''::date
          GROUP BY squery, dan
          ORDER BY squery, dan',
          'SELECT CAST(dan as INT) FROM dani ORDER BY dan')
        AS ` + pivot_design + ` ORDER BY querystring`;

  }
  let q;
  if(data.type === "HOUR") q = temp_table + hour_query;
  else q = temp_table + day_query;

  db.query({ text: q, rowMode: 'array' }, (err, response) => {
    if(err) {
      console.log(err);
      return res.status(500).json({success: false, err: err});
    } else res.status(201).json({success: true, result: response[2]});
  });

});

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1;
  var dd = this.getDate();

  return 'd' + [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

function getDates(startDate, stopDate) {
  var dateArray = new Array();
  var currentDate = startDate;
  while (currentDate <= stopDate) {
      dateArray.push(new Date (currentDate));
      currentDate = currentDate.addDays(1);
  }
  return dateArray;
}

module.exports = router;
