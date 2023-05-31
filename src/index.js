const { response } = require("express");
const express = require("express");

// V4 gera numeros aleatorios (otimo para um id)
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

//"banco de dados" temporario
const customers = [];

//Middleware para verificação de conta
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    //find pode ser utilizado quando queremos o valor do que esta sendo buscado
    const customer = customers.find(customer => customer.cpf === cpf);
    
    if (!customer) {
        return response.status(400).json({ error: "Customer not found" });
    };

    request.customer = customer;

    return next();
};

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => { //função para somar os valores do parâmetro passado
        if (operation.type === "credit") {
            return acc + operation.amount;
        }

        else {
            return acc - operation.amount;
        }

    }, 0);
    
    return balance;
};

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

app.use(verifyIfExistsAccountCPF);

app.get("/statement", (request, response) => {
    //pegando a informação "customer" de dentro do request (passado pelo middleware pelo "request.customer=customer;")
    const { customer } = request;

    return response.json(customer.statement);

});

app.post("/deposit", (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.post("/withdraw", (request, response) => {
    const { amount } = request.body;
    const { customer } = request;
    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({error: "Insufficient funds"});
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();

});

app.listen(3333);