import express from "express";
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import Joi from "joi";
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';
import dayjs from "dayjs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);

const registerSchema = Joi.object({
    user: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(3).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(3).required()
});

const taskSchema = Joi.object({
    email: Joi.string().email().required(),
    token: Joi.string().min(1).required(),
    name: Joi.string().min(1).required(),
    type: Joi.any().valid("entrada", "saida").required(),
    value: Joi.number().required()
});

const getTaskSchema = Joi.object({
    email: Joi.string().email().required(),
    token: Joi.string().min(1).required()
});

app.post('/register', async (req, res) => {
    let body = req.body;
    let { error } = registerSchema.validate(body);
    if(error == undefined){
        let registerObj = {
            user: body.user,
            email: body.email,
            password: bcrypt.hashSync(body.password, 10)
        };
        try{
            await mongoClient.connect();
            db = mongoClient.db('mywallet');
            let validation = await db.collection('users').find({email: body.email}).toArray();
            if(validation.length == 0){
                await db.collection('users').insertOne(registerObj);
                res.sendStatus(201);
                mongoClient.close();
            } else {
                res.sendStatus(409);
            }
        } catch(e){
            console.log(e);
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
            let validation = await db.collection('users').find({email: body.email}).toArray();
            if(validation != 0){
                if(bcrypt.compareSync(body.password, validation[0].password)){
                    let sessionObj = {
                        email: body.email,
                        user: validation[0].user,
                        token: uuid()
                    };
                    let active = await db.collection('sessions').find({email: sessionObj.email}).toArray();
                    if(active.length == 0){
                        await db.collection('sessions').insertOne(sessionObj);
                        res.send(sessionObj);
                        mongoClient.close();
                    } else {
                        await db.collection('sessions').updateOne({email: sessionObj.email}, { $set: {token: sessionObj.token}});
                        res.send(sessionObj);
                        mongoClient.close();
                    }
                } else {
                    res.sendStatus(401);
                    mongoClient.close();
                }                
            } else {
                res.sendStatus(401);
                mongoClient.close();
            }
        } catch(e){
            console.log(e);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(422);
    }
});

app.post('/task', async (req, res) => {
    let body = req.body;
    let now = dayjs();
    let { error } = taskSchema.validate(body);
    if(error == undefined){
        try{
            await mongoClient.connect();
            db = mongoClient.db('mywallet');
            let user = await db.collection('sessions').find({email: body.email}).toArray();
            if(user.length != 0){
                if(user[0].token == body.token){
                    let taskObj ={
                        email: body.email,
                        name: body.name,
                        type: body.type,
                        value: body.value,
                        date: now.format('DD/MM') 
                    };
                    await db.collection('tasks').insertOne(taskObj);
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
            let validation = await db.collection('sessions').find({email: body.email}).toArray();
            if(validation.length != 0){
                if(validation[0].token == body.token){
                    let userTasks = await db.collection('tasks').find({email: body.email}).toArray();
                    if(userTasks.length != 0){
                        res.send(userTasks);
                        mongoClient.close();
                    } else {
                        res.sendStatus(404);
                        mongoClient.close();
                    }
                } else {
                    res.sendStatus(401);
                    mongoClient.close();
                }
            } else {
                res.sendStatus(401);
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