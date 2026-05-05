import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { loadWeights, loadPeople } from "../utils/storage";

const DataContext = createContext();

export function DataProvider({ children }) {
  const [weights, setWeights] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [weightsData, peopleData] = await Promise.all([
        loadWeights(),
        loadPeople(),
      ]);
      setWeights(weightsData);
      setPeople(peopleData);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWeights = useCallback((newWeights) => {
    setWeights(newWeights);
  }, []);

  const updatePeople = useCallback((newPeople) => {
    setPeople(newPeople);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const value = React.useMemo(
    () => ({
      weights,
      people,
      loading,
      error,
      refreshData,
      updateWeights,
      updatePeople,
    }),
    [weights, people, loading, error, refreshData, updateWeights, updatePeople],
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
