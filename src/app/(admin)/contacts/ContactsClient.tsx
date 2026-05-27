"use client";

import { Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MAIN_CONCERN_OPTIONS, SOURCE_OPTIONS } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/browser";
import { Contact } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(value));
}

function uniqueSuburbs(contacts: Contact[]) {
  return Array.from(new Set(contacts.map((contact) => contact.suburb).filter(Boolean))).sort();
}

export function ContactsClient() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [suburb, setSuburb] = useState("");
  const [source, setSource] = useState("");
  const [mainConcern, setMainConcern] = useState("");
  const [volunteer, setVolunteer] = useState("");
  const [followUp, setFollowUp] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadContacts() {
      setLoading(true);
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (loadError) {
        setError("Could not load contacts.");
      } else {
        setContacts((data || []) as Contact[]);
      }

      setLoading(false);
    }

    loadContacts();
  }, []);

  const suburbs = useMemo(() => uniqueSuburbs(contacts), [contacts]);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesSearch =
        !normalizedSearch ||
        [contact.full_name, contact.mobile, contact.email]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedSearch));

      const matchesSuburb = !suburb || contact.suburb === suburb;
      const matchesSource = !source || contact.source === source;
      const matchesConcern = !mainConcern || contact.main_concern === mainConcern;
      const matchesVolunteer =
        !volunteer || contact.volunteer_interest === (volunteer === "yes");
      const matchesFollowUp = !followUp || contact.follow_up_needed === (followUp === "yes");

      return (
        matchesSearch &&
        matchesSuburb &&
        matchesSource &&
        matchesConcern &&
        matchesVolunteer &&
        matchesFollowUp
      );
    });
  }, [contacts, followUp, mainConcern, search, source, suburb, volunteer]);

  function exportFilteredContacts() {
    downloadCsv(
      `community-contacts-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredContacts.map((contact) => ({
        id: contact.id,
        full_name: contact.full_name,
        mobile: contact.mobile,
        email: contact.email,
        suburb: contact.suburb,
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
      }))
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Contacts</h2>
          <p className="mt-1 text-sm text-muted">{filteredContacts.length} shown from {contacts.length} total.</p>
        </div>
        <button
          type="button"
          className="button-primary"
          onClick={exportFilteredContacts}
          disabled={filteredContacts.length === 0}
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Export CSV
        </button>
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

      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

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
                <th className="table-th">Created At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="table-td" colSpan={10}>
                    Loading contacts...
                  </td>
                </tr>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
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
                    <td className="table-td">{contact.follow_up_needed ? "Yes" : "No"}</td>
                    <td className="table-td">{formatDate(contact.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="table-td" colSpan={10}>
                    No contacts match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
