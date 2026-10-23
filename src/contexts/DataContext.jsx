import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  loadWeights,
  loadPeople,
  saveWeight,
  saveWeights,
  deleteWeight,
  savePerson,
  deletePerson,
  uid,
} from "../utils/storage";
import { dateKey } from "../utils/date";
import { removeGoalsForPerson } from "../utils/goals";
import { useToast } from "../components/ToastProvider";

const SELECTED_USER_KEY = "selected_user_id";

const DataContext = createContext(null);

function readStoredUserId() {
  try {
    return window.localStorage.getItem(SELECTED_USER_KEY) || null;
  } catch {
    return null;
  }
}

function writeStoredUserId(id) {
  try {
    if (id) window.localStorage.setItem(SELECTED_USER_KEY, id);
    else window.localStorage.removeItem(SELECTED_USER_KEY);
  } catch {
    /* storage indisponível (modo privado) — segue sem persistir */
  }
}

function sortByDateDesc(list) {
  return [...list].sort((a, b) =>
    dateKey(b.date) < dateKey(a.date) ? -1 : dateKey(b.date) > dateKey(a.date) ? 1 : 0,
  );
}

function upsertLocal(list, entry) {
  const index = list.findIndex((item) => item.id === entry.id);
  if (index === -1) return sortByDateDesc([entry, ...list]);
  const next = list.slice();
  next[index] = { ...next[index], ...entry };
  return sortByDateDesc(next);
}

export function DataProvider({ children }) {
  const toast = useToast();
  const [weights, setWeights] = useState([]);
  const [people, setPeople] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(readStoredUserId);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const weightsRef = useRef(weights);
  const peopleRef = useRef(people);
  useEffect(() => {
    weightsRef.current = weights;
  }, [weights]);
  useEffect(() => {
    peopleRef.current = people;
  }, [people]);

  const refresh = useCallback(async ({ silent = true } = {}) => {
    setIsRefreshing(true);
    // An explicit refresh should clear the previous error right away; a
    // background refresh keeps it until the new data actually arrives.
    if (!silent) setError(null);
    try {
      const [weightsData, peopleData] = await Promise.all([
        loadWeights(),
        loadPeople(),
      ]);
      setWeights(sortByDateDesc(weightsData));
      setPeople(peopleData);
      setError(null);
      setStatus("ready");
    } catch (err) {
      setError(err.message || "Não foi possível carregar os dados.");
      // Keep showing stale data when we already have it; only hard-fail on
      // the very first load, otherwise a network blip blanks the whole app.
      setStatus((current) =>
        current === "ready" ? "ready" : "error",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh({ silent: false });
  }, [refresh]);

  const currentUser = useMemo(() => {
    if (!people.length) return null;
    return (
      people.find((person) => person.id === currentUserId) || people[0] || null
    );
  }, [people, currentUserId]);

  // Keep the stored selection in sync and repair it when the person is gone.
  useEffect(() => {
    if (!people.length) return;
    if (currentUser && currentUser.id !== currentUserId) {
      setCurrentUserId(currentUser.id);
      writeStoredUserId(currentUser.id);
    }
  }, [people, currentUser, currentUserId]);

  const selectUser = useCallback((id) => {
    setCurrentUserId(id);
    writeStoredUserId(id);
  }, []);

  const weightsByPerson = useMemo(() => {
    const map = new Map();
    for (const entry of weights) {
      const bucket = map.get(entry.personId);
      if (bucket) bucket.push(entry);
      else map.set(entry.personId, [entry]);
    }
    return map;
  }, [weights]);

  const saveWeightEntry = useCallback(
    async (entry) => {
      const optimistic = { ...entry, id: entry.id || uid() };
      const previous = weightsRef.current;
      setWeights((current) => upsertLocal(current, optimistic));
      try {
        const saved = await saveWeight(optimistic);
        if (saved && saved.id) {
          // The database may resolve the write onto an existing row (the
          // UNIQUE(person_id, date) pair), returning a different id. Drop both
          // the optimistic row and the row it replaced so the date shows up
          // exactly once in the list.
          setWeights((current) => {
            const next = current.filter(
              (item) => item.id !== optimistic.id && item.id !== saved.id,
            );
            return sortByDateDesc([...next, { ...optimistic, ...saved }]);
          });
        }
        return saved || optimistic;
      } catch (err) {
        setWeights(previous);
        throw err;
      }
    },
    [],
  );

  const removeWeight = useCallback(async (id) => {
    const previous = weightsRef.current;
    setWeights((current) => current.filter((item) => item.id !== id));
    try {
      await deleteWeight(id);
    } catch (err) {
      setWeights(previous);
      throw err;
    }
  }, []);

  const importWeights = useCallback(async (records) => {
    if (!records.length) return [];
    const saved = await saveWeights(records);
    await refresh();
    return saved;
  }, [refresh]);

  const addPerson = useCallback(async (person) => {
    const record = { ...person, id: person.id || uid() };
    const previous = peopleRef.current;
    setPeople((current) => [record, ...current]);
    try {
      await savePerson(record);
      return record;
    } catch (err) {
      setPeople(previous);
      throw err;
    }
  }, []);

  const removePerson = useCallback(async (id) => {
    const previousPeople = peopleRef.current;
    const previousWeights = weightsRef.current;
    // The database cascades the delete to `weights`, so mirror it locally.
    setPeople((current) => current.filter((person) => person.id !== id));
    setWeights((current) => current.filter((entry) => entry.personId !== id));
    try {
      await deletePerson(id);
      // Goals live in localStorage and are not cascaded by the database.
      removeGoalsForPerson(id);
    } catch (err) {
      setPeople(previousPeople);
      setWeights(previousWeights);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      weights,
      people,
      weightsByPerson,
      currentUser,
      currentUserId: currentUser?.id ?? null,
      status,
      loading: status === "loading",
      refreshing: isRefreshing,
      error,
      refresh,
      selectUser,
      saveWeightEntry,
      removeWeight,
      importWeights,
      addPerson,
      removePerson,
      toast,
    }),
    [
      weights,
      people,
      weightsByPerson,
      currentUser,
      status,
      isRefreshing,
      error,
      refresh,
      selectUser,
      saveWeightEntry,
      removeWeight,
      importWeights,
      addPerson,
      removePerson,
      toast,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
