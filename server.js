let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let assignment = require('./routes/assignments');

let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set('debug', true);

const uri = 'mongodb+srv://ifilippova:Raspberry2%4033@cluster0.ephvplw.mongodb.net/assignments?retryWrites=true&w=majority&appName=Cluster0';
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

mongoose.connect(uri, options)
  .then(() => {
    console.log("Connecté à la base MongoDB assignments dans le cloud !");
    console.log("at URI = " + uri);
    console.log("vérifiez with http://localhost:8010/api/assignments que cela fonctionne")
    },
    err => {
      console.log('Erreur de connexion: ', err.message);
      console.log('URI utilisé: ', uri);
    });

// Pour accepter les connexions cross-domain (CORS)
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// Pour les formulaires
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

let port = process.env.PORT || 8010;

// ⭐ CORRECTION: UTILISER LE ROUTER DIRECTEMENT
const prefix = '/api';
app.use(prefix, assignment);

app.get('/', (req, res) => {
  res.json({ 
    message: 'API Assignments est en ligne!',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// On démarre le serveur
app.listen(port, "0.0.0.0");
console.log('Serveur démarré sur http://localhost:' + port);

module.exports = app;

mongoose.connect(uri, options)
  .then(() => {
    console.log("✅ Connecté à MongoDB avec succès!");
    console.log("✅ Base de données:", mongoose.connection.db.databaseName);
    
    // Lister toutes коллекции
    mongoose.connection.db.listCollections().toArray()
      .then(collections => {
        console.log("📁 Collections dans la base:", collections.map(c => c.name));
      });
  })
  .catch(err => {
    console.log('❌ Erreur de connexion MongoDB:', err.message);
  });