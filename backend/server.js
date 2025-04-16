const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Transaction = require('./models/transaction');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://venkatesaperumal:7305723573@cluster0.6jcnhtc.mongodb.net/financeDB?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.get('/api/transactions', async (req, res) => {
  const transactions = await Transaction.find().sort({ date: -1 });
  res.json(transactions);
});

app.post('/api/transactions', async (req, res) => {
  const transaction = new Transaction(req.body);
  await transaction.save();
  res.status(201).json(transaction);
});

app.put('/api/transactions/:id', async (req, res) => {
  const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete('/api/transactions/:id', async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

app.listen(5000, () => console.log('Backend server running on http://localhost:5000'));
