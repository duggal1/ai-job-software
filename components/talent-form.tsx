"use client";

import { useState, useTransition, useEffect, useRef, useCallback, useOptimistic } from "react";
import { useForm } from "@tanstack/react-form";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckmarkCircle02Icon, AlertCircleIcon, Upload01Icon } from "hugeicons-react";
import { saveApplicant } from "@/lib/actions/save-applicant";
import { getJobPost } from "@/lib/actions/get-job-post";
import { getCompany } from "@/lib/actions/get-company";
import { applyFormSchema } from "@/lib/validation";
import { slugify } from "@/lib/slug";
import { parseResume } from "@/lib/actions/parse-resume";
import { generateNote } from "@/lib/actions/generate-note";
import { useUploadThing } from "@/lib/uploadthing";
import type { ApplyFormData } from "@/lib/validation";
import type { JobPost, Applicant } from "@/lib/types";

export function TalentForm() {
  const { id } = useParams<{ id: string; slug: string }>();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fullNameValue, setFullNameValue] = useState("");
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const [jobPost, setJobPost] = useState<JobPost | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ email: string } | null>(null);
  const [optimisticSubmitted, setOptimisticSubmitted] = useOptimistic(submitted);
  const previousSlugRef = useRef("");

  const saveMutation = useMutation({
    mutationFn: async (applicant: Applicant) => {
      await saveApplicant(applicant);
    },
    onMutate: async (applicant) => {
      await queryClient.cancelQueries({ queryKey: ["applicants", id] });
      const prev = queryClient.getQueryData<Applicant[]>(["applicants", id]);
      queryClient.setQueryData<Applicant[]>(["applicants", id], (old) => [...(old ?? []), applicant]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["applicants", id], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants", id] });
    },
  });

  useEffect(() => {
    getJobPost(id).then((p) => {
      setJobPost(p ?? null);
      if (p) {
        getCompany(p.companyId).then((c) => setCompanyLogoUrl(c?.logoUrl ?? null));
      }
    });
  }, [id]);

  const defaultValues: ApplyFormData = {
    fullName: "",
    email: "",
    phone: "",
    currentLocation: "",
    portfolioUrl: "",
    recentProjectUrls: "",
    linkedinUrl: "",
    githubUrl: "",
    workAuthorized: true,
    needsSponsorship: false,
    noteToFounder: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = applyFormSchema.safeParse(value);
      if (!result.success) {
        const errors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const pathPart = issue.path[0];
          if (pathPart !== undefined) {
            const key = String(pathPart);
            if (!errors[key]) errors[key] = issue.message;
          }
        }
        setFieldErrors(errors);
        setAlert({ variant: "error", message: "Please fix the errors in the form." });
        return;
      }
      setFieldErrors({});
      startTransition(async () => {
        const applicant = {
          id: crypto.randomUUID(),
          jobPostId: id,
          resumeFileName,
          resumeUrl: resumeUrl || undefined,
          ...result.data,
          phone: result.data.phone ?? "",
          createdAt: Date.now(),
        };
        setOptimisticSubmitted({ email: value.email });
        await saveMutation.mutateAsync(applicant);
        startTransition(() => {
          setSubmitted({ email: value.email });
        });
      });
    },
  });

  useEffect(() => {
    const slug = slugify(fullNameValue) || "default";
    const prev = previousSlugRef.current;
    if (slug !== prev) {
      previousSlugRef.current = slug;
      const base = window.location.pathname.replace(/\/talent\/[^/]*$/, "");
      window.history.replaceState(null, "", `${base}/talent/${slug}`);
    }
  }, [fullNameValue]);

  const { startUpload } = useUploadThing("pdfUploader", {
    onClientUploadComplete: (res) => {
      const url = res[0]?.ufsUrl;
      if (url) setResumeUrl(url);
    },
  });

  const handleResumeUpload = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".pdf")) return;
      setResumeFileName(file.name);
      setIsParsing(true);
      setAlert(null);
      startUpload([file]);
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        }
        const base64 = btoa(binary);
        const parsed = await parseResume(base64);
        if (parsed.fullName) {
          form.setFieldValue("fullName", parsed.fullName);
          setFullNameValue(parsed.fullName);
        }
        if (parsed.email) form.setFieldValue("email", parsed.email);
        if (parsed.phone) form.setFieldValue("phone", parsed.phone);
        if (parsed.currentLocation) form.setFieldValue("currentLocation", parsed.currentLocation);
        if (parsed.portfolioUrl) form.setFieldValue("portfolioUrl", parsed.portfolioUrl);
        if (parsed.recentProjectUrls) form.setFieldValue("recentProjectUrls", parsed.recentProjectUrls);
        if (parsed.linkedinUrl) form.setFieldValue("linkedinUrl", parsed.linkedinUrl);
        if (parsed.githubUrl) form.setFieldValue("githubUrl", parsed.githubUrl);
        setAlert({ variant: "success", message: "Resume parsed successfully." });
        setIsParsing(false);

        const noteResult = await generateNote({
          ...parsed,
          jobTitle: jobPost?.jobTitle ?? "",
          companyName: jobPost?.companyName ?? "",
        });
        if (noteResult.noteToFounder) {
          form.setFieldValue("noteToFounder", noteResult.noteToFounder);
        }
        if (noteResult.recentProjectUrls) {
          form.setFieldValue("recentProjectUrls", noteResult.recentProjectUrls);
        }
      } catch {
        setIsParsing(false);
        setAlert({ variant: "error", message: "Could not parse resume. Please try again." });
      }
    },
    [form, jobPost, startUpload],
  );

  if (optimisticSubmitted) {
    const company = jobPost?.companyName ?? "the company";
    return (
      <div className="flex flex-col items-center py-20">
        <div className="w-full max-w-md rounded-xl bg-stone-50 px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-stone-100">
            {companyLogoUrl ? (
              <img src={companyLogoUrl} alt="" className="size-6 rounded-full object-contain" />
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-tight text-stone-500">
                {jobPost?.companyName?.charAt(0) ?? "?"}
              </span>
            )}
          </div>
          <h2 className="mb-2 text-[15px] font-medium text-stone-900">Your application has been sent</h2>
          <p className="text-[13px] leading-relaxed text-stone-500">
            {company} will review your application. One of the founders will reach out to{" "}
            <span className="text-stone-700">{optimisticSubmitted.email}</span> as soon as possible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="mx-auto w-full">
        <div className="mb-5 flex flex-col gap-2">
          <h1 className="text-xl font-normal tracking-tight text-stone-900">Apply</h1>
          {jobPost && (
            <p className="text-[14px] text-stone-500">
              {jobPost.jobTitle} at {jobPost.companyName}
            </p>
          )}
        </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex flex-col gap-8"
      >
        <div className="mb-6 flex flex-col gap-3">
          <Label className="text-[13px] font-normal text-stone-600">Your resume</Label>
          <label className="flex cursor-pointer flex-col gap-3 rounded-lg border-2 border-dashed border-stone-200/60 bg-stone-50/50 px-4 py-4 transition-colors hover:border-stone-300">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[13px] text-stone-500">
                {isParsing ? (
                  <span className="flex items-center gap-2">
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Parsing resume…
                  </span>
                ) : (
                  resumeFileName || "No file uploaded"
                )}
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-stone-900 px-3 py-1 text-[12px] text-white transition-colors hover:bg-stone-950">
                <Upload01Icon className="size-3.5" />
                Upload file
              </span>
            </div>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleResumeUpload(file);
              }}
            />
          </label>
        </div>

        {alert && (
          <div className="mb-6">
            <Alert variant={alert.variant}>
              {alert.variant === "success" ? (
                <CheckmarkCircle02Icon className="mt-0.5 size-4 shrink-0" />
              ) : (
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
              )}
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <form.Field name="fullName">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                  Full name
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    setFullNameValue(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                  placeholder="Jason Mark"
                  className="rounded-lg border-0 bg-stone-100/60 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                />
                {fieldErrors.fullName && (
                  <p className="text-[11px] text-orange-600">{fieldErrors.fullName}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                  Email
                </Label>
                <Input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="jason@acme.com"
                  className="rounded-lg border-0 bg-stone-100/60 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                />
                {fieldErrors.email && (
                  <p className="text-[11px] text-orange-600">{fieldErrors.email}</p>
                )}
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <form.Field name="phone">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                  Phone <span className="text-stone-400">(optional)</span>
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="rounded-lg border-0 bg-stone-100/60 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="currentLocation">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                  Current location
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="rounded-lg border-0 bg-stone-100/60 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <form.Field name="portfolioUrl">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                  Portfolio URL
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="jasonmark.com"
                  className="rounded-lg border-0 bg-stone-100/60 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="githubUrl">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                  GitHub URL
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="github.com/jasonmark"
                  className="rounded-lg border-0 bg-stone-100/60 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="linkedinUrl">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                LinkedIn URL
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="linkedin.com/in/jasonmark"
                className="rounded-lg border-0 bg-stone-100/60 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="recentProjectUrls">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                Recent project URLs
              </Label>
              <textarea
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="github.com/jasonmark/agentic, github.com/jasonmark/rag-pipeline"
                rows={2}
                className="block w-full resize-none overflow-y-auto rounded-lg border-0 bg-stone-100/70 px-3 py-1.5 text-[14px] text-stone-800 shadow-none outline-none transition-colors focus-visible:ring-1 focus-visible:ring-stone-300"
              />
            </div>
          )}
        </form.Field>

        <div className="flex flex-col gap-4">
          <form.Field name="needsSponsorship">
            {(field) => (
              <label className="flex items-center gap-2 text-[13px] text-stone-600">
                <Checkbox
                  checked={field.state.value}
                  onCheckedChange={(v) => field.handleChange(Boolean(v))}
                  className="size-4 rounded-sm border-stone-300/50 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                />
                Will you require visa sponsorship now or in the future?
              </label>
            )}
          </form.Field>

          <form.Field name="workAuthorized">
            {(field) => (
              <label className="flex items-center gap-2 text-[13px] text-stone-600">
                <Checkbox
                  checked={field.state.value}
                  onCheckedChange={(v) => field.handleChange(Boolean(v))}
                  className="size-4 rounded-sm border-stone-300/50 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                />
                Are you legally authorized to work in the US?
              </label>
            )}
          </form.Field>
        </div>

        <form.Field name="noteToFounder">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                A note to the founder
              </Label>
              <textarea
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Why are you excited about this role?"
                className="block w-full resize-y overflow-y-auto rounded-lg border-0 bg-stone-100/70 px-3 py-1.5 text-[14px] text-stone-800 shadow-none outline-none transition-colors focus-visible:ring-1 focus-visible:ring-stone-300 min-h-24"
              />
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit]}>
          {([canSubmit]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isPending}
              className="w-fit cursor-pointer rounded-lg bg-stone-900 px-6 py-1.5 text-[14px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Submitting…" : "Submit application"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      </div>
    </div>
  );
}
