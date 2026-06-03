import { ContactsClient } from "./ContactsClient";

type ContactsSearchParams = {
  bookClub?: string | string[];
  source?: string | string[];
  status?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function ContactsPage({
  searchParams
}: {
  searchParams?: Promise<ContactsSearchParams>;
}) {
  const params = searchParams ? await searchParams : {};

  return (
    <ContactsClient
      initialFilters={{
        bookClub: firstParam(params.bookClub),
        source: firstParam(params.source),
        status: firstParam(params.status)
      }}
    />
  );
}
