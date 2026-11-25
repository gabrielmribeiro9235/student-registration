import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "0cad13268d74059a6d57a3f9155715519d3dbf6ed70da096370e99c6630c082389e9962ffbf0e370579d79502858dec535427f6e03daab1c78ebd701501c897e";

const authenticateJWT = (req, res, next) => {
    const authHeader = req.header("Authorization");

    let token;

    if (authHeader) {
        const parts = authHeader.split(" ");
        if (parts.length === 2) {
            token = parts[1];
        }
    }

    if (!token) {
        return res.status(401).json( { message: "Acesso negado. Token não fornecido" } );
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json( { message: "Acesso negado. Token expirado" } );
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(403).json( { message: "Acesso negado. Token inválido" } );
            } else {
                return res.status(403).json( { message: "Acesso negado. Erro na verificação do token" } );
            }
        }

        req.user = user;

        next();
    });
}

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

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json( { message: "Login incorreto" } );
    }

    const token = jwt.sign(
        { username: user.username },
        JWT_SECRET,
        { expiresIn: "1h", algorithm: "HS256" }
    );

    res.status(200).json( { token } );
});

export default app;