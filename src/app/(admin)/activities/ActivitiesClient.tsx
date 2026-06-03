"use client";

import { CalendarPlus, Pencil, RefreshCw, Search, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Activity } from "@/lib/types";

const PAGE_SIZE = 25;
const ACTIVITY_COLUMNS =
  "id, title, activity_date, location, suburb, activity_type, summary, follow_up_notes, important, created_at, updated_at, created_by";

const ACTIVITY_TYPE_OPTIONS = [
  { value: "community_event", label: "Community event" },
  { value: "resident_meeting", label: "Resident meeting" },
  { value: "business_walk", label: "Business walk" },
  { value: "school_visit", label: "School visit" },
  { value: "council_meeting", label: "Council meeting" },
  { value: "media", label: "Media" },
  { value: "other", label: "Other" }
];

type ActivityForm = {
  title: string;
  activity_date: string;
  location: string;
  suburb: string;
  activity_type: string;
  summary: string;
  follow_up_notes: string;
  important: boolean;
};

const emptyForm: ActivityForm = {
  title: "",
  activity_date: new Date().toISOString().slice(0, 10),
  location: "",
  suburb: "",
  activity_type: "",
  summary: "",
  follow_up_notes: "",
  important: true
};

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

function typeLabel(value: string | null) {
  return ACTIVITY_TYPE_OPTIONS.find((option) => option.value === value)?.label || "Other";
}

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formFromActivity(activity: Activity): ActivityForm {
  return {
    title: activity.title,
    activity_date: activity.activity_date,
    location: activity.location || "",
    suburb: activity.suburb || "",
    activity_type: activity.activity_type || "",
    summary: activity.summary || "",
    follow_up_notes: activity.follow_up_notes || "",
    important: activity.important
  };
}

export function ActivitiesClient() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [suburbs, setSuburbs] = useState<string[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activityType, setActivityType] = useState("");
  const [suburb, setSuburb] = useState("");
  const [importantOnly, setImportantOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [form, setForm] = useState<ActivityForm>(emptyForm);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [activityType, debouncedSearch, importantOnly, suburb]);

  useEffect(() => {
    async function loadSuburbs() {
      const supabase = createClient();
      const { data } = await supabase
        .from("activities")
        .select("suburb")
        .not("suburb", "is", null)
        .order("suburb", { ascending: true })
        .limit(250);

      const uniqueSuburbs = Array.from(
        new Set((data || []).map((row) => row.suburb).filter(Boolean))
      ).sort();
      setSuburbs(uniqueSuburbs);
    }

    void loadSuburbs();
  }, [reloadKey]);

  useEffect(() => {
    async function loadActivities() {
      setLoading(true);
      setError("");

      const supabase = createClient();
      let query = supabase.from("activities").select(ACTIVITY_COLUMNS);

      const safeSearch = sanitizeSearch(debouncedSearch);
      if (safeSearch) {
        const pattern = `%${safeSearch}%`;
        query = query.or(`title.ilike.${pattern},location.ilike.${pattern},summary.ilike.${pattern}`);
      }

      if (activityType) {
        query = query.eq("activity_type", activityType);
      }

      if (suburb) {
        query = query.eq("suburb", suburb);
      }

      if (importantOnly) {
        query = query.eq("important", true);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE;
      const { data, error: loadError } = await query
        .order("activity_date", { ascending: false })
        .range(from, to);

      if (loadError) {
        setError("Could not load activities.");
        setActivities([]);
        setHasNextPage(false);
        setLoading(false);
        return;
      }

      const rows = (data || []) as Activity[];
      setActivities(rows.slice(0, PAGE_SIZE));
      setHasNextPage(rows.length > PAGE_SIZE);
      setLoading(false);
    }

    void loadActivities();
  }, [activityType, debouncedSearch, importantOnly, page, reloadKey, suburb]);

  const rangeLabel = useMemo(() => {
    if (!loading && activities.length === 0) {
      return "0 activities";
    }

    const from = (page - 1) * PAGE_SIZE + 1;
    const to = from + activities.length - 1;
    return `${from}-${to} activities${hasNextPage ? ", more available" : ""}`;
  }, [activities.length, hasNextPage, loading, page]);

  function updateFormField<K extends keyof ActivityForm>(field: K, value: ActivityForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openNewForm() {
    setEditingActivity(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setFormOpen(true);
  }

  function openEditForm(activity: Activity) {
    setEditingActivity(activity);
    setForm(formFromActivity(activity));
    setError("");
    setNotice("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingActivity(null);
    setForm(emptyForm);
  }

  async function saveActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Activity title is required.");
      return;
    }

    if (!form.activity_date) {
      setError("Activity date is required.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      title: form.title.trim(),
      activity_date: form.activity_date,
      location: toNullable(form.location),
      suburb: toNullable(form.suburb),
      activity_type: toNullable(form.activity_type),
      summary: toNullable(form.summary),
      follow_up_notes: toNullable(form.follow_up_notes),
      important: form.important
    };

    const supabase = createClient();
    const request = editingActivity
      ? supabase.from("activities").update(payload).eq("id", editingActivity.id)
      : supabase.from("activities").insert(payload);

    const { error: saveError } = await request;

    if (saveError) {
      setError("Could not save activity.");
      setSaving(false);
      return;
    }

    setSaving(false);
    closeForm();
    setNotice(editingActivity ? "Activity updated." : "Activity added.");
    setReloadKey((current) => current + 1);
  }

  async function deleteActivity(activity: Activity) {
    const confirmed = window.confirm(`Delete "${activity.title}"?`);
    if (!confirmed) {
      return;
    }

    setError("");
    setNotice("");

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("activities").delete().eq("id", activity.id);

    if (deleteError) {
      setError("Could not delete activity.");
      return;
    }

    setNotice("Activity deleted.");
    setReloadKey((current) => current + 1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Activities</h2>
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
          <button type="button" className="button-primary" onClick={openNewForm}>
            <CalendarPlus aria-hidden="true" className="h-4 w-4" />
            Add activity
          </button>
        </div>
      </div>

      {formOpen ? (
        <section className="panel p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-ink">
                {editingActivity ? "Edit activity" : "New activity"}
              </h3>
              <p className="mt-1 text-sm text-muted">Record important events Mayor Cai attended.</p>
            </div>
            <button type="button" className="button-secondary px-3" onClick={closeForm}>
              <X aria-hidden="true" className="h-4 w-4" />
              Close
            </button>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveActivity}>
            <label className="space-y-2 md:col-span-2">
              <span className="label">Activity title</span>
              <input
                className="input"
                value={form.title}
                onChange={(event) => updateFormField("title", event.target.value)}
                required
              />
            </label>

            <label className="space-y-2">
              <span className="label">Date</span>
              <input
                className="input"
                type="date"
                value={form.activity_date}
                onChange={(event) => updateFormField("activity_date", event.target.value)}
                required
              />
            </label>

            <label className="space-y-2">
              <span className="label">Type</span>
              <select
                className="input"
                value={form.activity_type}
                onChange={(event) => updateFormField("activity_type", event.target.value)}
              >
                <option value="">Select type</option>
                {ACTIVITY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="label">Location</span>
              <input
                className="input"
                value={form.location}
                onChange={(event) => updateFormField("location", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="label">Suburb</span>
              <input
                className="input"
                value={form.suburb}
                onChange={(event) => updateFormField("suburb", event.target.value)}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="label">Summary</span>
              <textarea
                className="input min-h-24"
                value={form.summary}
                onChange={(event) => updateFormField("summary", event.target.value)}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="label">Follow-up notes</span>
              <textarea
                className="input min-h-24"
                value={form.follow_up_notes}
                onChange={(event) => updateFormField("follow_up_notes", event.target.value)}
              />
            </label>

            <label className="flex items-start gap-3 rounded-md border border-line bg-panel p-3 md:col-span-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-brand"
                checked={form.important}
                onChange={(event) => updateFormField("important", event.target.checked)}
              />
              <span>
                <span className="block text-sm font-semibold text-ink">Mark as important</span>
                <span className="block text-sm text-muted">Use this for key public events and major meetings.</span>
              </span>
            </label>

            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button type="submit" className="button-primary" disabled={saving}>
                {saving ? "Saving..." : "Save activity"}
              </button>
              <button type="button" className="button-secondary" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2">
            <span className="label">Search</span>
            <span className="relative block">
              <Search aria-hidden="true" className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                className="input pl-9"
                placeholder="Title, location, summary"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </span>
          </label>

          <label className="space-y-2">
            <span className="label">Type</span>
            <select className="input" value={activityType} onChange={(event) => setActivityType(event.target.value)}>
              <option value="">All types</option>
              {ACTIVITY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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

          <label className="flex items-center gap-3 rounded-md border border-line bg-white px-3 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
              checked={importantOnly}
              onChange={(event) => setImportantOnly(event.target.checked)}
            />
            <span className="text-sm font-semibold text-ink">Important only</span>
          </label>
        </div>
      </section>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p> : null}
      {notice ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{notice}</p> : null}

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="table-th">Date</th>
                <th className="table-th">Activity</th>
                <th className="table-th">Type</th>
                <th className="table-th">Location</th>
                <th className="table-th">Suburb</th>
                <th className="table-th">Important</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="table-td" colSpan={7}>
                    Loading activities...
                  </td>
                </tr>
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <tr key={activity.id} className="align-top transition hover:bg-panel">
                    <td className="table-td">{formatDate(activity.activity_date)}</td>
                    <td className="table-td max-w-sm whitespace-normal">
                      <div className="font-semibold">{activity.title}</div>
                      {activity.summary ? <div className="mt-1 text-muted">{activity.summary}</div> : null}
                      {activity.follow_up_notes ? (
                        <div className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                          Follow-up: {activity.follow_up_notes}
                        </div>
                      ) : null}
                    </td>
                    <td className="table-td">{typeLabel(activity.activity_type)}</td>
                    <td className="table-td">{activity.location || "-"}</td>
                    <td className="table-td">{activity.suburb || "-"}</td>
                    <td className="table-td">
                      {activity.important ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                          <Star aria-hidden="true" className="h-3 w-3 fill-current" />
                          Important
                        </span>
                      ) : (
                        <span className="text-muted">No</span>
                      )}
                    </td>
                    <td className="table-td">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="button-secondary px-3" onClick={() => openEditForm(activity)}>
                          <Pencil aria-hidden="true" className="h-4 w-4" />
                          Edit
                        </button>
                        <button type="button" className="button-secondary px-3" onClick={() => deleteActivity(activity)}>
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="table-td" colSpan={7}>
                    No activities match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">{rangeLabel}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="button-secondary"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasNextPage || loading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
