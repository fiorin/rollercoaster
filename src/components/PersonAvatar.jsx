import React, { useEffect, useState } from "react";

export function avatarUrl(avatarId) {
  if (!avatarId) return null;
  return `/avatars/avatar-${avatarId}.png`;
}

export function initials(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function PersonAvatar({ person, className = "" }) {
  const src = avatarUrl(person?.avatar_id);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = src && !failed;

  return (
    <div className={`person-avatar ${className}`}>
      {showImage ? (
        <img
          className="person-avatar-img"
          src={src}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="person-avatar-fallback">
          {initials(person?.name)}
        </div>
      )}
    </div>
  );
}
