import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import Joi from "joi";

dotenv.config();

let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);

const getTaskSchema = Joi.object({
    email: Joi.string().email().required(),
    token: Joi.string().min(1).required()
});

export async function getTask(req, res){
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
}