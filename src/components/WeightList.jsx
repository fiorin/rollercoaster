import React, { useMemo, useRef, useEffect, useState } from "react";
import { ACTIVITIES } from "../utils/activities";
import { formatShort } from "../utils/date";

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
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef(null);

  const sortedWeights = useMemo(
    () =>
      [...weights].sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
      ),
    [weights],
  );

  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER * 2;
  const visibleStartClamped = Math.max(0, visibleStart - BUFFER);
  const visibleEnd = Math.min(
    sortedWeights.length,
    visibleStartClamped + visibleCount,
  );

  const visibleItems = sortedWeights.slice(visibleStartClamped, visibleEnd);
  const offsetY = visibleStartClamped * ITEM_HEIGHT;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(() => {
      setContainerHeight(container.clientHeight);
    });
    observer.observe(container);

    function handleScroll() {
      setVisibleStart(Math.floor(container.scrollTop / ITEM_HEIGHT));
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="weight-list-scroll">
      <div
        className="weight-list"
        style={{ height: `${sortedWeights.length * ITEM_HEIGHT}px` }}
      >
        <div
          className="weight-list-window"
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {visibleItems.map((entry) => (
            <div
              className="weight-row"
              key={entry.id}
              style={{ height: `${ITEM_HEIGHT}px` }}
            >
              <div className="w-main">
                <div className="w-date">{formatShort(entry.date)}</div>
                <div className="w-person">
                  {personMap[entry.personId] || "-"}
                </div>
              </div>
              <div className="w-weight">{entry.kg} kg</div>
              <div className="w-activities">
                {ACTIVITIES.map((activity) => (
                  <div
                    key={activity.key}
                    className={`activity-indicator ${activity.key} ${
                      entry.activities?.[activity.key] ? "active" : "inactive"
                    }`}
                    title={activity.label}
                  >
                    {activity.icon}
                  </div>
                ))}
              </div>
              <div className="w-menu">
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  title="Edit"
                  aria-label={`Editar registro de ${formatShort(entry.date)}`}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry)}
                  title="Delete"
                  aria-label={`Excluir registro de ${formatShort(entry.date)}`}
                >
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
