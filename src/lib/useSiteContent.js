import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { STORIES, EVENTS } from "@/lib/siteData";

// Loads live, synced content from the database; falls back to the hardcoded
// siteData entries when the sync has not produced anything yet.
function useSynced(entityName, fallback, sortField = "-sync_date", limit = 30) {
  const [items, setItems] = useState(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await base44.entities[entityName].list(sortField, limit);
        if (active && Array.isArray(list) && list.length) setItems(list);
      } catch (e) {
        // keep fallback data
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [entityName]);

  return { items, loading };
}

export function useStories() {
  return useSynced("NewsArticle", STORIES);
}

export function useEvents() {
  return useSynced("EventItem", EVENTS);
}