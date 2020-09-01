import express from 'express';
import mongoose from 'mongoose';
import { accountRouter } from './routes/accountRouter.js';
import dotenv from 'dotenv';

dotenv.config();

//Conectar ao MongoDB pelo mongoose
(async () => {
        try {
            await mongoose.connect(`mongodb+srv://${process.env.USERDB}:${process.env.PWDDB}@cluster0.0nzqc.gcp.mongodb.net/bank?retryWrites=true&w=majority`, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false
            });
            console.log("Conectado ao MongoDB com sucesso.");
        } catch (err) {
            console.log("Erro ao conectar ao MongoDB: " + err);
        }
    })();

const app = express();

app.use(express.json());
app.use('/account', accountRouter);

app.listen(process.env.PORT, () => console.log("API Started"));
