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
        return res.status(401).json({ message: "Acesso negado. Token não fornecido" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Acesso negado. Token expirado" });
            } else if (err.name === "JsonWebTokenError") {
                return res.status(403).json({ message: "Acesso negado. Token inválido" });
            } else {
                return res.status(403).json({ message: "Acesso negado. Erro na verificação do token" });
            }
        }

        req.user = user;

        next();
    });
};

const users = [];
const students = [
    { id: 1, nome: "Ana Silva", ra: "2024001", nota1: 8, nota2: 7 },
    { id: 2, nome: "Bruno Souza", ra: "2024002", nota1: 5, nota2: 6 },
    { id: 3, nome: "Carla Lima", ra: "2024003", nota1: 9, nota2: 8 }
];

const dadosAlunoValidos = ({ nome, ra, nota1, nota2 }) =>
    typeof nome === "string" && nome.trim() !== "" &&
    typeof ra === "string" && ra.trim() !== "" &&
    typeof nota1 === "number" && nota1 >= 0 && nota1 <= 10 &&
    typeof nota2 === "number" && nota2 >= 0 && nota2 <= 10;

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({ message: "Rota raiz" });
});

app.post("/register", async (req, res) => {
    const { username, password } = req.body || {};

    if (typeof username !== "string" || username.trim() === "" || typeof password !== "string" || password.trim() === "") {
        return res.status(400).json({ message: "Usuário e senha são obrigatórios" });
    }

    if (users.some(user => user.username === username)) {
        return res.status(409).json({ message: "Usuário já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({
        username,
        password: hashedPassword
    });

    res.status(201).json({ message: "Usuário registrado" });
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body || {};
    const user = users.find(user => user.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Login incorreto" });
    }

    const token = jwt.sign(
        { username: user.username },
        JWT_SECRET,
        { expiresIn: "1h", algorithm: "HS256" }
    );

    res.status(200).json({ token });
});

app.get("/alunos", authenticateJWT, (req, res) => {
    res.status(200).json(students);
});

app.get("/alunos/medias", authenticateJWT, (req, res) => {
    const medias = students.map(aluno => ({
        nome: aluno.nome,
        media: (aluno.nota1 + aluno.nota2) / 2
    }));

    res.status(200).json(medias);
});

app.get("/alunos/aprovados", authenticateJWT, (req, res) => {
    const aprovados = students.map(aluno => {
        const media = (aluno.nota1 + aluno.nota2) / 2;
        return {
            nome: aluno.nome,
            status: media >= 6 ? "aprovado" : "reprovado"
        };
    });

    res.status(200).json(aprovados);
});

app.get("/alunos/:id", authenticateJWT, (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ message: "ID inválido" });
    }

    const aluno = students.find(aluno => aluno.id === id);

    if (!aluno) {
        return res.status(404).json({ message: "Aluno não encontrado" });
    }

    res.status(200).json(aluno);
});

app.post("/alunos", authenticateJWT, (req, res) => {
    const { id, nome, ra, nota1, nota2 } = req.body || {};

    if (!Number.isInteger(id) || !dadosAlunoValidos({ nome, ra, nota1, nota2 })) {
        return res.status(400).json({ message: "Dados do aluno inválidos" });
    }

    if (students.some(aluno => aluno.id === id)) {
        return res.status(409).json({ message: "Já existe um aluno com esse ID" });
    }

    const aluno = { id, nome, ra, nota1, nota2 };
    students.push(aluno);

    res.status(201).json({ message: "Aluno cadastrado", aluno });
});

app.put("/alunos/:id", authenticateJWT, (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ message: "ID inválido" });
    }

    const indice = students.findIndex(aluno => aluno.id === id);

    if (indice === -1) {
        return res.status(404).json({ message: "Aluno não encontrado" });
    }

    const { nome, ra, nota1, nota2 } = req.body || {};

    if (!dadosAlunoValidos({ nome, ra, nota1, nota2 })) {
        return res.status(400).json({ message: "Dados do aluno inválidos" });
    }

    students[indice] = { id, nome, ra, nota1, nota2 };

    res.status(200).json({ message: "Aluno atualizado", aluno: students[indice] });
});

app.delete("/alunos/:id", authenticateJWT, (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ message: "ID inválido" });
    }

    const indice = students.findIndex(aluno => aluno.id === id);

    if (indice === -1) {
        return res.status(404).json({ message: "Aluno não encontrado" });
    }

    students.splice(indice, 1);

    res.status(200).json({ message: "Aluno removido" });
});

export default app;