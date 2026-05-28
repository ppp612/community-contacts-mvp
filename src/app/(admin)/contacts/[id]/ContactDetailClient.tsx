"use client";

import { Archive, ArrowLeft, CheckCircle2, Clock3, MessageSquarePlus, PhoneCall, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { FOLLOW_UP_STATUS_OPTIONS, INTERACTION_TYPE_OPTIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/browser";
import { Contact, Interaction } from "@/lib/types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-panel p-3">
      <p className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</p>
      <div className="mt-1 text-sm font-medium text-ink">{value || "-"}</div>
    </div>
  );
}

export function ContactDetailClient({ contactId }: { contactId: string }) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [notes, setNotes] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpStatus, setFollowUpStatus] = useState("new");
  const [interactionType, setInteractionType] = useState("call");
  const [summary, setSummary] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function loadContact() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const [contactResult, interactionsResult] = await Promise.all([
      supabase.from("contacts").select("*").eq("id", contactId).single(),
      supabase
        .from("interactions")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
    ]);

    if (contactResult.error) {
      setError("Could not load contact.");
      setLoading(false);
      return;
    }

    const loadedContact = contactResult.data as Contact;
    setContact(loadedContact);
    setNotes(loadedContact.notes || "");
    setFollowUpNeeded(loadedContact.follow_up_needed);
    setFollowUpStatus(loadedContact.follow_up_status);
    setInteractions((interactionsResult.data || []) as Interaction[]);
    setLoading(false);
  }

  useEffect(() => {
    loadContact();
  }, [contactId]);

  async function saveContact() {
    setSaving(true);
    setMessage("");
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        notes: notes.trim() || null,
        follow_up_needed: followUpNeeded,
        follow_up_status: followUpStatus
      })
      .eq("id", contactId);

    setSaving(false);

    if (updateError) {
      setError("Could not save contact.");
      return;
    }

    setMessage("Contact updated.");
    await loadContact();
  }

  async function applyFollowUpPreset(nextStatus: string, nextNeeded: boolean) {
    setSaving(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        follow_up_needed: nextNeeded,
        follow_up_status: nextStatus
      })
      .eq("id", contactId);

    setSaving(false);

    if (updateError) {
      setError("Could not update follow-up.");
      return;
    }

    setFollowUpNeeded(nextNeeded);
    setFollowUpStatus(nextStatus);
    setMessage("Follow-up updated.");
    await loadContact();
  }

  async function addInteraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!summary.trim()) {
      setError("Interaction summary is required.");
      return;
    }

    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("interactions").insert({
      contact_id: contactId,
      interaction_type: interactionType,
      summary: summary.trim(),
      follow_up_required: followUpRequired,
      created_by: user?.id || null
    });

    if (insertError) {
      setError("Could not add interaction.");
      return;
    }

    if (followUpRequired) {
      await supabase
        .from("contacts")
        .update({ follow_up_needed: true, follow_up_status: "in_progress" })
        .eq("id", contactId);
    }

    setSummary("");
    setFollowUpRequired(false);
    setInteractionType("call");
    setMessage("Interaction added.");
    await loadContact();
  }

  async function deleteContact() {
    const confirmed = window.confirm(
      "Delete this contact? This will also delete all interaction records for this contact."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("contacts").delete().eq("id", contactId);

    if (deleteError) {
      setDeleting(false);
      setError("Could not delete contact.");
      return;
    }

    router.push("/contacts");
    router.refresh();
  }

  if (loading) {
    return <div className="panel p-5 text-sm text-muted">Loading contact...</div>;
  }

  if (!contact) {
    return <div className="panel p-5 text-sm text-red-700">{error || "Contact not found."}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/contacts" className="inline-flex items-center gap-2 text-sm font-semibold text-brand">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to contacts
          </Link>
          <h2 className="mt-3 text-2xl font-semibold text-ink">{contact.full_name}</h2>
          <p className="mt-1 text-sm text-muted">Created {formatDateTime(contact.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="button-secondary border-red-200 text-red-700 hover:border-red-400 hover:text-red-800" onClick={deleteContact} disabled={deleting}>
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete contact"}
          </button>
          <button type="button" className="button-primary" onClick={saveContact} disabled={saving || deleting}>
            <Save aria-hidden="true" className="h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-ink">Contact details</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailItem label="Mobile" value={contact.mobile} />
            <DetailItem label="Email" value={contact.email} />
            <DetailItem label="Suburb" value={contact.suburb} />
            <DetailItem label="Address" value={contact.address} />
            <DetailItem label="Language" value={contact.language_preference} />
            <DetailItem label="Main Concern" value={contact.main_concern} />
            <DetailItem label="Street or Nearby Location" value={contact.location_detail} />
            <DetailItem label="Source" value={contact.source} />
            <DetailItem label="Volunteer" value={contact.volunteer_interest ? "Yes" : "No"} />
            <DetailItem label="Membership Interest" value={contact.membership_interest ? "Yes" : "No"} />
            <DetailItem label="Consent" value={contact.consent ? "Confirmed" : "Not confirmed"} />
            <DetailItem label="Follow-up Status" value={contact.follow_up_status} />
          </div>
          <div className="mt-3">
            <DetailItem label="Message" value={contact.message} />
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="text-base font-semibold text-ink">Follow-up</h3>
          <div className="mt-4 space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="button-secondary justify-center"
                onClick={() => applyFollowUpPreset("new", true)}
                disabled={saving || deleting}
              >
                <Clock3 aria-hidden="true" className="h-4 w-4" />
                Need follow-up
              </button>
              <button
                type="button"
                className="button-secondary justify-center"
                onClick={() => applyFollowUpPreset("in_progress", true)}
                disabled={saving || deleting}
              >
                <Clock3 aria-hidden="true" className="h-4 w-4" />
                In progress
              </button>
              <button
                type="button"
                className="button-secondary justify-center"
                onClick={() => applyFollowUpPreset("contacted", followUpNeeded)}
                disabled={saving || deleting}
              >
                <PhoneCall aria-hidden="true" className="h-4 w-4" />
                Contacted
              </button>
              <button
                type="button"
                className="button-secondary justify-center"
                onClick={() => applyFollowUpPreset("resolved", false)}
                disabled={saving || deleting}
              >
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Resolved
              </button>
              <button
                type="button"
                className="button-secondary justify-center sm:col-span-2"
                onClick={() => applyFollowUpPreset("archived", false)}
                disabled={saving || deleting}
              >
                <Archive aria-hidden="true" className="h-4 w-4" />
                Archive
              </button>
            </div>
            <label className="flex items-center gap-3 text-sm font-medium text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand"
                checked={followUpNeeded}
                onChange={(event) => setFollowUpNeeded(event.target.checked)}
              />
              Follow-up needed
            </label>
            <label className="space-y-2">
              <span className="label">Status</span>
              <select className="input" value={followUpStatus} onChange={(event) => setFollowUpStatus(event.target.value)}>
                {FOLLOW_UP_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="label">Notes</span>
              <textarea
                className="input min-h-40 resize-y"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            <button type="button" className="button-primary w-full justify-center" onClick={saveContact} disabled={saving || deleting}>
              <Save aria-hidden="true" className="h-4 w-4" />
              {saving ? "Saving..." : "Save follow-up"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <form className="panel space-y-4 p-5" onSubmit={addInteraction}>
          <h3 className="text-base font-semibold text-ink">Add interaction</h3>
          <label className="space-y-2">
            <span className="label">Type</span>
            <select className="input" value={interactionType} onChange={(event) => setInteractionType(event.target.value)}>
              {INTERACTION_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="label">Summary *</span>
            <textarea
              required
              className="input min-h-32 resize-y"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>
          <label className="flex items-start gap-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-brand"
              checked={followUpRequired}
              onChange={(event) => setFollowUpRequired(event.target.checked)}
            />
            Further follow-up required
          </label>
          <button type="submit" className="button-primary">
            <MessageSquarePlus aria-hidden="true" className="h-4 w-4" />
            Add interaction
          </button>
        </form>

        <div className="panel p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-ink">Interaction history</h3>
          <div className="mt-4 space-y-3">
            {interactions.length > 0 ? (
              interactions.map((interaction) => (
                <article key={interaction.id} className="rounded-md border border-line bg-white p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-ink">{interaction.interaction_type || "other"}</p>
                    <p className="text-xs text-muted">{formatDateTime(interaction.created_at)}</p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">{interaction.summary}</p>
                  <p className="mt-3 text-xs font-semibold text-muted">
                    Follow-up required: {interaction.follow_up_required ? "Yes" : "No"}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-muted">No interactions yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
