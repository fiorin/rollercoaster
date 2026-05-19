import React, { useState, useEffect } from "react";
import { useData } from "../contexts/DataContext";

const SELECTED_USER_KEY = "selected_user_id";

export default function UserSelector({ onUserChange }) {
  const { people } = useData();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!people.length) return;

    const saved = localStorage.getItem(SELECTED_USER_KEY);
    const selectedUserFromStorage = saved
      ? people.find((p) => p.id === saved)
      : null;
    const userToSelect = selectedUserFromStorage || people[0];

    if (!selectedUser || selectedUser.id !== userToSelect.id) {
      setSelectedUser(userToSelect);
      onUserChange?.(userToSelect);
      localStorage.setItem(SELECTED_USER_KEY, userToSelect.id);
    }
  }, [people, onUserChange, selectedUser]);

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
        className={`user-selector ${selectedUser ? "selected" : ""} ${avatarUrl ? "avatar" : ""}`}
        onClick={() => setShowModal(true)}
        title={selectedUser?.name || "Select user"}
        type="button"
        style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
      >
        {selectedUser && !avatarUrl
          ? selectedUser.name.slice(0, 2).toUpperCase()
          : null}
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select User</h3>
            {people.length === 0 ? (
              <p className="empty-state-card">
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
                      type="button"
                    >
                      <div className="person-avatar">
                        {pAvatarUrl ? (
                          <img
                            className="person-avatar-img"
                            src={pAvatarUrl}
                            alt={p.name}
                          />
                        ) : (
                          <div className="person-avatar-fallback">
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
