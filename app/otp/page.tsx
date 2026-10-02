import { redirect } from "next/navigation";

export default function OtpPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const query = searchParams?.redirect
    ? `?redirect=${encodeURIComponent(String(searchParams.redirect))}`
    : "";
  redirect(`/login${query}`);
}
