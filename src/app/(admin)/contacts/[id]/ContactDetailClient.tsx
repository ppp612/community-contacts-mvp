"use client";

import { ArrowLeft, CheckCircle2, MessageSquarePlus, Pencil, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  FOLLOW_UP_STATUS_OPTIONS,
  INTERACTION_TYPE_OPTIONS,
  LANGUAGE_OPTIONS,
  MAIN_CONCERN_OPTIONS,
  SOURCE_OPTIONS
} from "@/lib/constants";
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

type ContactEditForm = {
  full_name: string;
  mobile: string;
  email: string;
  suburb: string;
  address: string;
  language_preference: string;
  main_concern: string;
  location_detail: string;
  source: string;
  message: string;
  volunteer_interest: boolean;
  membership_interest: boolean;
};

const emptyContactForm: ContactEditForm = {
  full_name: "",
  mobile: "",
  email: "",
  suburb: "",
  address: "",
  language_preference: "",
  main_concern: "",
  location_detail: "",
  source: "",
  message: "",
  volunteer_interest: false,
  membership_interest: false
};

export function ContactDetailClient({ contactId }: { contactId: string }) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState<ContactEditForm>(emptyContactForm);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [notes, setNotes] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpStatus, setFollowUpStatus] = useState("new");
  const [interactionType, setInteractionType] = useState("call");
  const [summary, setSummary] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);
  const [interactionEditType, setInteractionEditType] = useState("call");
  const [interactionEditSummary, setInteractionEditSummary] = useState("");
  const [interactionEditFollowUpRequired, setInteractionEditFollowUpRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interactionSaving, setInteractionSaving] = useState(false);
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
    setContactForm({
      full_name: loadedContact.full_name || "",
      mobile: loadedContact.mobile || "",
      email: loadedContact.email || "",
      suburb: loadedContact.suburb || "",
      address: loadedContact.address || "",
      language_preference: loadedContact.language_preference || "",
      main_concern: loadedContact.main_concern || "",
      location_detail: loadedContact.location_detail || "",
      source: loadedContact.source || "",
      message: loadedContact.message || "",
      volunteer_interest: loadedContact.volunteer_interest,
      membership_interest: loadedContact.membership_interest
    });
    setNotes(loadedContact.notes || "");
    setFollowUpNeeded(loadedContact.follow_up_needed);
    setFollowUpStatus(loadedContact.follow_up_status);
    setInteractions((interactionsResult.data || []) as Interaction[]);
    setLoading(false);
  }

  useEffect(() => {
    loadContact();
  }, [contactId]);

  function updateContactField(name: keyof ContactEditForm, value: string | boolean) {
    setContactForm((current) => ({ ...current, [name]: value }));
  }

  async function saveContact() {
    if (!contactForm.full_name.trim() || !contactForm.suburb.trim()) {
      setError("Name and suburb are required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        full_name: contactForm.full_name.trim(),
        mobile: contactForm.mobile.trim() || null,
        email: contactForm.email.trim() || null,
        suburb: contactForm.suburb.trim(),
        address: contactForm.address.trim() || null,
        language_preference: contactForm.language_preference || null,
        main_concern: contactForm.main_concern || null,
        location_detail: contactForm.location_detail.trim() || null,
        source: contactForm.source || null,
        message: contactForm.message.trim() || null,
        volunteer_interest: contactForm.volunteer_interest,
        membership_interest: contactForm.membership_interest,
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

  function startEditInteraction(interaction: Interaction) {
    setEditingInteractionId(interaction.id);
    setInteractionEditType(interaction.interaction_type || "other");
    setInteractionEditSummary(interaction.summary || "");
    setInteractionEditFollowUpRequired(interaction.follow_up_required);
    setMessage("");
    setError("");
  }

  function cancelEditInteraction() {
    setEditingInteractionId(null);
    setInteractionEditType("call");
    setInteractionEditSummary("");
    setInteractionEditFollowUpRequired(false);
  }

  async function saveInteraction(interactionId: string) {
    setMessage("");
    setError("");

    if (!interactionEditSummary.trim()) {
      setError("Interaction summary is required.");
      return;
    }

    setInteractionSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("interactions")
      .update({
        interaction_type: interactionEditType,
        summary: interactionEditSummary.trim(),
        follow_up_required: interactionEditFollowUpRequired
      })
      .eq("id", interactionId);

    if (updateError) {
      setInteractionSaving(false);
      setError("Could not update interaction.");
      return;
    }

    if (interactionEditFollowUpRequired) {
      await supabase
        .from("contacts")
        .update({ follow_up_needed: true, follow_up_status: "in_progress" })
        .eq("id", contactId);
    }

    setInteractionSaving(false);
    cancelEditInteraction();
    setMessage("Interaction updated.");
    await loadContact();
  }

  async function deleteInteraction(interactionId: string) {
    const confirmed = window.confirm("Delete this interaction record?");

    if (!confirmed) {
      return;
    }

    setInteractionSaving(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("interactions").delete().eq("id", interactionId);

    setInteractionSaving(false);

    if (deleteError) {
      setError("Could not delete interaction.");
      return;
    }

    if (editingInteractionId === interactionId) {
      cancelEditInteraction();
    }

    setMessage("Interaction deleted.");
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
          <h2 className="mt-3 text-2xl font-semibold text-ink">{contactForm.full_name || contact.full_name}</h2>
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
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-ink">Contact details</h3>
            <p className="text-xs font-medium text-muted">Edit fields and click Save changes.</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="label">Name *</span>
              <input
                className="input"
                value={contactForm.full_name}
                onChange={(event) => updateContactField("full_name", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="label">Mobile</span>
              <input
                className="input"
                value={contactForm.mobile}
                onChange={(event) => updateContactField("mobile", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="label">Email</span>
              <input
                className="input"
                type="email"
                value={contactForm.email}
                onChange={(event) => updateContactField("email", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="label">Suburb *</span>
              <input
                className="input"
                value={contactForm.suburb}
                onChange={(event) => updateContactField("suburb", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="label">Address</span>
              <input
                className="input"
                value={contactForm.address}
                onChange={(event) => updateContactField("address", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="label">Language</span>
              <select
                className="input"
                value={contactForm.language_preference}
                onChange={(event) => updateContactField("language_preference", event.target.value)}
              >
                <option value="">Not specified</option>
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="label">Main Concern</span>
              <select
                className="input"
                value={contactForm.main_concern}
                onChange={(event) => updateContactField("main_concern", event.target.value)}
              >
                <option value="">Not specified</option>
                {MAIN_CONCERN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="label">Street or Nearby Location</span>
              <input
                className="input"
                value={contactForm.location_detail}
                onChange={(event) => updateContactField("location_detail", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="label">Source</span>
              <select
                className="input"
                value={contactForm.source}
                onChange={(event) => updateContactField("source", event.target.value)}
              >
                <option value="">Not specified</option>
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-md border border-line bg-panel p-3 text-sm font-medium text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand"
                checked={contactForm.volunteer_interest}
                onChange={(event) => updateContactField("volunteer_interest", event.target.checked)}
              />
              Volunteer interested
            </label>
            <label className="flex items-center gap-3 rounded-md border border-line bg-panel p-3 text-sm font-medium text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand"
                checked={contactForm.membership_interest}
                onChange={(event) => updateContactField("membership_interest", event.target.checked)}
              />
              Community network interested
            </label>
            <DetailItem label="Consent" value={contact.consent ? "Confirmed" : "Not confirmed"} />
            <DetailItem label="Follow-up Status" value={contact.follow_up_status} />
          </div>
          <label className="mt-4 block space-y-2">
            <span className="label">Message</span>
            <textarea
              className="input min-h-28 resize-y"
              value={contactForm.message}
              onChange={(event) => updateContactField("message", event.target.value)}
            />
          </label>
        </div>

        <div className="panel p-5">
          <h3 className="text-base font-semibold text-ink">Follow-up</h3>
          <p className="mt-1 text-sm text-muted">Keep this simple: mark whether the team still needs to act, then save an internal note.</p>
          <div className="mt-4 space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="button-secondary justify-center"
                onClick={() => applyFollowUpPreset("new", true)}
                disabled={saving || deleting}
              >
                Need follow-up
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
            </div>
            <label className="flex items-center gap-3 text-sm font-medium text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand"
                checked={followUpNeeded}
                onChange={(event) => setFollowUpNeeded(event.target.checked)}
              />
              Needs team follow-up
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
              <span className="label">Internal follow-up notes</span>
              <textarea
                className="input min-h-40 resize-y"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
              <span className="block text-xs leading-5 text-muted">
                These notes are only shown to logged-in admins on this contact page.
              </span>
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
                  {editingInteractionId === interaction.id ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="label">Type</span>
                          <select
                            className="input"
                            value={interactionEditType}
                            onChange={(event) => setInteractionEditType(event.target.value)}
                          >
                            {INTERACTION_TYPE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="flex items-end text-xs text-muted">{formatDateTime(interaction.created_at)}</div>
                      </div>
                      <label className="space-y-2">
                        <span className="label">Summary *</span>
                        <textarea
                          className="input min-h-28 resize-y"
                          value={interactionEditSummary}
                          onChange={(event) => setInteractionEditSummary(event.target.value)}
                        />
                      </label>
                      <label className="flex items-start gap-3 text-sm font-medium text-ink">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-brand"
                          checked={interactionEditFollowUpRequired}
                          onChange={(event) => setInteractionEditFollowUpRequired(event.target.checked)}
                        />
                        Further follow-up required
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="button-primary"
                          onClick={() => saveInteraction(interaction.id)}
                          disabled={interactionSaving || deleting}
                        >
                          <Save aria-hidden="true" className="h-4 w-4" />
                          {interactionSaving ? "Saving..." : "Save interaction"}
                        </button>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={cancelEditInteraction}
                          disabled={interactionSaving}
                        >
                          <X aria-hidden="true" className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink">{interaction.interaction_type || "other"}</p>
                          <p className="mt-1 text-xs text-muted">{formatDateTime(interaction.created_at)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="button-secondary px-3 py-2 text-xs"
                            onClick={() => startEditInteraction(interaction)}
                            disabled={interactionSaving || deleting}
                          >
                            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button-secondary border-red-200 px-3 py-2 text-xs text-red-700 hover:border-red-400 hover:text-red-800"
                            onClick={() => deleteInteraction(interaction.id)}
                            disabled={interactionSaving || deleting}
                          >
                            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">{interaction.summary}</p>
                      <p className="mt-3 text-xs font-semibold text-muted">
                        Follow-up required: {interaction.follow_up_required ? "Yes" : "No"}
                      </p>
                    </>
                  )}
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
