Korištene tehnologije: 
express.js framework za node.js
za komunikaciju s mongodb bazom na virtualnom računalu korišten modul mongodb (http://mongodb.github.io/node-mongodb-native/)
Za prikaz sadržaja bootstrap i ejs template engine

Aplikacija se pokreće pozicioniranjem u korijenski direktorij i izvršavanjem naredbi: 
npm install - dohvaćanje svih dependencija
npm start - pokretanje

Prikaz vijesti ostvaren je kao servis gdje se pomoću ajaxa dohvaća json zapis podataka i dinamički generira izgled stranice.
Fotografije su spremljene u mongodb bazu pomoću gridFS sustava, odnosno naredbom mongofiles.
Svi podaci u bazi su uneseni pomoću mongo shella u terminalu.
Podaci su u bazi news. Članci se nalaze u kolekciji entries.
Map reduce upiti izvršavaju se pristupanjem url-u /mapreduce/comments odnosno /mapreduce/authors gdje se mapreduce upit izvršava u express
kontroleru i odmah se generira prikaz rezultata. Rezultat je također spremljen u mongodb u kolekcijama wordCount i commentSort.