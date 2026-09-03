import { redirect } from "next/navigation";

export default async function MerchandiseRedirect({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((val) => qs.append(k, val));
    else if (v !== undefined) qs.set(k, v);
  }
  const query = qs.toString();
  redirect(`/${query ? `?${query}` : ""}`);
}
