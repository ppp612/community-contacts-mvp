"use client";

import { Download, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MAIN_CONCERN_OPTIONS, SOURCE_OPTIONS } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/browser";
import { Contact } from "@/lib/types";

const PAGE_SIZE = 25;
const EXPORT_LIMIT = 1000;

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

function contactToCsvRow(contact: Contact) {
  return {
    id: contact.id,
    full_name: contact.full_name,
    mobile: contact.mobile,
    email: contact.email,
    suburb: contact.suburb,
    address: contact.address,
    language_preference: contact.language_preference,
    main_concern: contact.main_concern,
    location_detail: contact.location_detail,
    source: contact.source,
    volunteer_interest: contact.volunteer_interest,
    membership_interest: contact.membership_interest,
    consent: contact.consent,
    follow_up_needed: contact.follow_up_needed,
    follow_up_status: contact.follow_up_status,
    notes: contact.notes,
    message: contact.message,
    created_at: contact.created_at,
    updated_at: contact.updated_at
  };
}

function StatusBadge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "green" | "slate" }) {
  const classes =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${classes}`}>
      {children}
    </span>
  );
}

export function ContactsClient() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [suburbs, setSuburbs] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [suburb, setSuburb] = useState("");
  const [source, setSource] = useState("");
  const [mainConcern, setMainConcern] = useState("");
  const [volunteer, setVolunteer] = useState("");
  const [followUp, setFollowUp] = useState("");
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
  }, [debouncedSearch, followUp, mainConcern, source, suburb, volunteer]);

  useEffect(() => {
    async function loadSuburbs() {
      const supabase = createClient();
      const { data } = await supabase
        .from("contacts")
        .select("suburb")
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
    async function loadContacts() {
      setLoading(true);
      setError("");
      setNotice("");

      const supabase = createClient();
      let query = supabase.from("contacts").select("*", { count: "exact" });

      const safeSearch = sanitizeSearch(debouncedSearch);
      if (safeSearch) {
        const pattern = `%${safeSearch}%`;
        query = query.or(`full_name.ilike.${pattern},mobile.ilike.${pattern},email.ilike.${pattern}`);
      }

      if (suburb) {
        query = query.eq("suburb", suburb);
      }

      if (source) {
        query = query.eq("source", source);
      }

      if (mainConcern) {
        query = query.eq("main_concern", mainConcern);
      }

      if (volunteer) {
        query = query.eq("volunteer_interest", volunteer === "yes");
      }

      if (followUp) {
        query = query.eq("follow_up_needed", followUp === "yes");
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error: loadError, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (loadError) {
        setError("Could not load contacts.");
      } else {
        setContacts((data || []) as Contact[]);
        setTotalCount(count || 0);
      }

      setLoading(false);
    }

    void loadContacts();
  }, [debouncedSearch, followUp, mainConcern, page, reloadKey, source, suburb, volunteer]);

  async function exportFilteredContacts() {
    setExporting(true);
    setError("");
    setNotice("");

    const supabase = createClient();
    let query = supabase.from("contacts").select("*");

    const safeSearch = sanitizeSearch(debouncedSearch);
    if (safeSearch) {
      const pattern = `%${safeSearch}%`;
      query = query.or(`full_name.ilike.${pattern},mobile.ilike.${pattern},email.ilike.${pattern}`);
    }

    if (suburb) {
      query = query.eq("suburb", suburb);
    }

    if (source) {
      query = query.eq("source", source);
    }

    if (mainConcern) {
      query = query.eq("main_concern", mainConcern);
    }

    if (volunteer) {
      query = query.eq("volunteer_interest", volunteer === "yes");
    }

    if (followUp) {
      query = query.eq("follow_up_needed", followUp === "yes");
    }

    const { data, error: exportError } = await query
      .order("created_at", { ascending: false })
      .limit(EXPORT_LIMIT);

    setExporting(false);

    if (exportError) {
      setError("Could not export contacts.");
      return;
    }

    const rows = ((data || []) as Contact[]).map(contactToCsvRow);
    downloadCsv(`community-contacts-${new Date().toISOString().slice(0, 10)}.csv`, rows);

    if (totalCount > EXPORT_LIMIT) {
      setNotice(`Exported the first ${EXPORT_LIMIT} filtered contacts to keep usage predictable.`);
    }
  }

  const rangeLabel = useMemo(() => {
    if (totalCount === 0) {
      return "0 shown";
    }

    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, totalCount);
    return `${from}-${to} shown from ${totalCount} total`;
  }, [page, totalCount]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Contacts</h2>
          <p className="mt-1 text-sm text-muted">{rangeLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="button-secondary"
            onClick={() => setReloadKey((current) => current + 1)}
            disabled={loading}
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={exportFilteredContacts}
            disabled={totalCount === 0 || exporting}
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      <section className="panel p-4">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <label className="space-y-2 md:col-span-3 lg:col-span-2">
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
            <span className="label">Suburb</span>
            <select className="input" value={suburb} onChange={(event) => setSuburb(event.target.value)}>
              <option value="">All</option>
              {suburbs.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="label">Source</span>
            <select className="input" value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="">All</option>
              {SOURCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="label">Concern</span>
            <select
              className="input"
              value={mainConcern}
              onChange={(event) => setMainConcern(event.target.value)}
            >
              <option value="">All</option>
              {MAIN_CONCERN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="label">Volunteer</span>
            <select className="input" value={volunteer} onChange={(event) => setVolunteer(event.target.value)}>
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="label">Follow-up</span>
            <select className="input" value={followUp} onChange={(event) => setFollowUp(event.target.value)}>
              <option value="">All</option>
              <option value="yes">Needed</option>
              <option value="no">Not needed</option>
            </select>
          </label>
        </div>
      </section>

      {notice ? <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{notice}</p> : null}
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p> : null}

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Mobile</th>
                <th className="table-th">Email</th>
                <th className="table-th">Suburb</th>
                <th className="table-th">Language</th>
                <th className="table-th">Main Concern</th>
                <th className="table-th">Source</th>
                <th className="table-th">Volunteer</th>
                <th className="table-th">Follow-up Needed</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="table-td" colSpan={11}>
                    Loading contacts...
                  </td>
                </tr>
              ) : contacts.length > 0 ? (
                contacts.map((contact) => (
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
                    <td className="table-td">{contact.email || "-"}</td>
                    <td className="table-td">{contact.suburb}</td>
                    <td className="table-td">{contact.language_preference || "-"}</td>
                    <td className="table-td">{contact.main_concern || "-"}</td>
                    <td className="table-td">{contact.source || "-"}</td>
                    <td className="table-td">{contact.volunteer_interest ? "Yes" : "No"}</td>
                    <td className="table-td">
                      <StatusBadge tone={contact.follow_up_needed ? "green" : "slate"}>
                        {contact.follow_up_needed ? "Needs follow-up" : "No follow-up"}
                      </StatusBadge>
                    </td>
                    <td className="table-td">{contact.follow_up_status || "new"}</td>
                    <td className="table-td">{formatDate(contact.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="table-td" colSpan={11}>
                    No contacts match the current filters.
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
