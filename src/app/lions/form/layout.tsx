import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lions Club Member Details Confirmation",
  description: "Confirm and update your Lions Club member contact details."
};

export default function LionsFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
