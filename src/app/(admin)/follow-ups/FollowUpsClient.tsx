"use client";

import { RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FOLLOW_UP_STATUS_OPTIONS, MAIN_CONCERN_OPTIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/browser";
import { Contact, Interaction } from "@/lib/types";

const PAGE_SIZE = 25;

type LatestInteractions = Record<string, Interaction | undefined>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(value));
}

function sanitizeSearch(value: string) {
  return value.trim().replace(/[,%]/g, " ");
}

function statusLabel(value: string | null) {
  return value || "new";
}

export function FollowUpsClient() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [latestInteractions, setLatestInteractions] = useState<LatestInteractions>({});
  const [suburbs, setSuburbs] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [suburb, setSuburb] = useState("");
  const [mainConcern, setMainConcern] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, mainConcern, status, suburb]);

  useEffect(() => {
    async function loadSuburbs() {
      const supabase = createClient();
      const { data } = await supabase
        .from("contacts")
        .select("suburb")
        .eq("follow_up_needed", true)
        .not("suburb", "is", null)
        .order("suburb", { ascending: true })
        .limit(1000);

      const uniqueSuburbs = Array.from(
        new Set((data || []).map((row) => row.suburb).filter(Boolean))
      ).sort();
      setSuburbs(uniqueSuburbs);
    }

    void loadSuburbs();
  }, [reloadKey]);

  useEffect(() => {
    async function loadFollowUps() {
      setLoading(true);
      setError("");

      const supabase = createClient();
      let query = supabase
        .from("contacts")
        .select("*", { count: "exact" })
        .eq("follow_up_needed", true);

      const safeSearch = sanitizeSearch(debouncedSearch);
      if (safeSearch) {
        const pattern = `%${safeSearch}%`;
        query = query.or(`full_name.ilike.${pattern},mobile.ilike.${pattern},email.ilike.${pattern}`);
      }

      if (status) {
        query = query.eq("follow_up_status", status);
      }

      if (suburb) {
        query = query.eq("suburb", suburb);
      }

      if (mainConcern) {
        query = query.eq("main_concern", mainConcern);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error: loadError, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (loadError) {
        setError("Could not load follow-ups.");
        setContacts([]);
        setLatestInteractions({});
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const loadedContacts = (data || []) as Contact[];
      setContacts(loadedContacts);
      setTotalCount(count || 0);

      const contactIds = loadedContacts.map((contact) => contact.id);
      if (contactIds.length === 0) {
        setLatestInteractions({});
        setLoading(false);
        return;
      }

      const { data: interactionRows } = await supabase
        .from("interactions")
        .select("*")
        .in("contact_id", contactIds)
        .order("created_at", { ascending: false })
        .limit(contactIds.length * 3);

      const latestByContact = ((interactionRows || []) as Interaction[]).reduce<LatestInteractions>(
        (accumulator, interaction) => {
          if (!accumulator[interaction.contact_id]) {
            accumulator[interaction.contact_id] = interaction;
          }
          return accumulator;
        },
        {}
      );

      setLatestInteractions(latestByContact);
      setLoading(false);
    }

    void loadFollowUps();
  }, [debouncedSearch, mainConcern, page, reloadKey, status, suburb]);

  const rangeLabel = useMemo(() => {
    if (totalCount === 0) {
      return "0 open follow-ups";
    }

    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, totalCount);
    return `${from}-${to} shown from ${totalCount} open follow-ups`;
  }, [page, totalCount]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Follow-ups</h2>
          <p className="mt-1 text-sm text-muted">{rangeLabel}</p>
        </div>
        <button
          type="button"
          className="button-secondary"
          onClick={() => setReloadKey((current) => current + 1)}
          disabled={loading}
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <section className="panel p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2 lg:col-span-1">
            <span className="label">Search</span>
            <span className="relative block">
              <Search aria-hidden="true" className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                className="input pl-9"
                placeholder="Name, mobile, email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </span>
          </label>
          <label className="space-y-2">
            <span className="label">Status</span>
            <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All open statuses</option>
              {FOLLOW_UP_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="label">Suburb</span>
            <select className="input" value={suburb} onChange={(event) => setSuburb(event.target.value)}>
              <option value="">All suburbs</option>
              {suburbs.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="label">Concern</span>
            <select className="input" value={mainConcern} onChange={(event) => setMainConcern(event.target.value)}>
              <option value="">All concerns</option>
              {MAIN_CONCERN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p> : null}

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Mobile</th>
                <th className="table-th">Suburb</th>
                <th className="table-th">Main Concern</th>
                <th className="table-th">Status</th>
                <th className="table-th">Latest Interaction</th>
                <th className="table-th">Created At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="table-td" colSpan={7}>
                    Loading follow-ups...
                  </td>
                </tr>
              ) : contacts.length > 0 ? (
                contacts.map((contact) => {
                  const latestInteraction = latestInteractions[contact.id];
                  return (
                    <tr
                      key={contact.id}
                      tabIndex={0}
                      className="cursor-pointer transition hover:bg-panel focus:bg-panel focus:outline-none"
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          router.push(`/contacts/${contact.id}`);
                        }
                      }}
                    >
                      <td className="table-td font-semibold">{contact.full_name}</td>
                      <td className="table-td">{contact.mobile || "-"}</td>
                      <td className="table-td">{contact.suburb}</td>
                      <td className="table-td">{contact.main_concern || "-"}</td>
                      <td className="table-td">
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                          {statusLabel(contact.follow_up_status)}
                        </span>
                      </td>
                      <td className="table-td max-w-xs truncate">
                        {latestInteraction
                          ? `${latestInteraction.interaction_type || "other"}: ${latestInteraction.summary}`
                          : "-"}
                      </td>
                      <td className="table-td">{formatDate(contact.created_at)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="table-td" colSpan={7}>
                    No open follow-ups match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Page {Math.min(page, totalPages)} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="button-secondary"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
