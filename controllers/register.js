import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import Joi from "joi";
import bcrypt from 'bcrypt';

dotenv.config();

let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);

const registerSchema = Joi.object({
    user: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(3).required()
});

export async function register(req, res){
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
};