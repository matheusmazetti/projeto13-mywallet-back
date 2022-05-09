import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import Joi from "joi";
import dayjs from "dayjs";

dotenv.config();

let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);

const taskSchema = Joi.object({
    email: Joi.string().email().required(),
    token: Joi.string().min(1).required(),
    name: Joi.string().min(1).required(),
    type: Joi.any().valid("entrada", "saida").required(),
    value: Joi.number().required()
});

export async function postTask(req, res){
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
}