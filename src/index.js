const { response } = require("express");
const express = require("express");

// V4 gera numeros aleatorios (otimo para um id)
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

//"banco de dados" temporario
const customers = [];

app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    //some() faz uma busca e verifica o que foi especificado dentro dos parenteses
    //funcao utilizada para verificar se uma conta ja existe com o cpf fornecido pelo usuario
    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if(customerAlreadyExists) {
        return response.status(400).json({ error: "Customer already exists" });
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });
    return response.status(201).send();
});

app.get("/statement", (request, response) => {
    const { cpf } = request.headers;

    //find pode ser utilizado quando queremos o valor do que esta sendo buscado
    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return response.status(400).json({ error: "Customer not found" });
    };

    return response.json(customer.statement);
});

app.listen(3333);