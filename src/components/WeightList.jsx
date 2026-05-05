import React, { useMemo, useRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import { ACTIVITIES } from "../utils/activities";

const ITEM_HEIGHT = 60;
const BUFFER = 5;

const WeightList = React.memo(function WeightList({
  weights,
  people,
  onEdit,
  onDelete,
}) {
  const personMap = useMemo(
    () =>
      people.reduce((memo, person) => {
        memo[person.id] = person.name;
        return memo;
      }, {}),
    [people],
  );

  const [visibleStart, setVisibleStart] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef(null);

  function personName(id) {
    return personMap[id] || "-";
  }

  const sortedWeights = useMemo(
    () => [...weights].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [weights],
  );

  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER * 2;
  const visibleStart_ = Math.max(0, visibleStart - BUFFER);
  const visibleEnd = Math.min(
    sortedWeights.length,
    visibleStart_ + visibleCount,
  );

  const visibleItems = sortedWeights.slice(visibleStart_, visibleEnd);
  const offsetY = visibleStart_ * ITEM_HEIGHT;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      setContainerHeight(container.clientHeight);
    });
    observer.observe(container);

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      setVisibleStart(Math.floor(scrollTop / ITEM_HEIGHT));
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="weight-list"
      style={{
        height: "600px",
        overflow: "auto",
        position: "relative",
      }}
    >
      <div
        style={{
          height: `${sortedWeights.length * ITEM_HEIGHT}px`,
          position: "relative",
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((w) => (
            <div
              className="weight-row"
              key={w.id}
              style={{ height: `${ITEM_HEIGHT}px` }}
            >
              <div className="w-main">
                <div className="w-date">{dayjs(w.date).format("MMM DD")}</div>
                <div className="w-person">{personName(w.personId)}</div>
              </div>
              <div className="w-weight">{w.kg} kg</div>
              <div className="w-activities">
                {ACTIVITIES.map((activity) => (
                  <div
                    key={activity.key}
                    className={`activity-indicator ${activity.key} ${w.activities?.[activity.key] ? "active" : "inactive"}`}
                    title={activity.label}
                  >
                    {activity.icon}
                  </div>
                ))}
              </div>
              <div className="w-menu">
                <button onClick={() => onEdit(w)} title="Edit">
                  ✏️
                </button>
                <button onClick={() => onDelete(w.id)} title="Delete">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

WeightList.displayName = "WeightList";

export default WeightList;
