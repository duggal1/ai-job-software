"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { MarkdownEditor } from "@/components/markdown-editor";
import { AiEditComposer } from "@/components/ai-edit-composer";
import {
  deleteJobPost,
  setPostArchived,
  updateJobPost,
} from "@/lib/actions/posts";
import {
  APPLY_MODES,
  EMPLOYMENT_TYPES,
  JOB_CATEGORIES,
  WORK_MODES,
  type ApplyMode,
  type EmploymentType,
  type JobCategory,
  type WorkMode,
} from "@/lib/types";
import { EXPERIENCE_LEVELS } from "@/lib/experience";
import { slugify } from "@/lib/slug";

export interface PostEditorData {
  id: string;
  jobTitle: string;
  descriptionMarkdown: string;
  estimatedSalary: string;
  skills: string;
  aiBudget: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  location: string;
  yearsOfExperience: string;
  category: JobCategory | "";
  visaSponsorship: boolean;
  applyMode: ApplyMode;
  applyUrl: string;
  archived: boolean;
}

const inputClass =
  "rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300";
const darkChip =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-1.5 text-[13px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-stone-950 disabled:cursor-wait disabled:opacity-60";

export function PostEditor({ post }: { post: PostEditorData }) {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState(post.jobTitle);
  const [descriptionMarkdown, setDescriptionMarkdown] = useState(
    post.descriptionMarkdown,
  );
  const [estimatedSalary, setEstimatedSalary] = useState(post.estimatedSalary);
  const [skills, setSkills] = useState(post.skills);
  const [aiBudget, setAiBudget] = useState(post.aiBudget);
  const [location, setLocation] = useState(post.location);
  const [yearsOfExperience, setYearsOfExperience] = useState(
    post.yearsOfExperience,
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    post.employmentType,
  );
  const [workMode, setWorkMode] = useState<WorkMode>(post.workMode);
  const [category, setCategory] = useState<JobCategory | "">(post.category);
  const [visaSponsorship, setVisaSponsorship] = useState(post.visaSponsorship);
  const [applyMode, setApplyMode] = useState<ApplyMode>(post.applyMode);
  const [applyUrl, setApplyUrl] = useState(post.applyUrl);
  const [archived, setArchived] = useState(post.archived);

  const [error, setError] = useState("");
  const [isSaving, startSave] = useTransition();
  const [isStatusPending, startStatus] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    setError("");
    startSave(async () => {
      try {
        await updateJobPost({
          postId: post.id,
          jobTitle,
          descriptionMarkdown,
          estimatedSalary,
          skills,
          aiBudget,
          employmentType,
          workMode,
          location,
          yearsOfExperience,
          ...(category ? { category } : {}),
          visaSponsorship,
          applyMode,
          applyUrl,
        });
        router.push("/dashboard?tab=posts");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save this post.");
      }
    });
  }

  function toggleArchive() {
    setError("");
    const next = !archived;
    setArchived(next);
    startStatus(async () => {
      try {
        await setPostArchived({ postId: post.id, archived: next });
      } catch (e) {
        setArchived(!next);
        setError(e instanceof Error ? e.message : "Could not update this post.");
      }
    });
  }

  function remove() {
    setError("");
    startStatus(async () => {
      try {
        await deleteJobPost(post.id);
        router.push("/dashboard?tab=posts");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete this post.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-normal tracking-tight text-stone-900">
            Edit post
          </h1>
          <p className="mt-1 text-[13px] text-stone-500">
            {post.jobTitle} · /dashboard/post/edit/{slugify(post.jobTitle)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[11px] ${
              archived
                ? "bg-stone-200/70 text-stone-500"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <span
              aria-hidden
              className={`size-1 rounded-full ${
                archived ? "bg-stone-400" : "bg-emerald-500"
              }`}
            />
            {archived ? "Archived" : "Active"}
          </span>
          <button
            type="button"
            onClick={toggleArchive}
            disabled={isStatusPending}
            className="cursor-pointer rounded-md px-2 py-1 text-[12px] text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50"
          >
            {archived ? "Restore" : "Archive"}
          </button>
        </div>
      </div>

      <AiEditComposer
        postId={post.id}
        current={{
          jobTitle,
          descriptionMarkdown,
          estimatedSalary,
          skills,
          aiBudget,
        }}
        onDraft={(draft) => {
          setJobTitle(draft.jobTitle);
          setDescriptionMarkdown(draft.descriptionMarkdown);
          setEstimatedSalary(draft.estimatedSalary);
          setSkills(draft.skills);
          setAiBudget(draft.aiBudget);
        }}
      />

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="post-title" className="text-[13px] font-normal text-stone-600">
            Job title
          </Label>
          <Input
            id="post-title"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-normal text-stone-600">
            Job description
          </Label>
          <MarkdownEditor value={descriptionMarkdown} onChange={setDescriptionMarkdown} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-salary" className="text-[13px] font-normal text-stone-600">
              Estimated salary
            </Label>
            <Input
              id="post-salary"
              value={estimatedSalary}
              onChange={(event) => setEstimatedSalary(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-exp" className="text-[13px] font-normal text-stone-600">
              Experience
            </Label>
            <Select
              value={yearsOfExperience}
              onValueChange={(value) => {
                if (value) setYearsOfExperience(value);
              }}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-skills" className="text-[13px] font-normal text-stone-600">
              Skills
            </Label>
            <Input
              id="post-skills"
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-ai-budget" className="text-[13px] font-normal text-stone-600">
              AI budget
            </Label>
            <Input
              id="post-ai-budget"
              value={aiBudget}
              onChange={(event) => setAiBudget(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="post-location" className="text-[13px] font-normal text-stone-600">
            Location
          </Label>
          <Input
            id="post-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-normal text-stone-600">Role type</Label>
            <Select
              value={employmentType}
              onValueChange={(value) => {
                if (EMPLOYMENT_TYPES.includes(value as EmploymentType)) {
                  setEmploymentType(value as EmploymentType);
                }
              }}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-normal text-stone-600">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => {
                if (JOB_CATEGORIES.includes(value as JobCategory)) {
                  setCategory(value as JobCategory);
                }
              }}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {JOB_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-normal text-stone-600">Work mode</Label>
            <Select
              value={workMode}
              onValueChange={(value) => {
                if (WORK_MODES.includes(value as WorkMode)) {
                  setWorkMode(value as WorkMode);
                }
              }}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-[13px] text-stone-600">
          <input
            type="checkbox"
            checked={visaSponsorship}
            onChange={(event) => setVisaSponsorship(event.target.checked)}
            className="size-4 rounded-sm accent-stone-900"
          />
          Offers visa sponsorship
        </label>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-normal text-stone-600">
              How candidates apply
            </Label>
            <Select
              value={applyMode}
              onValueChange={(value) => {
                if (APPLY_MODES.includes(value as ApplyMode)) {
                  setApplyMode(value as ApplyMode);
                }
              }}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="platform">On Fly AI</SelectItem>
                <SelectItem value="external">On company website</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-apply-url" className="text-[13px] font-normal text-stone-600">
              Apply URL <span className="text-stone-400">(external only)</span>
            </Label>
            <Input
              id="post-apply-url"
              value={applyUrl}
              onChange={(event) => setApplyUrl(event.target.value)}
              placeholder="acme.com/careers/123"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-[12px] text-orange-600">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-6">
        <Link
          href="/dashboard?tab=posts"
          className="cursor-pointer text-[13px] text-stone-500 underline decoration-dotted underline-offset-4 hover:text-stone-800"
        >
          Back to posts
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {confirmDelete ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1.5">
              <span className="text-[12px] text-orange-700">
                Delete this post and its applicants?
              </span>
              <button
                type="button"
                onClick={remove}
                disabled={isStatusPending}
                className="cursor-pointer text-[12px] font-medium text-orange-700 underline underline-offset-2 hover:text-orange-800"
              >
                Yes, delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="cursor-pointer text-[12px] text-stone-500 hover:text-stone-700"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="cursor-pointer rounded-lg px-2 py-1 text-[12px] text-orange-700 transition-colors hover:bg-orange-50"
            >
              Delete post
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={isSaving}
            className={darkChip}
          >
            {isSaving ? <Spinner className="size-3.5" /> : null}
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
