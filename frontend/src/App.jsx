import { useState, useEffect, useRef } from "react";
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
  Legend,
  LineChart,
  Line,
} from "recharts";
import axios from "axios";
import { Toaster, toast } from "sonner";
import "../src/index.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A", "#8800EE"];

function App() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ amount: "", date: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState("amount");
  const [search, setSearch] = useState(""); 

  const pdfRef = useRef();

  const handleDownloadPDF = () => {
    const input = pdfRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("transactions.pdf");
    });
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("https://personal-finance-tracker-egig.onrender.com/api/transactions");
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
        await axios.put(`https://personal-finance-tracker-egig.onrender.com/api/transactions/${editingId}`, form);
        toast.success("Transaction updated!");
        setEditingId(null);
      } else {
        await axios.post("https://personal-finance-tracker-egig.onrender.com/api/transactions", form);
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
      await axios.delete(`https://personal-finance-tracker-egig.onrender.com/api/transactions/${id}`);
      toast.success("Transaction deleted.");
      fetchTransactions();
    } catch (err) {
      toast.error("Error deleting transaction.");
    }
  };

  const resetFilters = () => {
    setFilterType("amount");
    setSearch("");
  };

  const filteredTransactions = transactions.filter((txn) => {
    const value = search.toLowerCase();
    if (filterType === "amount") {
      return txn.amount.toString().includes(value);
    } else if (filterType === "date") {
      return txn.date.toLowerCase().includes(value);
    }
    return true;
  });

  const monthlyData = Object.values(
    filteredTransactions.reduce((acc, txn) => {
      const month = new Date(txn.date).toLocaleString("default", { month: "short" });
      acc[month] = acc[month] || { month, amount: 0 };
      acc[month].amount += txn.amount;
      return acc;
    }, {})
  );

  const pieData = Object.values(
    filteredTransactions.reduce((acc, txn) => {
      const desc = txn.description || "Other";
      acc[desc] = acc[desc] || { name: desc, value: 0 };
      acc[desc].value += txn.amount;
      return acc;
    }, {})
  );

  const cumulativeData = filteredTransactions
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .reduce((acc, txn) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].amount : 0;
      acc.push({ date: txn.date.slice(0, 10), amount: prev + txn.amount });
      return acc;
    }, []);

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen px-4 py-8 bg-white text-black">
        <div className="max-w-7xl mx-auto" ref={pdfRef}>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">💸 Personal Finance Tracker</h1>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded px-2 py-1 bg-white"
              >
                <option value="amount">Filter by Amount</option>
                <option value="date">Filter by Date</option>
              </select>
              <Input
                placeholder={`Search ${filterType}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button onClick={resetFilters} variant="outline">
                Reset
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
                />
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  placeholder="dd-mm-yyyy"
                />
                <Input
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <Button type="submit" className="w-full">
                  {editingId ? "Update" : "Add"} Transaction
                </Button>
              </form>

              <div>
                <h2 className="font-semibold text-xl mb-2">📋 Transaction List</h2>
                {filteredTransactions.length === 0 && <p>No transactions found.</p>}
                <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {filteredTransactions.map((txn) => (
                    <li
                      key={txn._id}
                      className="border rounded p-2 flex justify-between items-center"
                    >
                      <div>
                        <p>₹{txn.amount} - {new Date(txn.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">{txn.description}</p>
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

            <div className="w-full bg-gray-200 rounded p-6">
              <h2 className="font-semibold text-xl text-center mb-4">📊 Monthly Spending Overview</h2>
              <BarChart width={300} height={300} data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#03a200" />
              </BarChart>
            </div>

            <div className="w-full bg-gray-200 rounded p-6">
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
                <Tooltip />
                <Legend />
              </PieChart>
            </div>

            <div className="w-full bg-gray-200 rounded p-6 md:col-span-2 lg:col-span-3">
              <h2 className="font-semibold text-xl text-center mb-4">📈 Cumulative Spending Over Time</h2>
              <LineChart width={800} height={300} data={cumulativeData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" />
              </LineChart>
            </div>
          </div>
        </div>
        <Button className="mt-4" onClick={handleDownloadPDF} variant="default">Download PDF</Button>
      </div>
    </>
  );
}

export default App;
