const { Client } = require('pg');

const connectionString = 'postgresql://postgres:reverse@192.168.56.12:5432/Projekt1';

const client = new Client({
    connectionString: connectionString,
});
client.connect();

module.exports = {
    query: (text, params, callback) => {
      return client.query(text, params, callback)
    }
  }