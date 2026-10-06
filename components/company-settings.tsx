"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createCompany,
  deleteCompany,
  updateCompany,
} from "@/lib/actions/company";
import { LogoUpload } from "@/components/logo-upload";
import { slugify } from "@/lib/slug";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CompanySettingsInitial = {
  id: string;
  slug: string;
  name: string;
  domain: string;
  logoUrl: string | null;
  createdAt?: Date | string;
  openPosts: number;
} | null;

type OptimisticAction =
  | { type: "patch"; name?: string; domain?: string; logoUrl?: string | null; slug?: string }
  | { type: "deleted" }
  | { type: "created"; name: string; domain: string };

const inputClass =
  "rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300";
const darkChip =
  "cursor-pointer rounded-lg bg-stone-900 px-4 py-1 text-[13px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-stone-950 disabled:opacity-60";

export function CompanySettings({ initial }: { initial: CompanySettingsInitial }) {
  const router = useRouter();
  const [company, setCompany] = useState(initial);
  const [optimistic, dispatch] = useOptimistic(
    company,
    (current, action: OptimisticAction) => {
      switch (action.type) {
        case "patch": {
          if (!current) return current;
          return {
            ...current,
            ...(action.name !== undefined ? { name: action.name } : {}),
            ...(action.domain !== undefined ? { domain: action.domain } : {}),
            ...(action.logoUrl !== undefined ? { logoUrl: action.logoUrl } : {}),
            ...(action.slug !== undefined ? { slug: action.slug } : {}),
          };
        }
        case "deleted":
          return null;
        case "created":
          return {
            id: current?.id ?? "pending",
            slug: current?.slug ?? "",
            name: action.name,
            domain: action.domain,
            logoUrl: current?.logoUrl ?? null,
            openPosts: current?.openPosts ?? 0,
          };
      }
    },
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function touch() {
    if (error) setError("");
    if (saved) setSaved(false);
  }

  function handleSave() {
    setError("");
    setSaved(false);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a company name");
      return;
    }
    startTransition(async () => {
      try {
        dispatch({ type: "patch", name: trimmed, domain: domain.trim(), slug: slugify(slug) });
        await updateCompany({ name: trimmed, domain: domain.trim(), slug: slug.trim() });
        setCompany((c) =>
          c ? { ...c, name: trimmed, domain: domain.trim(), slug: slugify(slug) } : c,
        );
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error && e.message ? e.message : "Could not save. Please try again.");
      }
    });
  }

  function handleLogo(url: string | null) {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        dispatch({ type: "patch", logoUrl: url });
        await updateCompany({ logoUrl: url });
        setCompany((c) => (c ? { ...c, logoUrl: url } : c));
        router.refresh();
      } catch {
        setError("Could not update the logo. Please try again.");
      }
    });
  }

  function handleCreate() {
    setError("");
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Enter a company name");
      return;
    }
    startTransition(async () => {
      try {
        dispatch({ type: "created", name: trimmed, domain: newDomain.trim() });
        const created = await createCompany({ name: trimmed, domain: newDomain.trim() });
        setCompany(created);
        setName(created.name);
        setDomain(created.domain);
        setSlug(created.slug);
        setNewName("");
        setNewDomain("");
        router.refresh();
      } catch {
        setError("Could not create the company. Please try again.");
      }
    });
  }

  function handleDelete() {
    setError("");
    startTransition(async () => {
      try {
        dispatch({ type: "deleted" });
        await deleteCompany();
        setCompany(null);
        setName("");
        setDomain("");
        setSlug("");
        setNewName("");
        setNewDomain("");
        setConfirming(false);
        router.refresh();
      } catch {
        setError("Could not delete the company. Please try again.");
      }
    });
  }

  async function handleCopyId() {
    if (!optimistic) return;
    try {
      await navigator.clipboard.writeText(optimistic.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  if (!optimistic) {
    return (
      <section aria-label="Company" className="rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
        <h2 className="text-[15px] font-normal text-stone-900">Company</h2>
        <p className="mt-1 text-[13px] text-stone-400">
          Create a company to start posting jobs.
        </p>
        <div className="mt-4 flex flex-col gap-1.5">
          <Label htmlFor="company-new-name" className="text-[13px] font-normal text-stone-600">
            Company name
          </Label>
          <Input
            id="company-new-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Acme Inc"
            className={inputClass}
          />
          <Label htmlFor="company-new-domain" className="mt-2 text-[13px] font-normal text-stone-600">
            Domain
          </Label>
          <Input
            id="company-new-domain"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="acme.com"
            className={inputClass}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={handleCreate}
            className={`${darkChip} mt-3 w-fit`}
          >
            {isPending ? "Creating…" : "Create company"}
          </button>
          {error && <p className="text-[11px] text-orange-600">{error}</p>}
        </div>
      </section>
    );
  }

  const careersHref = `/company/${optimistic.id}/${optimistic.slug}/careers`;
  const created = company?.createdAt
    ? new Date(company.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <>
      <section aria-label="Company profile" className="rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
        <h2 className="text-[15px] font-normal text-stone-900">Company profile</h2>
        <p className="mt-1 text-[13px] text-stone-400">
          Logo, name, domain, and public URL.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <LogoUpload
            url={optimistic.logoUrl}
            onUploadComplete={(url) => handleLogo(url)}
            onRemove={() => handleLogo(null)}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-name" className="text-[13px] font-normal text-stone-600">
              Company name
            </Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                touch();
              }}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-domain" className="text-[13px] font-normal text-stone-600">
              Domain
            </Label>
            <Input
              id="company-domain"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                touch();
              }}
              placeholder="acme.com"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-slug" className="text-[13px] font-normal text-stone-600">
              URL slug
            </Label>
            <Input
              id="company-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                touch();
              }}
              placeholder="acme-inc"
              className={inputClass}
            />
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className={`${darkChip} w-fit`}
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
          {error && <p className="text-[11px] text-orange-600">{error}</p>}
          {saved && !error && <p className="text-[11px] text-stone-500">Saved.</p>}
        </div>
      </section>

      <section aria-label="Company details" className="mt-3 rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
        <h2 className="text-[15px] font-normal text-stone-900">Details</h2>
        <ul className="mt-4 flex flex-col">
          <li className="flex items-center justify-between gap-4 border-t border-stone-200/50 py-3 first:border-t-0 first:pt-1 last:pb-0">
            <div className="min-w-0">
              <p className="text-[13px] font-normal text-stone-600">Public page</p>
              <p className="truncate font-mono text-[12px] text-stone-400">{careersHref}</p>
            </div>
            <Link
              href={careersHref}
              className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-[12px] text-stone-500 hover:bg-stone-100 hover:text-stone-700"
            >
              View
            </Link>
          </li>
          <li className="flex items-center justify-between gap-4 border-t border-stone-200/50 py-3 last:pb-0">
            <div className="min-w-0">
              <p className="text-[13px] font-normal text-stone-600">Open posts</p>
              <p className="text-[12px] text-stone-400">
                {optimistic.openPosts === 1 ? "1 post" : `${optimistic.openPosts} posts`}
              </p>
            </div>
            <Link
              href="/company/applicants"
              className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-[12px] text-stone-500 hover:bg-stone-100 hover:text-stone-700"
            >
              Manage
            </Link>
          </li>
          <li className="flex items-center justify-between gap-4 border-t border-stone-200/50 py-3 last:pb-0">
            <div className="min-w-0">
              <p className="text-[13px] font-normal text-stone-600">Company ID</p>
              <p className="truncate font-mono text-[12px] text-stone-400">{optimistic.id}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-[12px] text-stone-500 hover:bg-stone-100 hover:text-stone-700"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </li>
          {created && (
            <li className="flex items-center justify-between gap-4 border-t border-stone-200/50 py-3 last:pb-0">
              <p className="text-[13px] font-normal text-stone-600">Created</p>
              <p className="shrink-0 text-[12px] text-stone-400">{created}</p>
            </li>
          )}
        </ul>
      </section>

      <section aria-label="Delete company" className="mt-3 rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
        <h2 className="text-[15px] font-normal text-stone-900">Delete company</h2>
        <p className="mt-1 text-[13px] text-stone-400">
          Permanently delete the company, all job posts, and their applicants.
          This cannot be undone.
        </p>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 cursor-pointer text-[13px] text-orange-700 underline decoration-dotted underline-offset-4 hover:text-orange-800"
          >
            Delete company
          </button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className={darkChip}
            >
              {isPending ? "Deleting…" : "Yes, delete company"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirming(false)}
              className="cursor-pointer text-[13px] text-stone-500 hover:text-stone-800"
            >
              Keep company
            </button>
          </div>
        )}
      </section>
    </>
  );
}
