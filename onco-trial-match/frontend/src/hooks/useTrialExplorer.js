// src/hooks/useTrialExplorer.js
// Custom hook — handles all state and API calls for the explorer

import { useState, useCallback } from "react";
import { fetchTrialsByCancer } from "../services/clinicalTrialsAPI";

export function useTrialExplorer() {
    const [selectedCancer, setSelectedCancer] = useState(null);
    const [trials, setTrials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [filters, setFilters] = useState({ status: "RECRUITING", phase: "" });
    const [searchText, setSearchText] = useState("");

    const loadTrials = useCallback(async (cancerType, activeFilters, append = false) => {
        if (!cancerType) return;
        setLoading(true);
        setError(null);

        try {
            const result = await fetchTrialsByCancer(cancerType.keywords, {
                ...activeFilters,
                pageToken: append ? nextPageToken : null,
            });

            setTrials(prev => append ? [...prev, ...result.trials] : result.trials);
            setNextPageToken(result.nextPageToken);
            setTotal(result.total);
        } catch (err) {
            setError("Failed to load trials. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [nextPageToken]);

    const selectCancer = useCallback((cancerType) => {
        setSelectedCancer(cancerType);
        setTrials([]);
        setNextPageToken(null);
        loadTrials(cancerType, filters);
    }, [filters, loadTrials]);

    const applyFilter = useCallback((newFilters) => {
        const updated = { ...filters, ...newFilters };
        setFilters(updated);
        if (selectedCancer) loadTrials(selectedCancer, updated);
    }, [filters, selectedCancer, loadTrials]);

    const loadMore = useCallback(() => {
        if (nextPageToken && selectedCancer) {
            loadTrials(selectedCancer, filters, true);
        }
    }, [nextPageToken, selectedCancer, filters, loadTrials]);

    // Client-side search filter
    const filteredTrials = searchText
        ? trials.filter(t =>
            t.title.toLowerCase().includes(searchText.toLowerCase()) ||
            t.summary.toLowerCase().includes(searchText.toLowerCase()) ||
            t.interventions.toLowerCase().includes(searchText.toLowerCase())
        )
        : trials;

    return {
        selectedCancer, selectCancer,
        trials: filteredTrials,
        loading, error, total,
        hasMore: !!nextPageToken,
        loadMore,
        filters, applyFilter,
        searchText, setSearchText,
    };
}