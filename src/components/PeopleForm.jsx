import React, { memo, useState } from "react";
import { uid } from "../utils/storage";

function PeopleForm({ onAdd }) {
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState(1);

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ id: uid(), name: name.trim(), avatar_id: avatarId });
    setName("");
    setAvatarId(1);
  }

  return (
    <form className="people-form card" onSubmit={submit}>
      <div className="form-field">
        <label className="field-label">Name</label>
        <input
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
      </div>

      <div className="form-field">
        <label className="field-label">Avatar</label>
        <div className="avatars">
          {Array.from({ length: 2 }).map((_, i) => {
            const n = i + 1;
            return (
              <button
                type="button"
                key={n}
                className={`avatar-btn ${avatarId === n ? "sel" : ""}`}
                onClick={() => setAvatarId(n)}
              >
                <img src={`/avatars/avatar-${n}.png`} alt={`Avatar ${n}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-actions">
        <button className="primary" type="submit">
          Add person
        </button>
      </div>
    </form>
  );
}

export default memo(PeopleForm);
