import React, { memo, useState } from "react";
import { uid } from "../utils/storage";

function PeopleForm({ onAdd }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(1);
  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ id: uid(), name: name.trim(), avatar: avatar });
    setName("");
  }

  return (
    <form className="people-form" onSubmit={submit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <div className="avatars">
        {Array.from({ length: 2 }).map((_, i) => {
          const n = i + 1;
          return (
            <button
              type="button"
              key={n}
              className={"avatar-btn " + (avatar === n ? "sel" : "")}
              onClick={() => setAvatar(n)}
            >
              <img
                src={`/avatars/avatar-${n}.png`}
                alt={`Avatar ${n}`}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            </button>
          );
        })}
      </div>
      <button className="primary">Add person</button>
    </form>
  );
}

export default memo(PeopleForm);
