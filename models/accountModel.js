import mongoose from 'mongoose';

//criacao do modelo
const accountSchema = mongoose.Schema({
    agencia: {
        type: Number,
        required: true
    },
    conta: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        required: true,
        min: 0
    }
});

const accountModel = mongoose.model('accounts', accountSchema, 'accounts');

export { accountModel }