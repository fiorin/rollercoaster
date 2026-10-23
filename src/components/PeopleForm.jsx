import React, { memo, useState } from "react";
import { uid } from "../utils/storage";

const AVAILABLE_AVATARS = [1, 2, 3, 4];

function AvatarOption({ id, selected, onSelect }) {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      className={`avatar-btn ${selected ? "sel" : ""}`}
      onClick={() => onSelect(id)}
      aria-label={`Avatar ${id}`}
      aria-pressed={selected}
    >
      {failed ? (
        <span className="avatar-fallback">{id}</span>
      ) : (
        <img
          src={`/avatars/avatar-${id}.png`}
          alt=""
          onError={() => setFailed(true)}
        />
      )}
    </button>
  );
}

function PeopleForm({ onAdd, disabled = false }) {
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      // Only clear the form once the save actually succeeded; on a failure the
      // caller shows a toast and the user keeps what they typed.
      await onAdd({ id: uid(), name: trimmed, avatar_id: avatarId });
      setName("");
      setAvatarId(1);
    } catch {
      /* handled by the caller */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="people-form card" onSubmit={submit}>
      <div className="form-field">
        <label className="field-label" htmlFor="person-name">
          Name
        </label>
        <input
          id="person-name"
          className="form-control"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
        />
      </div>

      <div className="form-field">
        <span className="field-label">Avatar</span>
        <div className="avatars">
          {AVAILABLE_AVATARS.map((id) => (
            <AvatarOption
              key={id}
              id={id}
              selected={avatarId === id}
              onSelect={setAvatarId}
            />
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button
          className="primary"
          type="submit"
          disabled={disabled || submitting}
        >
          {submitting ? "Adding…" : "Add person"}
        </button>
      </div>
    </form>
  );
}

export default memo(PeopleForm);
