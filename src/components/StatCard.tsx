import Link from "next/link";

type StatCardProps = {
  label: string;
  value: number | string;
  helper?: string;
  href?: string;
};

export function StatCard({ label, value, helper, href }: StatCardProps) {
  const content = (
    <>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-normal text-ink">{value}</p>
      {helper ? <p className="mt-2 text-sm text-muted">{helper}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="panel block p-5 transition hover:border-brand hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand/20">
        {content}
      </Link>
    );
  }

  return (
    <div className="panel p-5">
      {content}
    </div>
  );
}
