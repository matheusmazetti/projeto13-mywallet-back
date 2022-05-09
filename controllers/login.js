import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import Joi from "joi";
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';

dotenv.config();

let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(3).required()
});

export async function login (req, res){
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
};