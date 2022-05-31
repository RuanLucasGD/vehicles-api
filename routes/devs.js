//const { ObjectID } = require('bson');
const { response } = require('express');
var express = require('express');
var router = express.Router();
const db = require('../db.js');
ObjectID = require('mongodb').ObjectID;
const properties = ["name", "_id", "games"];

//retorna todos os games de uma dev
router.get('/:_id/games', async function (req, res, next) {
  const conn = await db.connect();
  const games = await conn.collection("games");
  const _id = req.params._id
  console.log(_id);
  const docs = await games.find({ dev: _id }).toArray();
  res.json(docs);
});

/* GET dev listing */
router.get('/', function (req, res, next) {
  db.connect()
    .then(conn => {
      const devs = conn.collection("devs");
      return devs.find({}).toArray();
    })
    .then(docs => {
      console.log(docs);
      res.json(docs);
    });
});

router.get('/:_id', async function (req, res, next) {
  const conn = await db.connect();
  const devs = await conn.collection("devs");
  const _id = req.params._id;
  const doc = await devs.findOne({ _id: ObjectID(_id) });
  res.json(doc);
});

router.post('/', async function (req, res, next) {

  const conn = await db.connect();
  const devs = await conn.collection("devs");


  const devData = Object.assign(req.body, { games: [] });
  const response = await devs.insertMany([devData]);

  res.status(201); //recurso criado
  res.send(response);
});

router.delete('/:_id', async function (req, res) {
  const conn = await db.connect();
  const devs = await conn.collection("devs");
  const _id = req.params._id;
  const response = await devs.deleteOne({ _id: ObjectID(_id) });
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
  const devs = await conn.collection("devs");
  const response = await devs.remove({});
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
  const devs = conn.collection("devs");
  let responses = []
  for (let document of documents) {
    let _id = document._id;
    delete document._id;
    const values = { $set: document };
    console.log(values);
    const query = { _id: ObjectID(_id) };
    const response = await devs.updateOne(query, values);
    responses.push(response)
  }

  resp.send(responses);

});

router.put("/:_id", async function (req, res) {
  const conn = await db.connect();
  const devs = conn.collection("devs");
  const _id = req.params._id;
  const query = { _id: ObjectID(_id) };
  const undefinedProperties = [];
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
  const response = await devs.updateOne(query, values);
  res.send(response);
});

//autenticação
//atualização
//exclusão
//relacionamentos

module.exports = router;
