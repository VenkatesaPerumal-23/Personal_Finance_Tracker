const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Transaction = require('./models/transactions');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://Venkatesaperumal:siZyp0TIvmCCwSYR@cluster0.6jcnhtc.mongodb.net/financeDB?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.get('/api/transactions', async (req, res) => {
  const transactions = await Transaction.find().sort({ date: -1 });
  res.json(transactions);
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, date, description, category } = req.body;
    if (!amount || !date || !description || !category) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const transaction = new Transaction({ amount, date, description, category });
    await transaction.save();
    console.log('Transaction saved:', transaction);
    res.status(201).json(transaction);
  } catch (err) {
    console.error('Error saving transaction:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/api/transactions/:id', async (req, res) => {
  const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete('/api/transactions/:id', async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

app.listen(5000, () => console.log('Backend server running on https://personal-finance-tracker-egig.onrender.com'));
