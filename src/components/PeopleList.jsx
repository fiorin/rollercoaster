import React, { memo } from "react";
import PersonAvatar from "./PersonAvatar";

const PeopleList = memo(function PeopleList({ people, onDelete, onSelect }) {
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
      {peopleArray.map((person) => (
        <div key={person.id} className="person-row">
          <div className="avatar">
            <PersonAvatar person={person} />
          </div>
          <div
            className="person-info"
            onClick={() => onSelect?.(person)}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={
              onSelect
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(person);
                    }
                  }
                : undefined
            }
          >
            <div className="person-name">{person.name}</div>
          </div>
          <div className="person-actions">
            <button
              type="button"
              onClick={() => onDelete(person)}
              title={`Excluir ${person.name}`}
              aria-label={`Excluir ${person.name}`}
            >
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
