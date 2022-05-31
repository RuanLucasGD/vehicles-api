const { MongoClient } = require ("mongodb");
const uri = "mongodb://localhost:27017/"
const cliente = new MongoClient(uri)

async function connect(){
    if(global.db){
        return global.db;
    }

    const conn = await cliente.connect();
    if(!conn){
        return new Error("Não foi possivel conectar!");
    }else{
        console.log("Conectado!")
    }
    global.db = conn.db("mydb")
    return global.db
}

module.exports = { connect }