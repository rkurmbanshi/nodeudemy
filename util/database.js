const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = callback => {
 
  MongoClient.connect(
    'mongodb://root:admin@cluster0-shard-00-00-rztzf.mongodb.net:27017,cluster0-shard-00-01-rztzf.mongodb.net:27017,cluster0-shard-00-02-rztzf.mongodb.net:27017/shop?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority'
    //'mongodb+srv://root:admin@cluster0-rztzf.mongodb.net/shop?retryWrites=true&w=majority'
    )
    .then(client => {
      console.log('Connected!');
      _db=client.db();
      callback();
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
};

const getDb=()=>{
    if(_db){
        return _db;
    }
    throw 'No dataabse found';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
  


