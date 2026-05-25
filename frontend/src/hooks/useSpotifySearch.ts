import { useEffect, useRef, useState } from 'react';
import * as spotifyApi from '../api/spotifyApi';
import type { SearchResults } from '../types/music';

const EMPTY_RESULTS: SearchResults = { albums: [], tracks: [], artists: [], playlists: [] };

export interface SpotifySearchState {
  results: SearchResults;
  loading: boolean;
  error: string | null;
  query: string;
}

export function useSpotifySearch(connected: boolean) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    if (!connected || query.trim().length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      spotifyApi
        .search(query)
        .then((data) => {
          setResults(data);
          setLoading(false);
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Search failed';
          setError(message);
          setResults(EMPTY_RESULTS);
          setLoading(false);
        });
    }, 350);

    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, [query, connected]);

  function clearSearch() {
    setQuery('');
    setResults(EMPTY_RESULTS);
    setError(null);
  }

  return { query, setQuery, results, loading, error, clearSearch };
}
