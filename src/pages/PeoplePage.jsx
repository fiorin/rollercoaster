import React, { useCallback } from "react";
import PeopleForm from "../components/PeopleForm";
import PeopleList from "../components/PeopleList";
import { savePeople } from "../utils/storage";
import { useData } from "../contexts/DataContext";

export default function PeoplePage() {
  const { people, loading, updatePeople } = useData();

  const add = useCallback(
    async (p) => {
      const next = [...people, p];
      updatePeople(next);
      try {
        await savePeople(next);
      } catch (err) {
        console.error("Error saving people", err);
      }
    },
    [people, updatePeople],
  );

  const del = useCallback(
    async (id) => {
      const next = people.filter((p) => p.id !== id);
      updatePeople(next);
      try {
        await savePeople(next);
      } catch (err) {
        console.error("Error deleting person", err);
      }
    },
    [people, updatePeople],
  );

  if (loading)
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="page-body">
      <div className="page-title">
        <h2>Manage Users</h2>
      </div>
      <p className="page-description">
        Add and manage the people you want to track
      </p>
      <PeopleForm onAdd={add} />
      <PeopleList people={people} onDelete={del} />
    </div>
  );
}
