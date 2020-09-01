import express from 'express';
import { accountModel } from '../models/accountModel.js';

const app = express();

//Endpoint para registrar um deposito em uma conta
app.put('/deposit/:agencia/:conta/:deposito', async (req, res) => {
    try {
        const agency = req.params.agencia;
        const account = req.params.conta;
        const deposit = req.params.deposito;

        if (deposit > 0) {
            const data = await accountModel.findOneAndUpdate({ agencia: agency, conta: account }, { $inc: { balance: deposit } }, { new: true });

            res.status(200).send(data);
        } else {
            res.status(500).send("Impossivel depositar valor especificado.");
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

//Endpoint para registrar um saque em uma conta
app.put('/withdraw/:agencia/:conta/:valor', async (req, res) => {
    try {
        const agency = req.params.agencia;
        const account = req.params.conta;
        const value = +req.params.valor;

        let data = await accountModel.find({ agencia: agency, conta: account });

        if (data.length !== 0) {
            if (data[0].balance >= value) {
                const newBalance = data[0].balance - (value + 1);
                data = await accountModel.findOneAndUpdate({ agencia: agency, conta: account }, { $set: { balance: newBalance } }, { new: true });

                res.status(200).send(data);
            } else {
                res.status(500).send("Impossivel sacar valor especificado, saldo insuficiente.");
            }
        } else {
            res.status(404).send("Agencia ou Conta inexistente");
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

//Endpoint para consultar o saldo da conta
app.get('/saldo/:agencia/:conta', async (req, res) => {
    try {
        const agency = req.params.agencia;
        const account = req.params.conta;

        const data = await accountModel.find({ agencia: agency, conta: account });

        if (data.length === 0) {
            res.status(404).send("Agencia ou Conta inexistente");
        } else {
            res.status(200).send(data);
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

//Endpoint para excluir uma conta
app.delete('/:agencia/:conta', async (req, res) => {
    try {
        const agency = req.params.agencia;
        const account = req.params.conta;

        let data = await accountModel.deleteOne({ agencia: agency, conta: account });
        data = await accountModel.find({ agencia: agency });

        res.send(`${data.length}`);
    } catch (error) {
        res.status(500).send(error);
    }
});

//Endpoint para realizar transferencias entre contas
app.put('/transference/:contaOrigem/:contaDestino/:valor', async (req, res) => {
    try {
        const originAccount = req.params.contaOrigem;
        const destinationAccount = req.params.contaDestino;
        const value = +req.params.valor;

        let dataOrigin = await accountModel.find({ conta: originAccount });
        let dataDestination = await accountModel.find({ conta: destinationAccount });

        // console.log(dataOrigin);
        // console.log(dataDestination);

        if (dataOrigin.length !== 0 && dataDestination.length !== 0) {
            if (dataOrigin[0].agencia === dataDestination[0].agencia) {
                //Mesma agencia = sem tarifa
                if (dataOrigin[0].balance >= value) {
                    const newOriginBalance = dataOrigin[0].balance - value;
                    const newDestinationBalance = dataDestination[0].balance + value;

                    dataOrigin = await accountModel.findOneAndUpdate({ conta: originAccount }, { $set: { balance: newOriginBalance } }, { new: true });
                    dataDestination = await accountModel.findOneAndUpdate({ conta: destinationAccount }, { $set: { balance: newDestinationBalance } }, { new: true });

                    res.status(200).send(dataOrigin);
                } else {
                    res.status(500).send("Impossivel transferir valor especificado, saldo insuficiente.");
                }
            } else {
                //Agencias diferentes = 8 reais de tarifa
                if (dataOrigin[0].balance >= (value + 8)) {
                    const newOriginBalance = dataOrigin[0].balance - (value + 8);
                    const newDestinationBalance = dataDestination[0].balance + value;

                    dataOrigin = await accountModel.findOneAndUpdate({ conta: originAccount }, { $set: { balance: newOriginBalance } }, { new: true });
                    dataDestination = await accountModel.findOneAndUpdate({ conta: destinationAccount }, { $set: { balance: newDestinationBalance } }, { new: true });

                    res.status(200).send(dataOrigin);
                } else {
                    res.status(500).send("Impossivel transferir valor especificado, saldo insuficiente.");
                }
            }
        } else {
            res.status(404).send("Uma das contas informadas nao existe.");
        }

    } catch (error) {
        res.status(500).send(error);
    }
});

//Endpoint para consultar a media do saldo dos clientes de determinada agencia
app.get('/media/:agencia', async (req, res) => {
    try {
        const agency = req.params.agencia;

        const data = await accountModel.find({ agencia: agency });

        if(data.length !== 0){

            let media = data.reduce((acc, cur) => {
                return acc + cur.balance;
            }, 0);
            
            media = (media / data.length).toFixed(2);
            
            res.send(`Media: ${media}`);
        }else {
            res.status(500).send("Agencia inexistente");
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

//Endpoint para consultar os clientes com o menor saldo em conta
app.get('/pobres/:quantidade', async(req, res) => {
    const count = +req.params.quantidade;

    const data = await accountModel.find({}, {_id: 0, name: 0}).sort({balance: 1}).limit(count);

    res.send(data);
});

//Endpoint para consultar os clientes mais ricos do banco
app.get('/burgueses/:quantidade', async(req, res) => {
    const count = +req.params.quantidade;

    const data = await accountModel.find({}, {_id: 0}).sort({balance: -1, name: 1}).limit(count);

    res.send(data);
});

//Endpoint que ira transferir o cliente com maior saldo em conta de cada agencia para a agencia private agencia=99
app.put('/vip', async (req, res) => {
    const agencies = await accountModel.distinct("agencia");

    agencies.forEach(async agency => {
        let data = await accountModel.find({agencia: agency});
        let maior = data[0].balance;
        let account = data[0].conta;

        for(let i=0;i<data.length;i++){
            if(data[i].balance > maior) {
                maior = data[i].balance;
                account = data[i].conta;
            }
        }

        data = await accountModel.findOneAndUpdate({agencia: agency, conta: account}, {$set: {agencia: 99}});
    });

    const data = await accountModel.find({agencia: 99});
    res.send(data);
});

export { app as accountRouter };