import React, { useState, useEffect } from "react";
import { useData } from "../contexts/DataContext";

const SELECTED_USER_KEY = "selected_user_id";

export default function UserSelector({ onUserChange }) {
  const { people } = useData();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SELECTED_USER_KEY);
    if (saved) {
      const user = people.find((p) => p.id === saved);
      if (user) {
        setSelectedUser(user);
        onUserChange?.(user);
      }
    }
  }, [people, onUserChange]);

  const selectUser = (user) => {
    setSelectedUser(user);
    localStorage.setItem(SELECTED_USER_KEY, user.id);
    onUserChange?.(user);
    setShowModal(false);
  };

  const avatarUrl = selectedUser?.avatar_id
    ? `/avatars/avatar-${selectedUser.avatar_id}.png`
    : null;

  return (
    <>
      <button
        className="user-selector"
        onClick={() => setShowModal(true)}
        title={selectedUser?.name || "Select user"}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: selectedUser
            ? avatarUrl
              ? "transparent"
              : "var(--accent)"
            : "var(--bg-light)",
          backgroundImage: avatarUrl ? `url(${avatarUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          cursor: "pointer",
          border: "2px solid var(--border-color)",
          padding: 0,
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!avatarUrl && selectedUser
          ? selectedUser.name.slice(0, 2).toUpperCase()
          : !selectedUser && "👤"}
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select User</h3>
            {people.length === 0 ? (
              <p
                style={{
                  color: "var(--text-secondary)",
                  textAlign: "center",
                  margin: "24px 0",
                }}
              >
                No users yet. Go to "Manage Users" to create one.
              </p>
            ) : (
              <div className="people-list">
                {people.map((p) => {
                  const pAvatarUrl = `/avatars/avatar-${p.avatar_id}.png`;
                  return (
                    <button
                      key={p.id}
                      className="person-avatar-button"
                      onClick={() => selectUser(p)}
                    >
                      <div className="person-avatar">
                        {pAvatarUrl ? (
                          <img
                            src={pAvatarUrl}
                            alt={p.name}
                            style={{
                              width: "60px",
                              height: "60px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "60px",
                              height: "60px",
                              borderRadius: "50%",
                              backgroundColor: "var(--accent)",
                              color: "white",
                              fontSize: "20px",
                              fontWeight: "bold",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="person-name">{p.name}</span>
                    </button>
                  );
                })}
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
