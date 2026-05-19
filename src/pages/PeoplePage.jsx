import React, { useCallback } from "react";
import PeopleForm from "../components/PeopleForm";
import PeopleList from "../components/PeopleList";
import { savePerson, deletePerson } from "../utils/storage";
import { useData } from "../contexts/DataContext";

export default function PeoplePage() {
  const { people, loading, updatePeople } = useData();

  const add = useCallback(
    async (p) => {
      const previous = people;
      const next = [...people, p];
      updatePeople(next);
      try {
        await savePerson(p);
      } catch (err) {
        console.error("Error saving people", err);
        updatePeople(previous);
      }
    },
    [people, updatePeople],
  );

  const del = useCallback(
    async (id) => {
      const previous = people;
      const next = people.filter((p) => p.id !== id);
      updatePeople(next);
      try {
        await deletePerson(id);
      } catch (err) {
        console.error("Error deleting person", err);
        updatePeople(previous);
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
