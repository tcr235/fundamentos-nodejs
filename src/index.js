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

app.get("/statement/date", (request, response) => {
    //pegando a informação "customer" de dentro do request (passado pelo middleware pelo "request.customer=customer;")
    const { customer } = request;
    const { date } = request.query;
    const dateFormat = new Date(date + " 00:00"); //usado para buscar pelo dia, independente do horário da transação
    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date
    (dateFormat).toDateString());


    return response.json(statement);

});

app.put("/account", (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
});

app.get("/account", (request, response) => {
    const { customer } = request;

    return response.json(customer);
});

app.delete("/account", (request, response) => {
    const { customer } = request;

    customers.splice(customer, 1); //função usada para remover elemento de array
    //deve-se passar dois parâmetros: o primeiro é o objeto que a gente quer excluir e o segundo é até onde vai ser a remoção
    //ou seja, uma posição depois do customer.

    return response.status(200).json(customers)
});

app.get("/balance", (request, response) => {
    const { customer } = request;
    const balance = getBalance(customer.statement);

    return response.json(balance);
});

app.listen(3333);