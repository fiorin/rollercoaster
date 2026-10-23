import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useData } from "../contexts/DataContext";
import { ACTIVITIES } from "../utils/activities";
import { uid } from "../utils/storage";
import {
  addMonths,
  dateKey,
  daysInMonth,
  dayOfWeek,
  formatLong,
  formatMonthYear,
  monthDayKey,
  startOfMonthKey,
  todayKey,
} from "../utils/date";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { weightsByPerson, currentUser, saveWeightEntry, toast } = useData();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [kg, setKg] = useState("");
  const [activities, setActivities] = useState({
    gym: false,
    bike: false,
    boxing: false,
    run: false,
  });
  const [saving, setSaving] = useState(false);

  const userWeights = useMemo(() => {
    if (!currentUser) return [];
    return weightsByPerson.get(currentUser.id) || [];
  }, [weightsByPerson, currentUser]);

  const weightsByDate = useMemo(() => {
    const map = new Map();
    for (const entry of userWeights) {
      map.set(dateKey(entry.date), entry);
    }
    return map;
  }, [userWeights]);

  const totalDays = daysInMonth(selectedDate);
  const firstWeekday = dayOfWeek(startOfMonthKey(selectedDate));
  const days = Array.from({ length: totalDays }, (_, index) => index + 1);
  const emptyDays = Array.from({ length: firstWeekday }, (_, index) => index);

  useEffect(() => {
    const entry = weightsByDate.get(selectedDate);
    if (entry) {
      setKg(String(entry.kg));
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
      toast("Selecione um usuário primeiro", "error");
      return;
    }
    if (!kg.trim()) {
      toast("Informe um peso", "error");
      return;
    }

    const value = Number(kg);
    if (Number.isNaN(value)) {
      toast("Peso inválido", "error");
      return;
    }

    const existingEntry = weightsByDate.get(selectedDate);
    const nextEntry = {
      // Reuse the existing id so the database unique constraint on
      // (person_id, date) updates the row instead of rejecting the insert.
      id: existingEntry?.id || uid(),
      personId: currentUser.id,
      date: selectedDate,
      kg: value,
      activities,
      // Keep the note the user may have written in the full editor.
      notes: existingEntry?.notes || "",
    };

    setSaving(true);
    try {
      await saveWeightEntry(nextEntry);
      toast(existingEntry ? "Peso atualizado" : "Peso adicionado", "success");
    } catch (err) {
      toast(err.message || "Não foi possível salvar", "error");
    } finally {
      setSaving(false);
    }
  }, [
    currentUser,
    selectedDate,
    kg,
    activities,
    weightsByDate,
    saveWeightEntry,
    toast,
  ]);

  const onPrevMonth = () => {
    setSelectedDate(addMonths(selectedDate, -1));
  };

  const onNextMonth = () => {
    setSelectedDate(addMonths(selectedDate, 1));
  };

  const getDateClass = (day) => {
    const dateStr = monthDayKey(selectedDate, day);
    let className = "calendar-day";
    if (weightsByDate.has(dateStr)) className += " logged";
    if (dateStr === selectedDate) className += " selected";
    if (dateStr === todayKey()) className += " today";
    return className;
  };

  return (
    <div className="calendar-page">
      <h2>Calendar</h2>
      <p className="calendar-subtitle">
        View and add weights from any date
      </p>

      {/* Month calendar */}
      <section className="calendar-section">
        <div className="calendar-header">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={onPrevMonth}
            aria-label="Mês anterior"
          >
            ← Prev
          </button>
          <h3>{formatMonthYear(selectedDate)}</h3>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={onNextMonth}
            aria-label="Próximo mês"
          >
            Next →
          </button>
        </div>

        <div className="calendar-grid">
          {WEEKDAYS.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="calendar-empty" />
          ))}
          {days.map((day) => {
            const dateStr = monthDayKey(selectedDate, day);
            return (
              <button
                key={day}
                type="button"
                className={getDateClass(day)}
                onClick={() => setSelectedDate(dateStr)}
                aria-label={`Dia ${day}`}
                aria-pressed={selectedDate === dateStr}
              >
                {day}
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick add form */}
      <section className="calendar-section">
        <h3>Add weight for {formatLong(selectedDate)}</h3>

        {weightsByDate.has(selectedDate) && (
          <div className="calendar-logged-note">
            📝 Already logged: {weightsByDate.get(selectedDate).kg} kg
          </div>
        )}

        <div className="calendar-field">
          <label htmlFor="calendar-weight">Weight (kg)</label>
          <input
            id="calendar-weight"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={kg}
            onChange={(event) => setKg(event.target.value)}
            placeholder="e.g. 75.5"
          />
        </div>

        <div className="calendar-field">
          <span>Activities</span>
          <div className="calendar-activities">
            {ACTIVITIES.map(({ key, label, icon }) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={activities[key]}
                  onChange={(event) =>
                    setActivities({
                      ...activities,
                      [key]: event.target.checked,
                    })
                  }
                />
                <span>
                  {icon} {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="primary calendar-submit"
          onClick={onAddWeight}
          disabled={saving}
        >
          {saving
            ? "Salvando…"
            : weightsByDate.has(selectedDate)
              ? "Update weight"
              : "Add weight"}
        </button>
      </section>
    </div>
  );
}
