import express from "express";

import { login } from "./login.js";
import { register } from "./register.js";
import { postTask } from "./postTask.js";
import { getTask } from "./getTask.js";

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/task', postTask);
router.get('/task', getTask);
export default router;