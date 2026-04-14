import { useState, useEffect } from "react";

const STORAGE_KEY = "prodapp_data";
const defaultData = { tasks: [], finances: [], reminders: [] };

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultData;
  } catch { return defaultData; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const CATEGORIES = ["Work", "Personal", "Health", "Learning", "Other"];
const PERIODS = ["Today", "This Week", "This Month"];

function Badge({ children, color }) {
  const colors = {
    green: "background:#d1fae5;color:#065f46",
    yellow: "background:#fef3c7;color:#92400e",
    red: "background:#fee2e2;color:#991b1b",
    blue: "background:#dbeafe;color:#1e40af",
    purple: "background:#ede9fe;color:#5b21b6",
    gray: "background:#f1f5f9;color:#64748b",
  };
  const style = colors[color] || colors.gray;
  return (
    <span style={{ ...Object.fromEntries(style.split(";").map(s => s.split(":"))), fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999 }}>
      {children}
    </span>
  );
}

function ProgressRing({ pct, size = 80, stroke = 7, color = "#10b981" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

function ReminderCard({ r, onToggle, onDelete, overdue, done }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "12px 16px", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 12, opacity: done ? 0.5 : 1 }}>
      <button onClick={() => onToggle(r.id)}
        style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${r.done ? "#10b981" : overdue ? "#ef4444" : "#cbd5e1"}`, background: r.done ? "#10b981" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {r.done && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, textDecoration: done ? "line-through" : "none" }}>{r.title}</div>
        <div style={{ fontSize: 11, color: overdue ? "#ef4444" : "#94a3b8" }}>
          {r.date}{r.time && ` · ${r.time}`}{overdue && " · Overdue"}
        </div>
      </div>
      <button onClick={() => onDelete(r.id)} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 18, padding: 0 }}>×</button>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("dashboard");
  const [period, setPeriod] = useState("Today");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCat, setTaskCat] = useState("Work");
  const [taskPeriod, setTaskPeriod] = useState("Today");
  const [finDesc, setFinDesc] = useState("");
  const [finAmt, setFinAmt] = useState("");
  const [finType, setFinType] = useState("expense");
  const [remTitle, setRemTitle] = useState("");
  const [remDate, setRemDate] = useState("");
  const [remTime, setRemTime] = useState("");

  const persist = (next) => { setData(next); saveData(next); };

  const addTask = () => {
    if (!taskTitle.trim()) return;
    persist({ ...data, tasks: [...data.tasks, { id: Date.now(), title: taskTitle, cat: taskCat, period: taskPeriod, done: false, created: new Date().toISOString() }] });
    setTaskTitle("");
  };
  const toggleTask = (id) => persist({ ...data, tasks: data.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) });
  const deleteTask = (id) => persist({ ...data, tasks: data.tasks.filter(t => t.id !== id) });

  const addFinance = () => {
    if (!finDesc.trim() || !finAmt) return;
    persist({ ...data, finances: [...data.finances, { id: Date.now(), desc: finDesc, amount: parseFloat(finAmt), type: finType, date: new Date().toISOString() }] });
    setFinDesc(""); setFinAmt("");
  };
  const deleteFinance = (id) => persist({ ...data, finances: data.finances.filter(f => f.id !== id) });

  const addReminder = () => {
    if (!remTitle.trim() || !remDate) return;
    persist({ ...data, reminders: [...data.reminders, { id: Date.now(), title: remTitle, date: remDate, time: remTime, done: false }] });
    setRemTitle(""); setRemDate(""); setRemTime("");
  };
  const toggleReminder = (id) => persist({ ...data, reminders: data.reminders.map(r => r.id === id ? { ...r, done: !r.done } : r) });
  const deleteReminder = (id) => persist({ ...data, reminders: data.reminders.filter(r => r.id !== id) });

  const tasksForPeriod = (p) => data.tasks.filter(t => t.period === p);
  const donePct = (p) => { const ts = tasksForPeriod(p); if (!ts.length) return 0; return Math.round((ts.filter(t => t.done).length / ts.length) * 100); };
  const totalIncome = data.finances.filter(f => f.type === "income").reduce((s, f) => s + f.amount, 0);
  const totalExpense = data.finances.filter(f => f.type === "expense").reduce((s, f) => s + f.amount, 0);
  const balance = totalIncome - totalExpense;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const upcomingReminders = data.reminders.filter(r => !r.done).sort((a, b) => new Date(a.date + "T" + (a.time || "00:00")) - new Date(b.date + "T" + (b.time || "00:00")));
  const overdueReminders = upcomingReminders.filter(r => r.date < todayStr);
  const todayReminders = upcomingReminders.filter(r => r.date === todayStr);

  const tabs = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "tasks", icon: "✓", label: "Tasks" },
    { id: "finance", icon: "₹", label: "Finance" },
    { id: "reminders", icon: "🔔", label: "Reminders" },
  ];

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10, fontFamily: "inherit" };
  const btnStyle = { width: "100%", padding: 12, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0f172a, #1e3a5f)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
  const cardStyle = { background: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" };
  const sectionLabel = { fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#1e293b" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", padding: "20px 24px 0", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>My Workspace</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Done Today</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#34d399" }}>
              {data.tasks.filter(t => t.period === "Today" && t.done).length}
              <span style={{ fontSize: 14, color: "#64748b", fontWeight: 400 }}>/{tasksForPeriod("Today").length}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: "10px 4px 12px", border: "none", cursor: "pointer", background: tab === t.id ? "rgba(255,255,255,0.12)" : "transparent", color: tab === t.id ? "#fff" : "#94a3b8", borderBottom: tab === t.id ? "3px solid #34d399" : "3px solid transparent", borderRadius: "6px 6px 0 0", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, transition: "all 0.2s", fontFamily: "inherit" }}>
              <div style={{ fontSize: 16 }}>{t.icon}</div>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ flex: 1, padding: "8px 4px", borderRadius: 10, border: "none", cursor: "pointer", background: period === p ? "#0f172a" : "#e2e8f0", color: period === p ? "#fff" : "#64748b", fontSize: 12, fontWeight: 600, transition: "all 0.2s", fontFamily: "inherit" }}>{p}</button>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ ...sectionLabel, marginBottom: 16 }}>Task Progress — {period}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <ProgressRing pct={donePct(period)} />
                  <div style={{ position: "absolute", fontSize: 16, fontWeight: 800, color: "#10b981" }}>{donePct(period)}%</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>Completed</span><span style={{ fontWeight: 700, color: "#10b981" }}>{tasksForPeriod(period).filter(t => t.done).length}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}><span>Remaining</span><span style={{ fontWeight: 700, color: "#f59e0b" }}>{tasksForPeriod(period).filter(t => !t.done).length}</span></div>
                  <div style={{ height: 6, background: "#e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${donePct(period)}%`, background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: 10, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              </div>
            </div>
            <div style={cardStyle}>
              <div style={sectionLabel}>Finance Snapshot</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, background: "#ecfdf5", borderRadius: 14, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>INCOME</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#065f46" }}>₹{totalIncome.toLocaleString("en-IN")}</div>
                </div>
                <div style={{ flex: 1, background: "#fef2f2", borderRadius: 14, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>EXPENSE</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#991b1b" }}>₹{totalExpense.toLocaleString("en-IN")}</div>
                </div>
              </div>
              <div style={{ padding: "12px 14px", background: balance >= 0 ? "#eff6ff" : "#fef2f2", borderRadius: 14 }}>
                <div style={{ fontSize: 11, color: balance >= 0 ? "#3b82f6" : "#ef4444", fontWeight: 600 }}>BALANCE</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: balance >= 0 ? "#1d4ed8" : "#991b1b" }}>₹{Math.abs(balance).toLocaleString("en-IN")} {balance < 0 ? "↓" : "↑"}</div>
              </div>
            </div>
            <div style={cardStyle}>
              <div style={sectionLabel}>Today's Reminders</div>
              {overdueReminders.slice(0, 2).map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span>⚠️</span>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div><div style={{ fontSize: 11, color: "#ef4444" }}>Overdue · {r.date}</div></div>
                </div>
              ))}
              {todayReminders.slice(0, 3).map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span>🔔</span>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Today {r.time && `· ${r.time}`}</div></div>
                </div>
              ))}
              {!overdueReminders.length && !todayReminders.length && <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>No reminders for today 🎉</div>}
            </div>
          </div>
        )}

        {/* TASKS */}
        {tab === "tasks" && (
          <div>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Add New Task</div>
              <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="What do you need to do?" onKeyDown={e => e.key === "Enter" && addTask()} style={inputStyle} />
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <select value={taskCat} onChange={e => setTaskCat(e.target.value)} style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "2px solid #e2e8f0", fontSize: 13, background: "#fff", fontFamily: "inherit" }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={taskPeriod} onChange={e => setTaskPeriod(e.target.value)} style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "2px solid #e2e8f0", fontSize: 13, background: "#fff", fontFamily: "inherit" }}>
                  {PERIODS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <button onClick={addTask} style={btnStyle}>+ Add Task</button>
            </div>
            {PERIODS.map(p => {
              const ts = tasksForPeriod(p);
              if (!ts.length) return null;
              return (
                <div key={p} style={{ marginBottom: 20 }}>
                  <div style={sectionLabel}>{p} · {ts.filter(t => t.done).length}/{ts.length} done</div>
                  {ts.map(t => (
                    <div key={t.id} style={{ background: "#fff", borderRadius: 14, padding: "12px 16px", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 12, opacity: t.done ? 0.6 : 1 }}>
                      <button onClick={() => toggleTask(t.id)} style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${t.done ? "#10b981" : "#cbd5e1"}`, background: t.done ? "#10b981" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {t.done && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#94a3b8" : "#1e293b", marginBottom: 4 }}>{t.title}</div>
                        <Badge color={t.cat === "Work" ? "blue" : t.cat === "Health" ? "green" : t.cat === "Personal" ? "purple" : "gray"}>{t.cat}</Badge>
                      </div>
                      <button onClick={() => deleteTask(t.id)} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 18, padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              );
            })}
            {!data.tasks.length && <div style={{ textAlign: "center", color: "#94a3b8", padding: 40, fontSize: 14 }}>No tasks yet. Add one above! 🚀</div>}
          </div>
        )}

        {/* FINANCE */}
        {tab === "finance" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", borderRadius: 20, padding: 24, marginBottom: 20, color: "#fff" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Net Balance</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: balance >= 0 ? "#34d399" : "#f87171" }}>₹{Math.abs(balance).toLocaleString("en-IN")}</div>
              <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
                <div><div style={{ fontSize: 10, color: "#94a3b8" }}>INCOME</div><div style={{ fontSize: 18, fontWeight: 700, color: "#34d399" }}>₹{totalIncome.toLocaleString("en-IN")}</div></div>
                <div><div style={{ fontSize: 10, color: "#94a3b8" }}>EXPENSE</div><div style={{ fontSize: 18, fontWeight: 700, color: "#f87171" }}>₹{totalExpense.toLocaleString("en-IN")}</div></div>
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Add Entry</div>
              <input value={finDesc} onChange={e => setFinDesc(e.target.value)} placeholder="Description" style={inputStyle} />
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input value={finAmt} onChange={e => setFinAmt(e.target.value)} placeholder="Amount (₹)" type="number" style={{ flex: 2, padding: "10px 14px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                <select value={finType} onChange={e => setFinType(e.target.value)} style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 13, background: "#fff", fontFamily: "inherit" }}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <button onClick={addFinance} style={btnStyle}>+ Add Entry</button>
            </div>
            <div style={sectionLabel}>Transactions</div>
            {[...data.finances].reverse().map(f => (
              <div key={f.id} style={{ background: "#fff", borderRadius: 14, padding: "12px 16px", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: f.type === "income" ? "#ecfdf5" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{f.type === "income" ? "↑" : "↓"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{f.desc}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(f.date).toLocaleDateString("en-IN")}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: f.type === "income" ? "#10b981" : "#ef4444" }}>{f.type === "income" ? "+" : "-"}₹{f.amount.toLocaleString("en-IN")}</div>
                <button onClick={() => deleteFinance(f.id)} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 18, padding: 0 }}>×</button>
              </div>
            ))}
            {!data.finances.length && <div style={{ textAlign: "center", color: "#94a3b8", padding: 40, fontSize: 14 }}>No entries yet. Track your money! 💰</div>}
          </div>
        )}

        {/* REMINDERS */}
        {tab === "reminders" && (
          <div>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Set a Reminder</div>
              <input value={remTitle} onChange={e => setRemTitle(e.target.value)} placeholder="What to remind you about?" style={inputStyle} />
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input type="date" value={remDate} onChange={e => setRemDate(e.target.value)} style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                <input type="time" value={remTime} onChange={e => setRemTime(e.target.value)} style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
              </div>
              <button onClick={addReminder} style={btnStyle}>🔔 Set Reminder</button>
            </div>
            {overdueReminders.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...sectionLabel, color: "#ef4444" }}>⚠️ Overdue</div>
                {overdueReminders.map(r => <ReminderCard key={r.id} r={r} onToggle={toggleReminder} onDelete={deleteReminder} overdue />)}
              </div>
            )}
            {upcomingReminders.filter(r => r.date >= todayStr).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={sectionLabel}>Upcoming</div>
                {upcomingReminders.filter(r => r.date >= todayStr).map(r => <ReminderCard key={r.id} r={r} onToggle={toggleReminder} onDelete={deleteReminder} />)}
              </div>
            )}
            {data.reminders.filter(r => r.done).length > 0 && (
              <div>
                <div style={sectionLabel}>Completed</div>
                {data.reminders.filter(r => r.done).map(r => <ReminderCard key={r.id} r={r} onToggle={toggleReminder} onDelete={deleteReminder} done />)}
              </div>
            )}
            {!data.reminders.length && <div style={{ textAlign: "center", color: "#94a3b8", padding: 40, fontSize: 14 }}>No reminders yet. Set one above! ⏰</div>}
          </div>
        )}
      </div>
    </div>
  );
}
