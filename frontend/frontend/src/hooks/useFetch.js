import { useState, useEffect, useCallback } from 'react';
import { handleApiError } from '../services/api';

/**
 * Custom hook for simplified API data fetching with loading state and error handling
 * 
 * @param {Function} apiFunction - The API function to call
 * @param {Array} dependencies - Array of dependencies to trigger refetch
 * @param {boolean} fetchOnMount - Whether to fetch data on mount
 * @returns {Object} - { data, loading, error, refetch }
 */
const useFetch = (apiFunction, dependencies = [], fetchOnMount = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFunction();
      setData(response.data);
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [...dependencies, fetchOnMount]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch; 