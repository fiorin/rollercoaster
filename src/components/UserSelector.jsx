import React, { useEffect, useRef, useState } from "react";
import { useData } from "../contexts/DataContext";
import PersonAvatar from "./PersonAvatar";
import useFocusTrap from "../hooks/useFocusTrap";

export default function UserSelector() {
  const { people, currentUser, selectUser } = useData();
  const [showModal, setShowModal] = useState(false);
  const dialogRef = useRef(null);

  useFocusTrap(dialogRef, showModal);

  useEffect(() => {
    if (!showModal) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") setShowModal(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  function handleSelect(person) {
    selectUser(person.id);
    setShowModal(false);
  }

  return (
    <>
      <button
        className={`user-selector ${currentUser ? "selected" : ""}`}
        onClick={() => setShowModal(true)}
        title={currentUser?.name || "Selecionar usuário"}
        aria-label={currentUser ? `Usuário: ${currentUser.name}` : "Selecionar usuário"}
        type="button"
      >
        {currentUser ? (
          <PersonAvatar person={currentUser} className="user-selector-avatar" />
        ) : (
          <span aria-hidden="true">👤</span>
        )}
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            ref={dialogRef}
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-label="Selecionar usuário"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Select User</h3>
            {people.length === 0 ? (
              <p className="empty-state-card">
                Nenhum usuário ainda. Vá em &quot;Manage Users&quot; para criar
                um.
              </p>
            ) : (
              <div className="people-list">
                {people.map((person) => (
                  <button
                    key={person.id}
                    className={`person-avatar-button ${
                      currentUser?.id === person.id ? "active" : ""
                    }`}
                    onClick={() => handleSelect(person)}
                    type="button"
                  >
                    <PersonAvatar person={person} />
                    <span className="person-name">{person.name}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
