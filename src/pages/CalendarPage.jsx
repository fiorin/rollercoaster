import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useData } from "../contexts/DataContext";
import { saveWeight } from "../utils/storage";
import dayjs from "dayjs";

export default function CalendarPage({ currentUser }) {
  const { weights, refreshData, loading } = useData();
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [kg, setKg] = useState("");
  const [activities, setActivities] = useState({
    gym: false,
    bike: false,
    boxing: false,
    run: false,
  });
  const [message, setMessage] = useState("");

  const userWeights = useMemo(() => {
    if (!currentUser) return [];
    return weights.filter((w) => w.personId === currentUser.id);
  }, [currentUser, weights]);

  const weightsByDate = useMemo(() => {
    const map = new Map();
    userWeights.forEach((w) => {
      map.set(w.date.slice(0, 10), w);
    });
    return map;
  }, [userWeights]);

  const currentMonth = dayjs(selectedDate);
  const daysInMonth = currentMonth.daysInMonth();
  const firstDay = currentMonth.startOf("month").day();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  useEffect(() => {
    const entry = weightsByDate.get(selectedDate);
    if (entry) {
      setKg(entry.kg.toString());
      setActivities({
        gym: entry.activities?.gym || false,
        bike: entry.activities?.bike || false,
        boxing: entry.activities?.boxing || false,
        run: entry.activities?.run || false,
      });
    } else {
      setKg("");
      setActivities({ gym: false, bike: false, boxing: false, run: false });
    }
  }, [selectedDate, weightsByDate]);

  const onAddWeight = useCallback(async () => {
    if (!currentUser) {
      setMessage("Select a user first");
      return;
    }
    if (!kg.trim()) {
      setMessage("Enter a weight");
      return;
    }

    const existingEntry = weightsByDate.get(selectedDate);
    const entryId =
      existingEntry?.id || `${currentUser.id}-${selectedDate}-${Date.now()}`;
    const nextEntry = {
      id: entryId,
      personId: currentUser.id,
      date: selectedDate,
      kg: parseFloat(kg),
      activities,
    };

    try {
      await saveWeight(nextEntry);
      await refreshData();
      setMessage(existingEntry ? "✅ Weight updated!" : "✅ Weight added!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage("❌ Failed to save");
      console.error(err);
    }
  }, [
    currentUser,
    selectedDate,
    kg,
    activities,
    userWeights,
    weightsByDate,
    refreshData,
  ]);

  const onPrevMonth = () => {
    setSelectedDate(currentMonth.subtract(1, "month").format("YYYY-MM-DD"));
  };

  const onNextMonth = () => {
    setSelectedDate(currentMonth.add(1, "month").format("YYYY-MM-DD"));
  };

  const getDateClass = (day) => {
    const dateStr = currentMonth.date(day).format("YYYY-MM-DD");
    const hasEntry = weightsByDate.has(dateStr);
    const isSelected = dateStr === selectedDate;
    const isToday = dateStr === dayjs().format("YYYY-MM-DD");

    let className = "calendar-day";
    if (hasEntry) className += " logged";
    if (isSelected) className += " selected";
    if (isToday) className += " today";
    return className;
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <h2>Calendar</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
        View and add weights from any date
      </p>

      {/* Month calendar */}
      <section
        style={{
          marginBottom: "24px",
          padding: "16px",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={onPrevMonth}
            style={{ padding: "8px 12px", cursor: "pointer" }}
          >
            ← Prev
          </button>
          <h3 style={{ margin: 0 }}>{currentMonth.format("MMMM YYYY")}</h3>
          <button
            onClick={onNextMonth}
            style={{ padding: "8px 12px", cursor: "pointer" }}
          >
            Next →
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "4px",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "12px",
                padding: "8px",
                color: "var(--text-secondary)",
              }}
            >
              {day}
            </div>
          ))}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} style={{ padding: "8px" }} />
          ))}
          {days.map((day) => {
            const dateStr = currentMonth.date(day).format("YYYY-MM-DD");
            const entry = weightsByDate.get(dateStr);
            return (
              <button
                key={day}
                className={getDateClass(day)}
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  padding: "8px",
                  border:
                    selectedDate === dateStr
                      ? "2px solid #2563eb"
                      : "1px solid var(--border)",
                  borderRadius: "6px",
                  backgroundColor: weightsByDate.has(dateStr)
                    ? "var(--primary)"
                    : "transparent",
                  color: weightsByDate.has(dateStr) ? "white" : "var(--text)",
                  cursor: "pointer",
                  fontWeight: selectedDate === dateStr ? "bold" : "normal",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick add form */}
      <section
        style={{
          padding: "16px",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "12px",
        }}
      >
        <h3>Add weight for {dayjs(selectedDate).format("DD MMM YYYY")}</h3>

        {weightsByDate.has(selectedDate) && (
          <div
            style={{
              marginBottom: "12px",
              padding: "12px",
              backgroundColor: "var(--bg-white)",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            📝 Already logged: {weightsByDate.get(selectedDate).kg} kg
          </div>
        )}

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "bold",
            }}
          >
            Weight (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            placeholder="e.g. 75.5"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Activities
          </label>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { key: "gym", label: "💪 Gym" },
              { key: "bike", label: "🚴 Bike" },
              { key: "boxing", label: "🥊 Boxing" },
              { key: "run", label: "🏃 Running" },
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={activities[key]}
                  onChange={(e) =>
                    setActivities({ ...activities, [key]: e.target.checked })
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          className="primary"
          onClick={onAddWeight}
          style={{ width: "100%" }}
        >
          {weightsByDate.has(selectedDate) ? "Update weight" : "Add weight"}
        </button>

        {message && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              backgroundColor: "var(--bg-white)",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}
      </section>
    </div>
  );
}
