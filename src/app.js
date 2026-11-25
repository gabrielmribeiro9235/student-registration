import express from "express";
import bcrypt from "bcryptjs";

const users = [];
const students = [];

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).send("Rota raiz");
});

app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({
        username,
        password: hashedPassword
    });

    res.status(201).json( { message: "Usuário registrado" } );
});

export default app;