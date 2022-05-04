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
    email: Joi.string().pattern(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/gi).required(),
    password: Joi.string().min(3).required()
});
app.post('/register', async (req, res) => {
    let body = req.body;
    let { error, value } = registerSchema.validate(body);
    if(error == undefined){
        try{
            
        } catch(e){
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(422);
    }
});