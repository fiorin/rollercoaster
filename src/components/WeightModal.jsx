import React, { useEffect, useRef, useState } from "react";
import ActivityButtons from "./ActivityButtons";
import useFocusTrap from "../hooks/useFocusTrap";
import { dateKey, todayKey } from "../utils/date";

const EMPTY_ACTIVITIES = { gym: false, bike: false, boxing: false, run: false };

/** Opening the keyboard on a phone covers the form, so only auto-focus on desktop. */
function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

export default function WeightModal({
  open,
  onClose,
  onSave,
  initial,
  people,
  currentUser,
  saving = false,
}) {
  // State is seeded on mount. The parent unmounts this component when the
  // modal closes and remounts it with a new `key` when switching between
  // "new" and "edit", so the form can never be reset mid-typing by an
  // unrelated identity change (people list, current user, ...).
  const [date, setDate] = useState(() =>
    initial ? dateKey(initial.date) : todayKey(),
  );
  const [kg, setKg] = useState(() => (initial ? String(initial.kg) : ""));
  const [notes, setNotes] = useState(() => initial?.notes || "");
  const [activities, setActivities] = useState(() => ({
    ...EMPTY_ACTIVITIES,
    ...(initial?.activities || {}),
  }));
  const [personId, setPersonId] = useState(
    () => initial?.personId || currentUser?.id || people[0]?.id || "",
  );

  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, saving]);

  if (!open) return null;

  function submit(event) {
    event.preventDefault();
    const value = Number(kg);
    if (!kg || !personId || Number.isNaN(value)) return;
    onSave({
      ...initial,
      id: initial?.id || undefined,
      personId,
      date,
      kg: value,
      activities,
      notes: notes.trim(),
    });
  }

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <form
        ref={dialogRef}
        className="modal-content"
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={initial ? "Edit Weight Entry" : "Add Weight Entry"}
      >
        <h3>{initial ? "Edit Weight Entry" : "Add Weight Entry"}</h3>

        {!currentUser && (
          <div className="form-field">
            <span className="field-label">Person</span>
            <select
              className="form-control"
              value={personId}
              onChange={(event) => setPersonId(event.target.value)}
              required
            >
              <option value="">Select a person</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-field">
          <span className="field-label">Date</span>
          <input
            className="form-control"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <span className="field-label">Weight (kg)</span>
          <input
            className="form-control"
            type="number"
            inputMode="decimal"
            enterKeyHint="done"
            step="0.1"
            min="0"
            max="300"
            value={kg}
            onChange={(event) => setKg(event.target.value)}
            placeholder="Enter weight in kg"
            autoFocus={!isTouchDevice()}
            required
          />
        </div>

        <div className="form-field">
          <span className="field-label">Activities</span>
          <ActivityButtons activities={activities} onChange={setActivities} />
        </div>

        <div className="form-field">
          <span className="field-label">Notes</span>
          <input
            className="form-control"
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional"
            maxLength={280}
          />
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? "Salvando…" : initial ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
