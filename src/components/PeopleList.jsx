import React, { memo } from "react";

const PeopleList = memo(function PeopleList({ people, onDelete }) {
  const peopleArray = Array.isArray(people) ? people : [];

  if (peopleArray.length === 0) {
    return (
      <div
        style={{
          padding: "32px 16px",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}
      >
        <p>No users yet. Create one above to get started!</p>
      </div>
    );
  }

  return (
    <div className="people-list">
      {peopleArray.map((p) => (
        <div key={p.id} className="person-row">
          <div className="avatar">
            <img
              src={`/avatars/avatar-${p.avatar_id}.png`}
              alt={p.name}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </div>
          <div className="person-info">
            <div className="person-name">{p.name}</div>
          </div>
          <div className="person-actions">
            <button onClick={() => onDelete(p.id)} title="Delete">
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

PeopleList.displayName = "PeopleList";

export default PeopleList;
