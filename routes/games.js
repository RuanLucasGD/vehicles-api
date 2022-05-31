const { response } = require('express');
var express = require('express');
const { ObjectId } = require('mongodb');
var router = express.Router();
const db = require('../db.js');
ObjectID = require('mongodb').ObjectID;

const properties = ["name", "gender", "metascore", "userscore", "_id", "dev_id"];

/* GET users listing. */
router.get('/', async function (req, res, next) {
  const conn = await db.connect();
  const games = conn.collection("games");

  let docs = await games.find({}).toArray();
  docs = docs.map((doc) => {
    doc["dev_url"] = `dev/${doc.dev}/`
    return doc
  });
  res.json(docs);
});

router.get('/:_id', async function (req, res, next) {
  const conn = await db.connect();
  const games = await conn.collection("games");
  const _id = req.params._id;
  const doc = await games.findOne({ _id: ObjectID(_id) });
  res.json(doc);
});

router.post('/', async function (req, res, next) {
  var conn = await db.connect();
  var games = await conn.collection("games");

  const devs = conn.collection("devs");
  const devs_docs = await devs.find({}).toArray();

  var reqDev = req.body[0];
  var reqDevName = reqDev.dev;
  var devOfGame = await devs_docs.find((obj) => {return obj.name === reqDevName})
  console.log(devOfGame)
  var devId = devOfGame._id.toString();



  var gameData = [{

    name: req.body[0].name,
    metascore: req.body[0].metascore,
    userscore: req.body[0].userscore,
    dev_id: devId
  }];

  const response = await games.insertMany(gameData);

  const devGames = devOfGame.games;
  devGames.push(response.insertedIds[0]);
  console.log(devId);

  devs.updateOne({ _id: new ObjectId(devId) }, { $set: { games: devGames } })

  res.status(201); //recurso criado
  res.send(response);
});

router.delete('/:_id', async function (req, res) {
  const conn = await db.connect();
  const games = await conn.collection("games");
  const _id = req.params._id;
  const response = await games.deleteOne({ _id: ObjectID(_id) });

  if (response.deletedCount == 0) {
    res.status(404);
    res.send();
  } else {
    res.status(200);
    res.send(response);
  }
});

router.delete('/', async function (req, res) {
  const conn = await db.connect();
  const games = await conn.collection("games");
  const response = await games.deleteMany({})
  if (response.deletedCount == 0) {
    res.status(404);
    res.send();
  } else {
    res.status(200);
    res.send(response);
  }
});


router.put("/", async (req, resp) => {
  const documents = req.body;

  for (let document of documents) {
    if (!("_id" in document)) {
      const response = { message: "Missing required _id property." }
      resp.status(400);
      resp.send(response);
      return
    }
  }

  const undefinedProperties = {};
  for (let document of documents) {
    for (let prop in document) {
      if (!properties.includes(prop)) {
        if (!(document._id in undefinedProperties)) {
          undefinedProperties[document._id] = [];
        }
        undefinedProperties[document._id].push(prop);
      }
    }
  }
  if (Object.entries(undefinedProperties).length > 0) {
    resp.status(400);
    resp.send({ msg: "Invalid properties", properties: undefinedProperties });
    return
  }

  const conn = await db.connect();
  const games = conn.collection("games");
  let responses = []
  for (let document of documents) {
    let _id = document._id;
    delete document._id;
    const values = { $set: document };
    console.log(values);
    const query = { _id: ObjectID(_id) };
    const response = await games.updateOne(query, values);
    responses.push(response)
  }

  resp.send(responses);

});

router.put("/:_id", async function (req, res) {
  const conn = await db.connect();
  const games = conn.collection("games");
  const _id = req.params._id;
  const query = { _id: ObjectID(_id) };
  const undefinedProperties = [];

  console.log(properties)

  for (let prop in req.body) {
    if (!properties.includes(prop)) {
      undefinedProperties.push(prop);
    }
  }

  if (undefinedProperties.length > 0) {
    const response = { 'invalid_properties': undefinedProperties }
    res.status(400);
    res.send(response);
    return
  }

  const values = { $set: req.body }
  const response = await games.updateOne(query, values);
  res.send(response);
});

//autenticação
//atualização
//exclusão
//relacionamentos

module.exports = router;
