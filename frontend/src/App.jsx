import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import axios from "axios";
import { Toaster, toast } from "sonner";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A", "#8800EE"];

function App() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ amount: "", date: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [isDark, setIsDark] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/transactions");
      setTransactions(res.data);
    } catch (err) {
      toast.error("Error fetching transactions");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.date || !form.description) return;

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/transactions/${editingId}`, form);
        toast.success("Transaction updated!");
        setEditingId(null);
      } else {
        await axios.post("http://localhost:5000/api/transactions", form);
        toast.success("Transaction added!");
      }

      setForm({ amount: "", date: "", description: "" });
      fetchTransactions();
    } catch (err) {
      toast.error("Error saving transaction.");
    }
  };

  const handleEdit = (txn) => {
    setForm({
      amount: txn.amount,
      date: txn.date.slice(0, 10),
      description: txn.description,
    });
    setEditingId(txn._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/transactions/${id}`);
      toast.success("Transaction deleted.");
      fetchTransactions();
    } catch (err) {
      toast.error("Error deleting transaction.");
    }
  };

  const monthlyData = Object.values(
    transactions.reduce((acc, txn) => {
      const month = new Date(txn.date).toLocaleString("default", { month: "short" });
      acc[month] = acc[month] || { month, amount: 0 };
      acc[month].amount += txn.amount;
      return acc;
    }, {})
  );

  const pieData = Object.values(
    transactions.reduce((acc, txn) => {
      const desc = txn.description || "Other";
      acc[desc] = acc[desc] || { name: desc, value: 0 };
      acc[desc].value += txn.amount;
      return acc;
    }, {})
  );

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark((prev) => !prev);
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen p-4 bg-white text-black dark:bg-gray-900 dark:text-white">
        <div className="max-w-7xl mx-auto relative">
          <Button
            onClick={toggleTheme}
            className="absolute top-2 right-2"
            variant="outline"
          >
            {isDark ? "Light Mode" : "Dark Mode"}
          </Button>
          <br />
          <br />
          <h1 className="text-3xl font-bold mb-6 text-center">💸 Personal Finance Tracker</h1>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Left Column: Form + Transaction List */}
            <div className="w-full lg:w-1/3 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
                <Input
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
                <Button type="submit" className="w-full">
                  {editingId ? "Update" : "Add"} Transaction
                </Button>
              </form>

              <div>
                <h2 className="font-semibold text-xl mb-2">📋 Transaction List</h2>
                {transactions.length === 0 && <p>No transactions found.</p>}
                <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                  {transactions.map((txn) => (
                    <li
                      key={txn._id}
                      className="border rounded p-2 flex justify-between items-center dark:border-gray-700"
                    >
                      <div>
                        <p>
                          ₹{txn.amount} - {new Date(txn.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {txn.description}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" onClick={() => handleEdit(txn)}>
                          Edit
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(txn._id)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Middle Column: Bar Chart */}
            <div className="w-full lg:w-1/3 bg-gray-200 dark:bg-gray-800 rounded p-8">
              <h2 className="font-semibold text-xl text-center mb-4">📊 Monthly Spending Overview</h2>
              <BarChart width={300} height={300} data={monthlyData}>
                <XAxis dataKey="month" stroke={isDark ? "#fff" : "#333"} />
                <YAxis stroke={isDark ? "#fff" : "#333"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#333" : "#fff",
                    border: "none",
                    color: isDark ? "#fff" : "#000",
                  }}
                />
                <Bar dataKey="amount" fill="#03a200" />
              </BarChart>
            </div>

            {/* Right Column: Pie Chart */}
            <div className="w-full lg:w-1/3 bg-gray-200 dark:bg-gray-800 rounded p-8">
              <h2 className="font-semibold text-xl text-center mb-4">🥧 Spending by Category</h2>
              <PieChart width={300} height={300}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#333" : "#fff",
                    border: "none",
                    color: isDark ? "#fff" : "#000",
                  }}
                />
                <Legend />
              </PieChart>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
