import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import ActivityButtons from "./ActivityButtons";

export default function WeightModal({
  open,
  onClose,
  onSave,
  initial,
  people,
  currentUser,
}) {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [kg, setKg] = useState("");
  const [activities, setActivities] = useState({
    gym: false,
    bike: false,
    boxing: false,
    run: false,
  });
  const [personId, setPersonId] = useState(
    currentUser?.id || people[0]?.id || "",
  );

  useEffect(() => {
    if (initial) {
      setDate(initial.date.slice(0, 10));
      setKg(initial.kg);
      setActivities(initial.activities || {});
      setPersonId(initial.personId);
    } else {
      setDate(dayjs().format("YYYY-MM-DD"));
      setKg("");
      setActivities({
        gym: false,
        bike: false,
        boxing: false,
        run: false,
      });
      setPersonId(currentUser?.id || people[0]?.id || "");
    }
  }, [initial, currentUser, people, open]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    if (!kg || !personId) return;
    onSave({
      ...initial,
      id: initial?.id || undefined,
      personId,
      date: date,
      kg: Number(kg),
      activities,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-content"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{initial ? "Edit Weight Entry" : "Add Weight Entry"}</h3>

        {!currentUser && (
          <label>
            Person
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              required
            >
              <option value="">Select a person</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label>
          Weight (kg)
          <input
            type="number"
            step="0.1"
            min="0"
            max="300"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            placeholder="Enter weight in kg"
            required
          />
        </label>

        <div style={{ marginTop: "16px" }}>
          <div
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              marginBottom: "8px",
            }}
          >
            Activities
          </div>
          <ActivityButtons activities={activities} onChange={setActivities} />
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            {initial ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
