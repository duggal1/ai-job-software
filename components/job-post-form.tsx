"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MarkdownEditor } from "@/components/markdown-editor";
import { LogoUpload } from "@/components/logo-upload";
import { saveJob } from "@/lib/actions/save-job";
import { slugify } from "@/lib/slug";
import { jobPostSchema, EMPLOYMENT_TYPES, WORK_MODES, JOB_CATEGORIES } from "@/lib/validation";
import { EXPERIENCE_LEVELS } from "@/lib/experience";
import { COUNTRIES, formatLocation } from "@/lib/location";
import { JOB_TITLES } from "@/lib/job-titles";
import { APPLY_MODES } from "@/lib/types";
import { AiAutofillDialog } from "@/components/ai-autofill-dialog";
import { Spinner } from "@/components/ui/spinner";
import type { AutofillResult } from "@/lib/actions/autofill";
import type { JobPostFormData } from "@/lib/validation";
import type { Company, JobPost } from "@/lib/types";
import { z } from "zod";

export function JobPostForm({ companyId: companyIdProp }: { companyId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isCustomTitle, setIsCustomTitle] = useState(false);

  const [optimisticStatus, setOptimisticStatus] = useOptimistic<"idle" | "publishing">("idle");

  const saveMutation = useMutation({
    mutationFn: ({ company, jobPost }: { company: Company; jobPost: JobPost }) =>
      saveJob({ company, jobPost }),
    onMutate: async ({ company, jobPost }) => {
      await queryClient.cancelQueries({ queryKey: ["companies"] });
      await queryClient.cancelQueries({ queryKey: ["jobPosts"] });
      const prevCompanies = queryClient.getQueryData<Company[]>(["companies"]);
      const prevJobPosts = queryClient.getQueryData<JobPost[]>(["jobPosts"]);
      queryClient.setQueryData<Company[]>(["companies"], (old) => [...(old ?? []), company]);
      queryClient.setQueryData<JobPost[]>(["jobPosts"], (old) => [...(old ?? []), jobPost]);
      return { prevCompanies, prevJobPosts };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevCompanies) queryClient.setQueryData(["companies"], ctx.prevCompanies);
      if (ctx?.prevJobPosts) queryClient.setQueryData(["jobPosts"], ctx.prevJobPosts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["jobPosts"] });
    },
  });

  const defaultValues: JobPostFormData = {
    companyName: "",
    companyDomain: "",
    jobTitle: "",
    descriptionMarkdown: "",
    estimatedSalary: "",
    employmentType: "full-time",
    workMode: "remote",
    location: "",
    yearsOfExperience: "",
    category: undefined,
    skills: "",
    visaSponsorship: false,
    aiBudget: "",
    applyMode: "platform",
    applyUrl: "",
  };

  const handleAutofill = (data: AutofillResult) => {
    form.setFieldValue("companyName", data.companyName);
    form.setFieldValue("companyDomain", data.companyDomain);
    form.setFieldValue("jobTitle", data.jobTitle);
    form.setFieldValue("descriptionMarkdown", data.descriptionMarkdown);
    form.setFieldValue("estimatedSalary", data.estimatedSalary);
    form.setFieldValue("employmentType", data.employmentType);
    form.setFieldValue("workMode", data.workMode);
    form.setFieldValue("yearsOfExperience", data.yearsOfExperience);
    if (data.category) form.setFieldValue("category", data.category);
    if (data.skills) form.setFieldValue("skills", data.skills);
    if (data.aiBudget) form.setFieldValue("aiBudget", data.aiBudget);
    form.setFieldValue("visaSponsorship", data.visaSponsorship);
    if (data.companyName && !selectedCountry) {
      setIsCustomTitle(!JOB_TITLES.some((title) => title === data.jobTitle));
    }
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = jobPostSchema.safeParse(value);
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
        return;
      }
      setFieldErrors({});
      const companyId = companyIdProp;
      const companySlug = slugify(result.data.companyName);
      const jobPostId = crypto.randomUUID();

      const company = {
        id: companyId,
        slug: companySlug,
        name: result.data.companyName,
        domain: result.data.companyDomain,
        logoUrl: logoUrl ?? undefined,
        createdAt: Date.now(),
      };

      const jobPost = {
        id: jobPostId,
        companyId,
        companyName: result.data.companyName,
        companySlug,
        jobTitle: result.data.jobTitle,
        companyDomain: result.data.companyDomain,
        descriptionMarkdown: result.data.descriptionMarkdown,
        estimatedSalary: result.data.estimatedSalary,
        employmentType: result.data.employmentType,
        workMode: result.data.workMode,
        location: result.data.location,
        yearsOfExperience: result.data.yearsOfExperience || undefined,
        category: result.data.category || undefined,
        skills: result.data.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        visaSponsorship: result.data.visaSponsorship,
        aiBudget: result.data.aiBudget,
        applyMode: result.data.applyMode,
        applyUrl: result.data.applyUrl || undefined,
        createdAt: Date.now(),
      };

      startTransition(async () => {
        setOptimisticStatus("publishing");
        await saveMutation.mutateAsync({ company, jobPost });
          router.push(`/company/${jobPostId}/${companySlug}`);
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-12"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-normal tracking-tight text-stone-900">Post a job</h1>
          <p className="text-[14px] text-stone-500">
            Enter your company details and role description to generate a shareable job post.
          </p>
        </div>
        <AiAutofillDialog onAutofill={handleAutofill} />
      </div>

      <div className="flex flex-col gap-8">
        <LogoUpload
          url={logoUrl}
          onUploadComplete={setLogoUrl}
          onRemove={() => setLogoUrl(null)}
        />

        <form.Field name="companyName">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                Company name
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  if (fieldErrors.companyName) setFieldErrors((prev) => ({ ...prev, companyName: "" }));
                }}
                placeholder="Acme"
                className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
              />
              {fieldErrors.companyName && (
                <p className="text-[11px] text-orange-600">{fieldErrors.companyName}</p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="companyDomain">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                Company domain
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  if (fieldErrors.companyDomain) setFieldErrors((prev) => ({ ...prev, companyDomain: "" }));
                }}
                placeholder="acme.com"
                className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
              />
              {fieldErrors.companyDomain && (
                <p className="text-[11px] text-orange-600">{fieldErrors.companyDomain}</p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="jobTitle">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                Job title
              </Label>
              {isCustomTitle ? (
                <div className="flex flex-col gap-2">
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      if (fieldErrors.jobTitle) setFieldErrors((prev) => ({ ...prev, jobTitle: "" }));
                    }}
                    placeholder="Enter custom title"
                    className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTitle(false);
                      field.handleChange("");
                    }}
                    className="w-fit cursor-pointer text-[12px] text-stone-500 hover:text-stone-700"
                  >
                    Pick from list
                  </button>
                </div>
              ) : (
                <Select
                  value={field.state.value}
                  onValueChange={(v) => {
                    if (!v) return;
                    if (v === "__custom__") {
                      setIsCustomTitle(true);
                      field.handleChange("");
                    } else {
                      field.handleChange(v);
                      if (fieldErrors.jobTitle) setFieldErrors((prev) => ({ ...prev, jobTitle: "" }));
                    }
                  }}
                >
                  <SelectTrigger className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none">
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TITLES.map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {fieldErrors.jobTitle && (
                <p className="text-[11px] text-orange-600">{fieldErrors.jobTitle}</p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="descriptionMarkdown">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-normal text-stone-600">Job description</Label>
              <MarkdownEditor value={field.state.value} onChange={field.handleChange} />
              {fieldErrors.descriptionMarkdown && (
                <p className="text-[11px] text-orange-600">{fieldErrors.descriptionMarkdown}</p>
              )}
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-2 gap-6">
          <form.Field name="estimatedSalary">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                  Estimated salary
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                  onBlur={(e) => {
                    let v = e.target.value;
                    v = v.replace(/(\d+(?:\.\d+)?)\s*k/gi, (_, n) =>
                      (parseFloat(n) * 1000).toLocaleString("en-US"),
                    );
                    v = v.replace(
                      /(^|[-–])\s*(\d[\d,.]*)/g,
                      (_, sep, num) => {
                        const hasCurrency = /^[$€£¥₹]/.test(num);
                        return sep + (hasCurrency ? "" : " $") + num.trim();
                      },
                    );
                    if (v !== e.target.value) field.handleChange(v);
                  }}
                  placeholder="$120k – $150k"
                  className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="yearsOfExperience">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                  Experience
                </Label>
                <Select value={field.state.value} onValueChange={(v) => { if (v) field.handleChange(v) }}>
                  <SelectTrigger className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none">
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
            )}
          </form.Field>
        </div>

        <form.Field name="location">
          {(field) => (
            <div className="flex flex-col gap-3">
              <Label className="text-[13px] font-normal text-stone-600">
                Location
              </Label>
              <div className="flex flex-col gap-2">
                <Select
                  value={selectedCountry}
                  onValueChange={(v) => {
                    if (!v) return;
                    setSelectedCountry(v);
                    setSelectedCity("");
                    field.handleChange("");
                  }}
                >
                  <SelectTrigger className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-2">
                          <span className="text-base">{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedCountry && (
                  <Select
                    value={selectedCity}
                    onValueChange={(v) => {
                      if (!v) return;
                      setSelectedCity(v);
                      field.handleChange(formatLocation(v, selectedCountry));
                      if (fieldErrors.location) setFieldErrors((prev) => ({ ...prev, location: "" }));
                    }}
                  >
                    <SelectTrigger className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.find((c) => c.code === selectedCountry)?.cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {fieldErrors.location && (
                <p className="text-[11px] text-orange-700">{fieldErrors.location}</p>
              )}
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-3 gap-6">
          <form.Field name="employmentType">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px] font-normal text-stone-600">Role type</Label>
                <Select value={field.state.value} onValueChange={(value) => {
                  const parsed = z.enum(EMPLOYMENT_TYPES).safeParse(value);
                  if (parsed.success) field.handleChange(parsed.data);
                }}>
                  <SelectTrigger className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none">
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
            )}
          </form.Field>

          <form.Field name="category">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px] font-normal text-stone-600">Category</Label>
                <Select value={field.state.value ?? ""} onValueChange={(value) => {
                  const parsed = z.enum(JOB_CATEGORIES).safeParse(value);
                  if (parsed.success) field.handleChange(parsed.data);
                }}>
                  <SelectTrigger className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="workMode">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px] font-normal text-stone-600">Work mode</Label>
                <ToggleGroup
                  value={field.state.value ? [field.state.value] : []}
                  onValueChange={(values) => {
                    const [value] = values;
                    if (value) {
                      const parsed = z.enum(WORK_MODES).safeParse(value);
                      if (parsed.success) field.handleChange(parsed.data);
                    }
                  }}
                  className="justify-start gap-2"
                >
                  {WORK_MODES.map((mode) => (
                    <ToggleGroupItem
                      key={mode}
                      value={mode}
                      className="rounded-lg border border-stone-200/50 bg-stone-50/80 text-[13px] text-stone-600 data-[state=on]:bg-stone-900 data-[state=on]:text-white"
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            )}
          </form.Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <form.Field name="skills">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                Skills
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="LangChain, Docker, TypeScript"
                className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="aiBudget">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                AI budget
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="$500/month"
                className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="visaSponsorship">
        {(field) => (
          <label className="flex items-center gap-2 text-[13px] text-stone-600">
            <input
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
              className="size-4 rounded-sm accent-stone-900"
            />
            Offers visa sponsorship
          </label>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-6">
        <form.Field name="applyMode">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-normal text-stone-600">How candidates apply</Label>
              <Select value={field.state.value} onValueChange={(value) => {
                const parsed = z.enum(APPLY_MODES).safeParse(value);
                if (parsed.success) field.handleChange(parsed.data);
              }}>
                <SelectTrigger className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">On Fly AI</SelectItem>
                  <SelectItem value="external">On company website</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="applyUrl">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} className="text-[13px] font-normal text-stone-600">
                Apply URL <span className="text-stone-400">(external only)</span>
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="acme.com/careers/123"
                className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit]) => (
          <Button
            type="submit"
            disabled={!canSubmit || isPending || saveMutation.isPending}
           className="w-fit cursor-pointer rounded-lg hover:underline bg-stone-900 px-6 py-1.5 text-[14px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-stone-950"
          >
            {optimisticStatus === "publishing" || saveMutation.isPending
              ? <><Spinner className="size-3.5" /> Publishing…</>
              : isPending
                ? "Generating…"
                : "Generate job post"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
