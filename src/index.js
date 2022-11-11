const express = require("express");

// V4 gera numeros aleatorios (otimo para um id)
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

//"banco de dados" temporario
const custumers = [];

app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    //some() faz uma busca e verifica o que foi especificado dentro dos parenteses
    //funcao utilizada para verificar se uma conta ja existe com o cpf fornecido pelo usuario
    const custumerAlreadyExists = custumers.some(
        (custumer) => custumer.cpf === cpf
    );

    if(custumerAlreadyExists) {
        return response.status(400).json({ error: "Customer already exists" });
    }

    custumers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });
    return response.status(201).send();
});

app.listen(3333);