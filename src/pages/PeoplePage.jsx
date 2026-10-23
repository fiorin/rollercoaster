import React, { useCallback, useMemo, useState } from "react";
import PeopleForm from "../components/PeopleForm";
import PeopleList from "../components/PeopleList";
import ConfirmDialog from "../components/ConfirmDialog";
import { useData } from "../contexts/DataContext";

export default function PeoplePage() {
  const { people, weights, loading, addPerson, removePerson, selectUser, toast } =
    useData();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const weightCountByPerson = useMemo(() => {
    const counts = new Map();
    for (const entry of weights) {
      counts.set(entry.personId, (counts.get(entry.personId) || 0) + 1);
    }
    return counts;
  }, [weights]);

  const add = useCallback(
    async (person) => {
      setSaving(true);
      try {
        await addPerson(person);
        toast(`${person.name} adicionado`, "success");
      } catch (err) {
        toast(err.message || "Não foi possível adicionar", "error");
        // Re-throw so the form knows the save failed and keeps the input.
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [addPerson, toast],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const person = pendingDelete;
    setPendingDelete(null);
    try {
      await removePerson(person.id);
      toast(`${person.name} removido`, "success");
    } catch (err) {
      toast(err.message || "Não foi possível remover", "error");
    }
  }, [pendingDelete, removePerson, toast]);

  if (loading)
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );

  const affected = pendingDelete
    ? weightCountByPerson.get(pendingDelete.id) || 0
    : 0;

  return (
    <div className="page-body">
      <div className="page-title">
        <h2>Manage Users</h2>
      </div>
      <p className="page-description">
        Add and manage the people you want to track
      </p>
      <PeopleForm onAdd={add} disabled={saving} />
      <PeopleList
        people={people}
        onDelete={setPendingDelete}
        onSelect={(person) => selectUser(person.id)}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Excluir ${pendingDelete?.name || ""}?`}
        message={
          affected > 0
            ? `Isso apaga também ${affected} registro${
                affected === 1 ? "" : "s"
              } de peso de ${pendingDelete?.name}. Não dá para desfazer.`
            : "Essa ação não pode ser desfeita."
        }
        confirmLabel="Excluir tudo"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
