import express from "express";
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import Joi from "joi";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);

const registerSchema = Joi.object({
    user: Joi.string().min(3).required(),
    email: Joi.string().required(),
    password: Joi.string().min(3).required()
});

const loginSchema = Joi.object({
    user: Joi.string().min(1).required(),
    password: Joi.string().min(3).required()
});

const taskSchema = Joi.object({
    user: Joi.string().min(1).required(),
    token: Joi.string().min(1).required(),
    type: Joi.any().valid('entrada', 'saida').required(),
    value: Joi.number().required()
});

const getTaskSchema = Joi.object({
    user: Joi.string().min(1).required(),
    token: Joi.string().min(1).required()
});

app.post('/register', async (req, res) => {
    let body = req.body;
    let { error } = registerSchema.validate(body);
    if(error == undefined){
        try{
            await mongoClient.connect();
            db = mongoClient.db('mywallet');
            await db.collection('users').insertOne(body);
            res.sendStatus(201);
            mongoClient.close();
        } catch(e){
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(422);
    }
});

app.post('/login', async (req, res) => {
    let body = req.body;
    let { error } = loginSchema.validate(body);
    if(error == undefined){
        try{
            await mongoClient.connect();
            db = mongoClient.db('mywallet');
            let user = await db.collection('users').find({user: body.user}).toArray();
            if(user.length != 0){
                if(body.password == user[0].password){
                    res.sendStatus(200);
                    mongoClient.close();
                } else {
                    res.sendStatus(401);
                    mongoClient.close();
                }                
            } else {
                res.sendStatus(404);
                mongoClient.close();
            }
        } catch(e){
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(422);
    }
});

app.post('/task', async (req, res) => {
    let body = req.body;
    let { error } = taskSchema.validate(body);
    if(error == undefined){
        try{
            await mongoClient.connect();
            db = mongoClient.db('mywallet');
            let user = await db.collection('users').find({user: body.user}).toArray();
            if(user.length != 0){
                if(user[0].token == body.token){
                    await db.collection('tasks').insertOne(body);
                    res.sendStatus(201);
                    mongoClient.close();
                } else {
                    res.sendStatus(401);
                    mongoClient.close();
                }
            } else {
                res.sendStatus(404);
                mongoClient.close();
            }
        } catch(e){
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(422);
    }
});

app.get('/task', async (req, res) => {
    let body = req.body;
    let { error } = getTaskSchema.validate(body);
    if(error == undefined){
        try{
            await mongoClient.connect();
            db = mongoClient.db('mywallet');
            let userTasks = await db.collection('tasks').find({user: user.body}).toArray();
            if(userTasks.length != 0){
                res.send(userTasks);
                mongoClient.close();
            } else {
                res.sendStatus(404);
                mongoClient.close();
            }
        } catch(e) {
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(422);
    }
});

app.listen(5000);