"use client";

import {
  Download,
  Eye,
  LoaderCircle,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { downloadCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/browser";
import { LionMemberSubmission } from "@/lib/types";

const PAGE_SIZE = 25;
const EXPORT_LIMIT = 1000;
const LIST_COLUMNS =
  "id, participant_type, first_name, middle_name, last_name, local_name, nickname, mobile, preferred_email, alternate_email, address_line_1, address_line_2, suburb, state_province, postal_code, country, birth_date, gender, occupation, spouse_name, sponsor_name, additional_notes, consent, review_status, created_at, updated_at";

const statusOptions = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "exported", label: "Exported" }
] as const;

const participantOptions = [
  { value: "current_member", label: "Current member" },
  { value: "interested_in_joining", label: "Interested in joining" },
  { value: "activity_guest", label: "Activity interest" }
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function sanitizeSearch(value: string) {
  return value.trim().replace(/[,%()]/g, " ");
}

function emptyToNull(value: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function fullName(member: LionMemberSubmission) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

function memberToCsvRow(member: LionMemberSubmission) {
  return {
    "Contact Type": participantOptions.find((option) => option.value === member.participant_type)?.label,
    "Contact: First Name": member.first_name,
    "Contact: Middle Name": member.middle_name,
    "Contact: Last Name": member.last_name,
    "Contact: Nickname": member.nickname,
    "Contact: Full Name (Local)": member.local_name,
    "Contact: Mailing Address Line 1": member.address_line_1,
    "Contact: Mailing Address Line 2": member.address_line_2,
    "Contact: Mailing City": member.suburb,
    "Contact: Mailing State/Province": member.state_province,
    "Contact: Mailing Zip/Postal Code": member.postal_code,
    "Contact: Mailing Country": member.country,
    "Contact: Preferred Email": member.preferred_email,
    "Contact: Alternate Email": member.alternate_email,
    "Contact: Mobile": member.mobile,
    "Contact: Spouse Name": member.spouse_name,
    "Contact: Birthdate": member.birth_date,
    "Contact: Gender": member.gender,
    "Contact: Occupation": member.occupation,
    "Membership Sponsor Name": member.sponsor_name,
    "Additional Notes": member.additional_notes,
    "Review Status": member.review_status,
    "Submitted At": member.created_at
  };
}

function StatusBadge({ status }: { status: LionMemberSubmission["review_status"] }) {
  const classes = {
    new: "border-amber-200 bg-amber-50 text-amber-900",
    reviewed: "border-emerald-200 bg-emerald-50 text-emerald-800",
    exported: "border-blue-200 bg-blue-50 text-blue-800"
  }[status];

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${classes}`}>
      {statusOptions.find((option) => option.value === status)?.label}
    </span>
  );
}

function ParticipantBadge({ type }: { type: LionMemberSubmission["participant_type"] }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
      {participantOptions.find((option) => option.value === type)?.label}
    </span>
  );
}

export function LionsMembersClient() {
  const [members, setMembers] = useState<LionMemberSubmission[]>([]);
  const [selected, setSelected] = useState<LionMemberSubmission | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [participantType, setParticipantType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function openMember(member: LionMemberSubmission) {
    setError("");
    setNotice("");
    setSelected(member);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, participantType, status]);

  useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      setError("");

      const supabase = createClient();
      let query = supabase.from("lion_member_submissions").select(LIST_COLUMNS);
      const safeSearch = sanitizeSearch(debouncedSearch);

      if (safeSearch) {
        const pattern = `%${safeSearch}%`;
        query = query.or(
          `first_name.ilike.${pattern},last_name.ilike.${pattern},local_name.ilike.${pattern},mobile.ilike.${pattern},preferred_email.ilike.${pattern}`
        );
      }

      if (status) {
        query = query.eq("review_status", status);
      }

      if (participantType) {
        query = query.eq("participant_type", participantType);
      }

      const from = (page - 1) * PAGE_SIZE;
      const { data, error: loadError } = await query
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE);

      if (loadError) {
        setError("Could not load member submissions.");
      } else {
        const rows = (data || []) as LionMemberSubmission[];
        setMembers(rows.slice(0, PAGE_SIZE));
        setHasNextPage(rows.length > PAGE_SIZE);
      }

      setLoading(false);
    }

    void loadMembers();
  }, [debouncedSearch, page, participantType, reloadKey, status]);

  useEffect(() => {
    if (!selected) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  async function updateStatus(member: LionMemberSubmission, nextStatus: LionMemberSubmission["review_status"]) {
    setError("");
    const previous = members;
    setMembers((current) =>
      current.map((item) => (item.id === member.id ? { ...item, review_status: nextStatus } : item))
    );

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("lion_member_submissions")
      .update({ review_status: nextStatus })
      .eq("id", member.id);

    if (updateError) {
      setMembers(previous);
      setError("Could not update review status.");
    }
  }

  async function saveSelected() {
    if (!selected) {
      return;
    }

    if (!selected.first_name.trim() || !selected.last_name.trim()) {
      setError("First name and last name are required.");
      return;
    }

    if (!selected.mobile?.trim() && !selected.preferred_email?.trim()) {
      setError("A mobile number or preferred email is required.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      participant_type: selected.participant_type,
      first_name: selected.first_name.trim(),
      middle_name: emptyToNull(selected.middle_name),
      last_name: selected.last_name.trim(),
      local_name: emptyToNull(selected.local_name),
      nickname: emptyToNull(selected.nickname),
      mobile: emptyToNull(selected.mobile),
      preferred_email: emptyToNull(selected.preferred_email),
      alternate_email: emptyToNull(selected.alternate_email),
      address_line_1: emptyToNull(selected.address_line_1),
      address_line_2: emptyToNull(selected.address_line_2),
      suburb: emptyToNull(selected.suburb),
      state_province: emptyToNull(selected.state_province),
      postal_code: emptyToNull(selected.postal_code),
      country: emptyToNull(selected.country),
      birth_date: selected.birth_date || null,
      gender: emptyToNull(selected.gender),
      occupation: emptyToNull(selected.occupation),
      spouse_name: emptyToNull(selected.spouse_name),
      sponsor_name: emptyToNull(selected.sponsor_name),
      additional_notes: emptyToNull(selected.additional_notes),
      review_status: selected.review_status
    };

    const supabase = createClient();
    const { data, error: saveError } = await supabase
      .from("lion_member_submissions")
      .update(payload)
      .eq("id", selected.id)
      .select(LIST_COLUMNS)
      .single();

    setSaving(false);

    if (saveError) {
      setError("Could not save member details.");
      return;
    }

    const saved = data as LionMemberSubmission;
    setMembers((current) => current.map((item) => (item.id === saved.id ? saved : item)));
    setSelected(null);
    setNotice("Member details saved.");
  }

  async function deleteSelected() {
    if (!selected || !window.confirm(`Delete the submission from ${fullName(selected)}?`)) {
      return;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("lion_member_submissions")
      .delete()
      .eq("id", selected.id);
    setSaving(false);

    if (deleteError) {
      setError("Could not delete this submission.");
      return;
    }

    setMembers((current) => current.filter((item) => item.id !== selected.id));
    setSelected(null);
    setNotice("Submission deleted.");
  }

  async function exportFilteredMembers() {
    setExporting(true);
    setError("");
    setNotice("");

    const supabase = createClient();
    let query = supabase.from("lion_member_submissions").select(LIST_COLUMNS);
    const safeSearch = sanitizeSearch(debouncedSearch);

    if (safeSearch) {
      const pattern = `%${safeSearch}%`;
      query = query.or(
        `first_name.ilike.${pattern},last_name.ilike.${pattern},local_name.ilike.${pattern},mobile.ilike.${pattern},preferred_email.ilike.${pattern}`
      );
    }

    if (status) {
      query = query.eq("review_status", status);
    }

    if (participantType) {
      query = query.eq("participant_type", participantType);
    }

    const { data, error: exportError } = await query
      .order("created_at", { ascending: false })
      .limit(EXPORT_LIMIT);

    setExporting(false);

    if (exportError) {
      setError("Could not export member submissions.");
      return;
    }

    const rows = ((data || []) as LionMemberSubmission[]).map(memberToCsvRow);
    if (rows.length === 0) {
      setNotice("There are no matching records to export.");
      return;
    }

    downloadCsv(`lions-member-details-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    setNotice(
      rows.length >= EXPORT_LIMIT
        ? `Exported the first ${EXPORT_LIMIT} matching records.`
        : `Exported ${rows.length} member record${rows.length === 1 ? "" : "s"}.`
    );
  }

  const rangeLabel = useMemo(() => {
    if (!loading && members.length === 0) {
      return "0 shown";
    }

    const from = (page - 1) * PAGE_SIZE + 1;
    const to = from + members.length - 1;
    return `${from}-${to} shown${hasNextPage ? ", more available" : ""}`;
  }, [hasNextPage, loading, members.length, page]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Lion member intake</h2>
          <p className="mt-1 text-sm text-muted">
            Review event submissions before updating the official membership system. {rangeLabel}
          </p>
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
            onClick={exportFilteredMembers}
            disabled={exporting}
          >
            {exporting ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Download aria-hidden="true" className="h-4 w-4" />
            )}
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="panel p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_210px_190px]">
          <label className="relative block">
            <span className="sr-only">Search members</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              className="input min-h-11 pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, mobile or email"
            />
          </label>
          <label>
            <span className="sr-only">Connection with the club</span>
            <select
              className="input min-h-11"
              value={participantType}
              onChange={(event) => setParticipantType(event.target.value)}
            >
              <option value="">All contact types</option>
              {participantOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Review status</span>
            <select className="input min-h-11" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All review statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      <div className="panel overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Contact type</th>
                <th className="table-th">Mobile</th>
                <th className="table-th">Preferred email</th>
                <th className="table-th">Suburb</th>
                <th className="table-th">Sponsor</th>
                <th className="table-th">Review</th>
                <th className="table-th">Submitted</th>
                <th className="table-th">
                  <span className="sr-only">View details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="table-td text-muted" colSpan={9}>
                    Loading member submissions...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td className="table-td text-muted" colSpan={9}>
                    No matching submissions.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="table-td">
                      <button
                        type="button"
                        className="text-left font-semibold text-brand hover:underline"
                        onClick={() => openMember(member)}
                      >
                        {fullName(member)}
                        {member.local_name ? <span className="ml-2 font-normal text-muted">{member.local_name}</span> : null}
                      </button>
                    </td>
                    <td className="table-td">
                      <ParticipantBadge type={member.participant_type} />
                    </td>
                    <td className="table-td">{member.mobile || "-"}</td>
                    <td className="table-td">{member.preferred_email || "-"}</td>
                    <td className="table-td">{member.suburb || "-"}</td>
                    <td className="table-td">{member.sponsor_name || "-"}</td>
                    <td className="table-td">
                      <select
                        className="rounded-md border border-line bg-white px-2 py-1.5 text-sm"
                        value={member.review_status}
                        onChange={(event) =>
                          updateStatus(
                            member,
                            event.target.value as LionMemberSubmission["review_status"]
                          )
                        }
                        aria-label={`Review status for ${fullName(member)}`}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="table-td">{formatDate(member.created_at)}</td>
                    <td className="table-td">
                      <button
                        type="button"
                        className="button-secondary px-3"
                        onClick={() => openMember(member)}
                        aria-label={`View ${fullName(member)}`}
                      >
                        <Eye aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-line md:hidden">
          {loading ? (
            <p className="p-4 text-sm text-muted">Loading member submissions...</p>
          ) : members.length === 0 ? (
            <p className="p-4 text-sm text-muted">No matching submissions.</p>
          ) : (
            members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => openMember(member)}
                className="block w-full p-4 text-left hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{fullName(member)}</p>
                    {member.local_name ? <p className="mt-1 text-sm text-muted">{member.local_name}</p> : null}
                  </div>
                  <StatusBadge status={member.review_status} />
                </div>
                <p className="mt-3 text-sm text-ink">{member.mobile || member.preferred_email || "-"}</p>
                <div className="mt-2">
                  <ParticipantBadge type={member.participant_type} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {member.suburb || "Suburb not provided"} · {formatDate(member.created_at)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="button-secondary"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </button>
        <span className="text-sm text-muted">Page {page}</span>
        <button
          type="button"
          className="button-secondary"
          onClick={() => setPage((current) => current + 1)}
          disabled={!hasNextPage || loading}
        >
          Next
        </button>
      </div>

      {selected ? (
        <MemberEditor
          member={selected}
          error={error}
          saving={saving}
          onChange={setSelected}
          onClose={() => setSelected(null)}
          onDelete={deleteSelected}
          onSave={saveSelected}
        />
      ) : null}
    </div>
  );
}

function MemberEditor({
  error,
  member,
  onChange,
  onClose,
  onDelete,
  onSave,
  saving
}: {
  error: string;
  member: LionMemberSubmission;
  onChange: (member: LionMemberSubmission) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  function update<K extends keyof LionMemberSubmission>(key: K, value: LionMemberSubmission[K]) {
    onChange({ ...member, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-editor-title"
        className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-lg bg-white shadow-xl sm:rounded-lg"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4 sm:px-6">
          <div>
            <h3 id="member-editor-title" className="text-xl font-semibold text-ink">
              {fullName(member)}
            </h3>
            <p className="mt-1 text-xs text-muted">Submitted {formatDate(member.created_at)}</p>
          </div>
          <button type="button" className="button-secondary px-3" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-7 px-5 py-6 sm:px-6">
          <EditorSection title="Connection with the club">
            <label className="block sm:col-span-2">
              <span className="label mb-2 block">Contact type</span>
              <select
                className="input min-h-11"
                value={member.participant_type}
                onChange={(event) =>
                  update(
                    "participant_type",
                    event.target.value as LionMemberSubmission["participant_type"]
                  )
                }
              >
                {participantOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </EditorSection>

          <EditorSection title="Name">
            <EditorField label="First name" required value={member.first_name} onChange={(value) => update("first_name", value)} />
            <EditorField label="Middle name" value={member.middle_name || ""} onChange={(value) => update("middle_name", value)} />
            <EditorField label="Last name" required value={member.last_name} onChange={(value) => update("last_name", value)} />
            <EditorField label="Local name" value={member.local_name || ""} onChange={(value) => update("local_name", value)} />
            <EditorField label="Nickname" value={member.nickname || ""} onChange={(value) => update("nickname", value)} />
          </EditorSection>

          <EditorSection title="Contact">
            <EditorField label="Mobile" type="tel" value={member.mobile || ""} onChange={(value) => update("mobile", value)} />
            <EditorField label="Preferred email" type="email" value={member.preferred_email || ""} onChange={(value) => update("preferred_email", value)} />
            <EditorField label="Alternate email" type="email" value={member.alternate_email || ""} onChange={(value) => update("alternate_email", value)} />
          </EditorSection>

          <EditorSection title="Mailing address">
            <EditorField label="Address line 1" value={member.address_line_1 || ""} onChange={(value) => update("address_line_1", value)} />
            <EditorField label="Address line 2" value={member.address_line_2 || ""} onChange={(value) => update("address_line_2", value)} />
            <EditorField label="Suburb / City" value={member.suburb || ""} onChange={(value) => update("suburb", value)} />
            <EditorField label="State / Province" value={member.state_province || ""} onChange={(value) => update("state_province", value)} />
            <EditorField label="Postcode" value={member.postal_code || ""} onChange={(value) => update("postal_code", value)} />
            <EditorField label="Country" value={member.country || ""} onChange={(value) => update("country", value)} />
          </EditorSection>

          <EditorSection title="Additional details">
            <EditorField label="Date of birth" type="date" value={member.birth_date || ""} onChange={(value) => update("birth_date", value)} />
            <label className="block">
              <span className="label mb-2 block">Gender</span>
              <select className="input min-h-11" value={member.gender || ""} onChange={(event) => update("gender", event.target.value)}>
                <option value="">Not provided</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <EditorField label="Occupation" value={member.occupation || ""} onChange={(value) => update("occupation", value)} />
            <EditorField label="Spouse or partner" value={member.spouse_name || ""} onChange={(value) => update("spouse_name", value)} />
            <EditorField label="Sponsor / referring member" value={member.sponsor_name || ""} onChange={(value) => update("sponsor_name", value)} />
            <label className="block sm:col-span-2">
              <span className="label mb-2 block">Additional notes</span>
              <textarea
                className="input min-h-24 resize-y"
                value={member.additional_notes || ""}
                onChange={(event) => update("additional_notes", event.target.value)}
              />
            </label>
            <label className="block">
              <span className="label mb-2 block">Review status</span>
              <select
                className="input min-h-11"
                value={member.review_status}
                onChange={(event) =>
                  update("review_status", event.target.value as LionMemberSubmission["review_status"])
                }
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </EditorSection>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {error ? (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:order-first sm:max-w-xs">
              {error}
            </p>
          ) : null}
          <button type="button" className="button-secondary text-red-700 hover:border-red-400 hover:text-red-800" onClick={onDelete} disabled={saving}>
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Delete submission
          </button>
          <div className="flex gap-2">
            <button type="button" className="button-secondary flex-1 sm:flex-none" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="button-primary flex-1 sm:flex-none" onClick={onSave} disabled={saving}>
              {saving ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Save aria-hidden="true" className="h-4 w-4" />}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section>
      <h4 className="mb-4 border-b border-line pb-2 text-base font-semibold text-ink">{title}</h4>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function EditorField({
  label,
  onChange,
  required = false,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="label mb-2 block">
        {label}
        {required ? <span className="text-red-700"> *</span> : null}
      </span>
      <input
        className="input min-h-11"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}
