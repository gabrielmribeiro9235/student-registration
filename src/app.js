import express from "express";

const users = [];
const students = [];

const app = express();

app.get("/", (req, res) => {
    res.status(200).send("Rota raiz");
});

export default app;