import React, { useState, useMemo, lazy, Suspense, useCallback } from "react";
import { useData } from "../contexts/DataContext";
import WeightList from "../components/WeightList";
import ConfirmDialog from "../components/ConfirmDialog";
import { dateKey, monthOf, yearOf } from "../utils/date";

const WeightModal = lazy(() => import("../components/WeightModal"));

const monthOptions = [
  { value: "all", label: "All months" },
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

export default function WeightsPage() {
  const {
    weightsByPerson,
    people,
    loading,
    currentUser,
    saveWeightEntry,
    removeWeight,
    toast,
  } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const userWeights = useMemo(() => {
    if (!currentUser) return [];
    return weightsByPerson.get(currentUser.id) || [];
  }, [weightsByPerson, currentUser]);

  const yearOptions = useMemo(() => {
    const years = [...new Set(userWeights.map((w) => yearOf(w.date)))];
    return years.sort((a, b) => b - a);
  }, [userWeights]);

  React.useEffect(() => {
    if (!yearOptions.length) {
      if (selectedYear && selectedYear !== "all") setSelectedYear("all");
      return;
    }
    const valid =
      selectedYear === "all" ||
      yearOptions.some((year) => String(year) === selectedYear);
    if (!valid) setSelectedYear(String(yearOptions[0]));
  }, [yearOptions, selectedYear]);

  const filteredWeights = useMemo(() => {
    let next = userWeights;
    if (selectedYear && selectedYear !== "all") {
      next = next.filter((w) => String(yearOf(w.date)) === selectedYear);
    }
    if (selectedMonth !== "all") {
      next = next.filter(
        (w) => String(monthOf(w.date)).padStart(2, "0") === selectedMonth,
      );
    }
    return next;
  }, [userWeights, selectedYear, selectedMonth]);

  const addOrUpdate = useCallback(
    async (entry) => {
      setSaving(true);
      try {
        await saveWeightEntry(entry);
        toast(
          entry.id ? "Registro atualizado" : "Registro salvo",
          "success",
        );
        setOpen(false);
        setEditing(null);
      } catch (err) {
        toast(err.message || "Não foi possível salvar", "error");
      } finally {
        setSaving(false);
      }
    },
    [saveWeightEntry, toast],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    try {
      await removeWeight(id);
      toast("Registro excluído", "success");
    } catch (err) {
      toast(err.message || "Não foi possível excluir", "error");
    }
  }, [pendingDelete, removeWeight, toast]);

  if (loading)
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="weights-container">
      <div className="weights-header">
        <h2>Weight Entries</h2>
        {currentUser ? (
          <p className="weights-info">{currentUser.name}</p>
        ) : (
          <p className="weights-info">Select a user to view their weights</p>
        )}
      </div>

      <div className="weights-content">
        {currentUser ? (
          <>
            <div className="weights-filters">
              <div className="form-field weights-filter">
                <span className="field-label">Year</span>
                <select
                  className="form-control"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="all">All years</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field weights-filter">
                <span className="field-label">Month</span>
                <select
                  className="form-control"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {filteredWeights.length === 0 ? (
              <div className="empty-state-card">
                <p style={{ fontSize: "16px", margin: "0 0 8px 0" }}>
                  No weight entries found for this period
                </p>
                <p style={{ fontSize: "14px", margin: 0 }}>
                  Use the year and month filters to narrow your data.
                </p>
              </div>
            ) : (
              <WeightList
                weights={filteredWeights}
                people={people}
                onEdit={(w) => {
                  setEditing(w);
                  setOpen(true);
                }}
                onDelete={(w) => setPendingDelete(w)}
              />
            )}
          </>
        ) : (
          <div className="empty-state-card">
            <p>👤 Please select a user from the top right to view their weights</p>
          </div>
        )}
      </div>

      {currentUser && (
        <button
          className="add-weight-fab"
          type="button"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          title="Add new weight entry"
          aria-label="Adicionar registro de peso"
        >
          ➕
        </button>
      )}

      {open && (
        <Suspense
          fallback={
            <div className="spinner-container">
              <div className="spinner" />
            </div>
          }
        >
          <WeightModal
            key={editing?.id || "new"}
            open={open}
            onClose={() => {
              setOpen(false);
              setEditing(null);
            }}
            onSave={addOrUpdate}
            initial={editing}
            people={people}
            currentUser={currentUser}
            saving={saving}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Excluir registro?"
        message={
          pendingDelete
            ? `Apagar o registro de ${dateKey(pendingDelete.date)} (${pendingDelete.kg} kg)? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
