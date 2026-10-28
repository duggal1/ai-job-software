"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteJobPost,
  setPostArchived,
} from "@/lib/actions/posts";
import { slugify } from "@/lib/slug";

export interface PostCrmRow {
  id: string;
  jobTitle: string;
  companySlug: string;
  archived: boolean;
  location: string;
  workMode: string;
  estimatedSalary: string;
  createdAt: string | Date;
}

type Filter = "all" | "active" | "archived";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Posts CRM.
 *
 * Archive keeps a post and its applicants but removes it from every public
 * feed. Delete removes the post and its applicants for good (two-step
 * confirmation, because there is no undo).
 */
export function PostsCrm({ initialRows }: { initialRows: PostCrmRow[] }) {
  const [posts, setPosts] = useState<PostCrmRow[]>(initialRows);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  const activeCount = posts.filter((post) => !post.archived).length;
  const archivedCount = posts.length - activeCount;
  const visible = posts.filter((post) => {
    if (filter === "active") return !post.archived;
    if (filter === "archived") return post.archived;
    return true;
  });

  function toggleArchive(post: PostCrmRow) {
    setError("");
    setBusyId(post.id);
    setPosts((current) =>
      current.map((row) =>
        row.id === post.id ? { ...row, archived: !post.archived } : row,
      ),
    );
    startTransition(async () => {
      try {
        await setPostArchived({ postId: post.id, archived: !post.archived });
      } catch (e) {
        setPosts((current) =>
          current.map((row) =>
            row.id === post.id ? { ...row, archived: post.archived } : row,
          ),
        );
        setError(e instanceof Error ? e.message : "Could not update this post.");
      } finally {
        setBusyId(null);
      }
    });
  }

  function remove(post: PostCrmRow) {
    setError("");
    setBusyId(post.id);
    setConfirmId(null);
    const previous = posts;
    setPosts((current) => current.filter((row) => row.id !== post.id));
    startTransition(async () => {
      try {
        await deleteJobPost(post.id);
      } catch (e) {
        setPosts(previous);
        setError(e instanceof Error ? e.message : "Could not delete this post.");
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <section
      aria-label="Posts"
      className="rounded-lg border border-stone-100 bg-stone-50 px-6 py-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-normal text-stone-900">Posts</h2>
          <p className="mt-1 text-[13px] text-stone-400">
            Your CRM for every job post. Edit, archive, or delete — archived
            posts stay here but leave the public feeds.
          </p>
        </div>
        <Link
          href="/job-post/new"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1 text-[12px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-stone-950"
        >
          New post
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => {
          const count =
            option.value === "all"
              ? posts.length
              : option.value === "active"
                ? activeCount
                : archivedCount;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`cursor-pointer rounded-lg px-3 py-1 text-[12px] transition-colors ${
                filter === option.value
                  ? "bg-stone-300/60 text-stone-900"
                  : "bg-stone-100/80 text-stone-600 hover:bg-stone-200/65"
              }`}
            >
              {option.label}
              <span className="ml-1.5 text-stone-400">{count}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-[12px] text-orange-600">{error}</p>}

      <ul className="mt-3 flex flex-col">
        {visible.map((post) => {
          const editHref = `/dashboard/post/edit/${slugify(post.jobTitle)}`;
          const publicHref = `/company/${post.id}/${post.companySlug}`;
          const busy = busyId === post.id;
          return (
            <li
              key={post.id}
              className="border-t border-stone-200/50 py-4 first:border-t-0 first:pt-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={editHref}
                      className="cursor-pointer truncate text-[14px] text-stone-900 underline-offset-4 hover:underline"
                    >
                      {post.jobTitle}
                    </Link>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-[3px] px-1.5 py-0.5 text-[11px] ${
                        post.archived
                          ? "bg-stone-200/70 text-stone-500"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`size-1 rounded-full ${
                          post.archived ? "bg-stone-400" : "bg-emerald-500"
                        }`}
                      />
                      {post.archived ? "Archived" : "Active"}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-stone-500">
                    {[post.location, post.workMode, post.estimatedSalary]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    Posted {formatDate(post.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={editHref}
                    className="cursor-pointer rounded-md bg-stone-100/80 px-2.5 py-1 text-[12px] text-stone-700 transition-colors hover:bg-stone-200/70"
                  >
                    Edit
                  </Link>
                  <Link
                    href={publicHref}
                    target="_blank"
                    className="cursor-pointer rounded-md px-2 py-1 text-[12px] text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleArchive(post)}
                    disabled={busy}
                    className="cursor-pointer rounded-md px-2 py-1 text-[12px] text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:cursor-wait disabled:opacity-50"
                  >
                    {post.archived ? "Restore" : "Archive"}
                  </button>
                  {confirmId === post.id ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-50 px-2 py-1">
                      <span className="text-[11px] text-orange-700">
                        Delete and all applicants?
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(post)}
                        disabled={busy}
                        className="cursor-pointer text-[11px] font-medium text-orange-700 underline underline-offset-2 hover:text-orange-800"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="cursor-pointer text-[11px] text-stone-500 hover:text-stone-700"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(post.id)}
                      disabled={busy}
                      className="cursor-pointer rounded-md px-2 py-1 text-[12px] text-orange-700 transition-colors hover:bg-orange-50 disabled:cursor-wait disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className="py-10 text-center text-[13px] text-stone-400">
          {posts.length === 0
            ? "No posts yet. Create your first one."
            : `No ${filter} posts.`}
        </p>
      )}
    </section>
  );
}
