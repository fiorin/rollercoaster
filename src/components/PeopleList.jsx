import React, { memo } from "react";

const PeopleList = memo(function PeopleList({ people, onDelete }) {
  const peopleArray = Array.isArray(people) ? people : [];

  if (peopleArray.length === 0) {
    return (
      <div className="empty-state-card">
        <p>No users yet. Create one above to get started!</p>
      </div>
    );
  }

  return (
    <div className="people-list">
      {peopleArray.map((p) => {
        const avatarId = p.avatar_id || p.avatar || 1;
        return (
          <div key={p.id} className="person-row">
            <div className="avatar">
              <img src={`/avatars/avatar-${avatarId}.png`} alt={p.name} />
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
        );
      })}
    </div>
  );
});

PeopleList.displayName = "PeopleList";

export default PeopleList;
