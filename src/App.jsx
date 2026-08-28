import { useState, useEffect, useCallback } from "react";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Dot } from "recharts";

const PARTS = [

{ id: "chest", label: "胸", dot: "bg-red-500", bgActive: "bg-red-500", textActive: "text-white", hex: "#ef4444" },

{ id: "back", label: "背中", dot: "bg-green-500", bgActive: "bg-green-500", textActive: "text-white", hex: "#22c55e" },

{ id: "shoulders", label: "肩", dot: "bg-orange-500", bgActive: "bg-orange-500", textActive: "text-white", hex: "#f97316" },

{ id: "arms", label: "腕", dot: "bg-yellow-400", bgActive: "bg-yellow-400", textActive: "text-neutral-900", hex: "#facc15" },

{ id: "legs", label: "脚", dot: "bg-blue-500", bgActive: "bg-blue-500", textActive: "text-white", hex: "#3b82f6" },

];

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function toKey(d) {

const y = d.getFullYear();

const m = String(d.getMonth() + 1).padStart(2, "0");

const day = String(d.getDate()).padStart(2, "0");

return `${y}-${m}-${day}`;

}

function shortLabel(key) {

const [, m, d] = key.split("-");

return `${parseInt(m)}/${parseInt(d)}`;

}

function daysBetween(fromKey, toDate) {

const from = new Date(fromKey + "T00:00:00");

const diffMs = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()) - from;

return Math.round(diffMs / (1000 * 60 * 60 * 24));

}

function buildMonthGrid(viewDate) {

const year = viewDate.getFullYear();

const month = viewDate.getMonth();

const firstDay = new Date(year, month, 1);

const startOffset = firstDay.getDay();

const daysInMonth = new Date(year, month + 1, 0).getDate();

const daysInPrevMonth = new Date(year, month, 0).getDate();

const cells = [];

for (let i = startOffset - 1; i >= 0; i--) {

cells.push({ day: daysInPrevMonth - i, inMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });

}

for (let d = 1; d <= daysInMonth; d++) {

cells.push({ day: d, inMonth: true, date: new Date(year, month, d) });

}

while (cells.length % 7 !== 0) {

const nextIdx = cells.length - (startOffset + daysInMonth) + 1;

cells.push({ day: nextIdx, inMonth: false, date: new Date(year, month + 1, nextIdx) });

}

return cells;

}

function BarbellIcon({ className }) {

return (

<svg viewBox="0 0 64 24" className={className} fill="currentColor">

<rect x="0" y="8" width="6" height="8" rx="1" />

<rect x="8" y="4" width="5" height="16" rx="1" />

<rect x="15" y="10" width="34" height="4" rx="1" />

<rect x="51" y="4" width="5" height="16" rx="1" />

<rect x="58" y="8" width="6" height="8" rx="1" />

    </svg>

);

}

export default function WorkoutTracker() {

const today = new Date();

const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

const [selected, setSelected] = useState(toKey(today));

const [logs, setLogs] = useState({});

const [benchLogs, setBenchLogs] = useState({});

const [benchInput, setBenchInput] = useState("");

const [loaded, setLoaded] = useState(false);

const [error, setError] = useState(null);

const [savedFlash, setSavedFlash] = useState(false);

useEffect(() => {

(async () => {

try {

const result = await Promise.resolve({ value: localStorage.getItem("workout-logs") });

if (result && result.value) setLogs(JSON.parse(result.value));

} catch (e) {}

try {

const result = await Promise.resolve({ value: localStorage.getItem("bench-logs") });

if (result && result.value) setBenchLogs(JSON.parse(result.value));

} catch (e) {}

setLoaded(true);

})();

}, []);

useEffect(() => {

setBenchInput(benchLogs[selected] ? String(benchLogs[selected]) : "");

}, [selected, benchLogs]);

const persistLogs = useCallback(async (next) => {

setLogs(next);

try {

localStorage.setItem("workout-logs", JSON.stringify(next));

setError(null);

} catch (e) {

setError("保存に失敗しました");

}

}, []);

const persistBench = useCallback(async (next) => {

setBenchLogs(next);

try {

localStorage.setItem("bench-logs", JSON.stringify(next));

setError(null);

} catch (e) {

setError("保存に失敗しました");

}

}, []);

const toggle = (partId) => {

const current = logs[selected] || [];

const next = current.includes(partId)

      ? current.filter((p) => p !== partId)

      : [...current, partId];

const nextLogs = { ...logs };

if (next.length === 0) delete nextLogs[selected];

else nextLogs[selected] = next;

persistLogs(nextLogs);

};

const saveBench = () => {

const val = parseFloat(benchInput);

const nextBench = { ...benchLogs };

if (!benchInput || isNaN(val) || val <= 0) {

delete nextBench[selected];

} else {

nextBench[selected] = val;

}

persistBench(nextBench);

setSavedFlash(true);

setTimeout(() => setSavedFlash(false), 1200);

};

const benchEntries = Object.entries(benchLogs).sort(([a], [b]) => (a < b ? -1 : 1));

const bestBench = benchEntries.length ? Math.max(...benchEntries.map(([, w]) => w)) : null;

const bestBenchDate = benchEntries.find(([, w]) => w === bestBench)?.[0];

const chartData = benchEntries.map(([date, weight]) => ({ date, label: shortLabel(date), weight }));

const lastTrained = PARTS.map((p) => {

const dates = Object.entries(logs)

.filter(([, v]) => v.includes(p.id))

.map(([k]) => k)

.sort();

const last = dates[dates.length - 1];

const diff = last ? daysBetween(last, today) : null;

return { ...p, last, diff };

});

const cells = buildMonthGrid(viewDate);

const monthLabel = `${viewDate.getFullYear()}年 ${viewDate.getMonth() + 1}月`;

const selectedDateObj = new Date(selected + "T00:00:00");

const selectedLabel = `${selectedDateObj.getMonth() + 1}月${selectedDateObj.getDate()}日(${WEEKDAYS[selectedDateObj.getDay()]})`;

const selectedParts = logs[selected] || [];

const monthCounts = PARTS.map((p) => {

const count = Object.entries(logs).filter(([k, v]) => {

const d = new Date(k + "T00:00:00");

return d.getFullYear() === viewDate.getFullYear() && d.getMonth() === viewDate.getMonth() && v.includes(p.id);

}).length;

return { ...p, count };

});

return (

<div className="min-h-full w-full bg-neutral-950 text-neutral-100 flex justify-center">

<style>{`

        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .font-display { font-family: 'Oswald', sans-serif; }

        .font-body { font-family: 'Inter', sans-serif; }

      `}</style>

<div className="w-full max-w-md px-4 py-6 font-body">

{/* Header */}

<div className="mb-6">

<div className="flex items-center gap-2 mb-2">

<BarbellIcon className="w-9 h-4 text-neutral-600" />

<span className="font-display text-[11px] tracking-[0.35em] text-neutral-500 uppercase">Training Log</span>

          </div>

<div className="flex items-end justify-between">

<h1 className="font-display font-bold text-4xl tracking-tight text-white uppercase italic">

              筋トレログ

            </h1>

{bestBench && (

<div className="text-right leading-none">

<div className="text-[10px] tracking-widest text-neutral-500 uppercase mb-1">Bench Max</div>

<div className="font-display font-bold text-2xl text-white">

{bestBench}<span className="text-sm text-neutral-500 ml-0.5">kg</span>

                </div>

<div className="text-[10px] text-neutral-600 mt-0.5">{shortLabel(bestBenchDate)}</div>

              </div>

)}

          </div>

<div className="flex mt-3 h-1.5 rounded-full overflow-hidden">

{PARTS.map((p) => (

<div key={p.id} className={`flex-1 ${p.dot}`} />

))}

          </div>

        </div>

{/* Days since last trained */}

<div className="bg-neutral-900 rounded-2xl p-4 mb-5">

<p className="font-display text-sm uppercase text-neutral-500 mb-3">最後にやった日から</p>

<div className="grid grid-cols-5 gap-2">

{lastTrained.map((p) => (

<div key={p.id} className="flex flex-col items-center gap-1.5">

<span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} />

<span className="text-xs text-neutral-400">{p.label}</span>

{p.diff === null ? (

<span className="text-[11px] text-neutral-600">記録なし</span>

) : p.diff === 0 ? (

<span className="text-[11px] text-white font-medium">今日</span>

) : (

<span className={`text-[11px] font-medium ${p.diff >= 5 ? "text-red-400" : "text-neutral-300"}`}>

{p.diff}日前

                  </span>

)}

              </div>

))}

          </div>

        </div>

{/* Calendar */}

<div className="bg-neutral-900 rounded-2xl p-4 mb-5">

<div className="flex items-center justify-between mb-3">

<button

onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}

className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-800 active:bg-neutral-700"

aria-label="前の月"

>

              ‹

            </button>

<span className="font-display text-lg">{monthLabel}</span>

<button

onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}

className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-800 active:bg-neutral-700"

aria-label="次の月"

>

              ›

            </button>

          </div>

<div className="grid grid-cols-7 mb-1">

{WEEKDAYS.map((w) => (

<div key={w} className="text-center text-xs text-neutral-600 py-1">

{w}

              </div>

))}

          </div>

<div className="grid grid-cols-7 gap-1">

{cells.map((cell, idx) => {

const key = toKey(cell.date);

const isSelected = key === selected;

const isToday = key === toKey(today);

const dayLogs = logs[key] || [];

return (

<button

key={idx}

onClick={() => setSelected(key)}

className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition
                    ${cell.inMonth ? "text-neutral-200" : "text-neutral-700"}
                    ${isSelected ? "ring-2 ring-white bg-neutral-800" : "hover:bg-neutral-800"}
                    ${isToday && !isSelected ? "bg-neutral-800/60" : ""}`}

>

<span className="text-xs leading-none">{cell.day}</span>

<div className="flex flex-wrap justify-center gap-0.5 max-w-[20px]">

{dayLogs.slice(0, 5).map((pid) => {

const part = PARTS.find((p) => p.id === pid);

return <span key={pid} className={`w-1.5 h-1.5 rounded-full ${part.dot}`} />;

})}

                  </div>

                </button>

);

})}

          </div>

        </div>

{/* Selected day + tap buttons */}

<div className="bg-neutral-900 rounded-2xl p-4 mb-5">

<p className="font-display text-lg mb-3">{selectedLabel}の記録</p>

<div className="grid grid-cols-5 gap-2 mb-4">

{PARTS.map((part) => {

const active = selectedParts.includes(part.id);

return (

<button

key={part.id}

onClick={() => toggle(part.id)}

className={`flex flex-col items-center justify-center gap-1 rounded-xl py-3 transition active:scale-95
                    ${active ? `${part.bgActive} ${part.textActive}` : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}` }

>

<span className="font-display text-base">{part.label}</span>

                </button>

);

})}

          </div>

<div className="border-t border-neutral-800 pt-4">

<p className="text-xs tracking-widest text-neutral-500 uppercase mb-2">Bench Press Max (kg)</p>

<div className="flex gap-2">

<input

type="number"

inputMode="decimal"

value={benchInput}

onChange={(e) => setBenchInput(e.target.value)}

placeholder="例: 80"

className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 outline-none focus:ring-2 focus:ring-white"

              />

<button

onClick={saveBench}

className="px-4 rounded-lg bg-white text-neutral-900 font-display font-semibold active:scale-95 transition"

>

                保存

              </button>

            </div>

{savedFlash && <p className="text-xs text-green-500 mt-2">保存しました</p>}

          </div>

{!loaded && <p className="text-xs text-neutral-600 mt-3">読み込み中…</p>}

{error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        </div>

{/* Bench press progression chart */}

{chartData.length > 0 && (

<div className="bg-neutral-900 rounded-2xl p-4 mb-5">

<p className="font-display text-sm uppercase text-neutral-500 mb-3">ベンチプレスMAXの推移</p>

<div style={{ width: "100%", height: 160 }}>

<ResponsiveContainer>

<LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>

<CartesianGrid stroke="#27272a" vertical={false} />

<XAxis

dataKey="label"

tick={{ fill: "#737373", fontSize: 11 }}

axisLine={{ stroke: "#3f3f46" }}

tickLine={false}

                  />

<YAxis

tick={{ fill: "#737373", fontSize: 11 }}

axisLine={false}

tickLine={false}

domain={["dataMin - 5", "dataMax + 5"]}

                  />

<Tooltip

contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}

labelStyle={{ color: "#a1a1aa" }}

itemStyle={{ color: "#fff" }}

formatter={(v) => [`${v}kg`, "MAX"]}

                  />

<Line

type="monotone"

dataKey="weight"

stroke="#ef4444"

strokeWidth={2.5}

dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}

activeDot={{ r: 5 }}

                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

)}

{/* Monthly summary */}

<div className="bg-neutral-900 rounded-2xl p-4">

<p className="font-display text-sm uppercase text-neutral-500 mb-3">{viewDate.getMonth() + 1}月の回数</p>

<div className="space-y-2">

{monthCounts.map((p) => (

<div key={p.id} className="flex items-center gap-3">

<span className={`w-2.5 h-2.5 rounded-full ${p.dot} flex-shrink-0`} />

<span className="text-sm w-10">{p.label}</span>

<div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">

<div

className={`h-full ${p.dot}`}

style={{ width: `${Math.min(p.count * 12, 100)}%` }}

                  />

                </div>

<span className="text-sm text-neutral-400 w-6 text-right">{p.count}</span>

              </div>

))}

          </div>

        </div>

      </div>

    </div>

);

}
