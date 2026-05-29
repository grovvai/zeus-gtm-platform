import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { aiApi } from "@/api/client";
import type { AiCallSummaryResponse, AiEmailResponse, AiLinkedinResponse, Sentiment } from "@/types";
import { Sparkles, Mail, Linkedin, Phone, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-compose")({
  head: () => ({ meta: [{ title: "Ask Zeus AI — Zeus" }] }),
  component: AiCompose,
});

type Mode = "email" | "linkedin" | "call";

function AiCompose() {
  const status = useQuery({ queryKey: ["ai", "status"], queryFn: () => aiApi.status(), retry: false });
  const enabled = status.data?.enabled ?? false;
  const [mode, setMode] = useState<Mode>("email");

  return (
    <AppShell title="Ask Zeus AI">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ModeButton active={mode === "email"} onClick={() => setMode("email")} icon={<Mail className="h-4 w-4" />} label="Email" />
        <ModeButton active={mode === "linkedin"} onClick={() => setMode("linkedin")} icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" />
        <ModeButton active={mode === "call"} onClick={() => setMode("call")} icon={<Phone className="h-4 w-4" />} label="Call Summary" />
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {enabled ? `AI online · ${status.data?.model ?? "Claude Opus 4.7"}` : "AI unavailable"}
        </div>
      </div>

      {!enabled && (
        <div className="mb-4 rounded-md border border-warning/40 bg-[color:var(--color-warning)]/10 p-3 text-xs">
          AI is currently disabled. The composers will not be able to generate output.
        </div>
      )}

      <div className={enabled ? "" : "pointer-events-none opacity-60"}>
        {mode === "email" && <EmailComposer />}
        {mode === "linkedin" && <LinkedinComposer />}
        {mode === "call" && <CallSummaryComposer />}
      </div>
    </AppShell>
  );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
    >{icon}{label}</button>
  );
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary"
    ><Copy className="h-3 w-3" /> Copy</button>
  );
}

function EmailComposer() {
  const [firstName, setF] = useState("");
  const [lastName, setL] = useState("");
  const [email, setE] = useState("");
  const [purpose, setP] = useState("Book a 20-minute discovery call");
  const [tone, setT] = useState("friendly-professional");
  const [result, setResult] = useState<AiEmailResponse | null>(null);

  const m = useMutation({
    mutationFn: () => aiApi.email({ contact: { firstName, lastName, email }, purpose, tone }),
    onSuccess: setResult,
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <form
        onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
        className="space-y-3 rounded-lg border border-border bg-card p-4"
      >
        <div className="grid grid-cols-2 gap-2">
          <Field label="First name"><Input value={firstName} onChange={setF} /></Field>
          <Field label="Last name"><Input value={lastName} onChange={setL} /></Field>
        </div>
        <Field label="Email"><Input value={email} onChange={setE} type="email" /></Field>
        <Field label="Purpose"><Input value={purpose} onChange={setP} /></Field>
        <Field label="Tone">
          <select value={tone} onChange={(e) => setT(e.target.value)} className={inputCls}>
            <option value="friendly-professional">Friendly professional</option>
            <option value="direct">Direct</option>
            <option value="warm">Warm</option>
            <option value="formal">Formal</option>
          </select>
        </Field>
        <button disabled={m.isPending} className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {m.isPending ? "Generating…" : "Generate email"}
        </button>
      </form>

      <div className="rounded-lg border border-border bg-card p-4">
        {result ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Subject · {result.wordCount} words</div>
              <CopyButton text={`Subject: ${result.subject}\n\n${result.body}`} />
            </div>
            <div className="rounded-md border border-border bg-background p-3 text-sm font-medium">{result.subject}</div>
            <pre className="mt-3 whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-sm leading-relaxed">{result.body}</pre>
          </>
        ) : <p className="text-sm text-muted-foreground">Output appears here.</p>}
      </div>
    </div>
  );
}

function LinkedinComposer() {
  const [type, setType] = useState<"connect" | "dm">("connect");
  const [firstName, setF] = useState("");
  const [lastName, setL] = useState("");
  const [purpose, setP] = useState("Introduce GroVv AI and start a conversation");
  const [tone, setT] = useState("conversational");
  const [result, setResult] = useState<AiLinkedinResponse | null>(null);

  const m = useMutation({
    mutationFn: () => aiApi.linkedin({ contact: { firstName, lastName }, type, purpose, tone }),
    onSuccess: setResult,
    onError: (e) => toast.error((e as Error).message),
  });

  const cap = type === "connect" ? 300 : 1900;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <form
        onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
        className="space-y-3 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex gap-2">
          {(["connect", "dm"] as const).map((t) => (
            <button
              key={t} type="button" onClick={() => setType(t)}
              className={`rounded-md border px-3 py-1.5 text-xs ${type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            >{t === "connect" ? "Connect (≤300)" : "DM (≤1900)"}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="First name"><Input value={firstName} onChange={setF} /></Field>
          <Field label="Last name"><Input value={lastName} onChange={setL} /></Field>
        </div>
        <Field label="Purpose"><Input value={purpose} onChange={setP} /></Field>
        <Field label="Tone"><Input value={tone} onChange={setT} /></Field>
        <button disabled={m.isPending} className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {m.isPending ? "Generating…" : "Generate"}
        </button>
      </form>

      <div className="rounded-lg border border-border bg-card p-4">
        {result ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{result.type.toUpperCase()} · {result.charCount}/{cap}</div>
              <CopyButton text={result.message} />
            </div>
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-sm leading-relaxed">{result.message}</pre>
          </>
        ) : <p className="text-sm text-muted-foreground">Output appears here.</p>}
      </div>
    </div>
  );
}

function CallSummaryComposer() {
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<AiCallSummaryResponse | null>(null);
  const m = useMutation({
    mutationFn: () => aiApi.callSummary({ transcript }),
    onSuccess: setResult,
    onError: (e) => toast.error((e as Error).message),
  });

  const sentimentCls: Record<Sentiment, string> = {
    positive: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] border-[color:var(--color-success)]/30",
    neutral: "bg-muted text-muted-foreground border-border",
    negative: "bg-destructive/15 text-destructive border-destructive/30",
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <form
        onSubmit={(e) => { e.preventDefault(); if (transcript.trim()) m.mutate(); }}
        className="space-y-3 rounded-lg border border-border bg-card p-4"
      >
        <Field label="Call transcript">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={14}
            placeholder="Paste full transcript…"
            className={`${inputCls} min-h-[280px] font-mono text-xs`}
          />
        </Field>
        <button disabled={m.isPending || !transcript.trim()} className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {m.isPending ? "Summarizing…" : "Summarize"}
        </button>
      </form>

      <div className="rounded-lg border border-border bg-card p-4">
        {result ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Summary</h3>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${sentimentCls[result.sentiment]}`}>{result.sentiment}</span>
            </div>
            <p className="text-sm">{result.summary}</p>
            <Section title="Key points" items={result.keyPoints} />
            <Section title="Objections" items={result.objections} />
            <Section title="Next steps" items={result.nextSteps} />
          </div>
        ) : <p className="text-sm text-muted-foreground">Output appears here.</p>}
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
      <ul className="mt-1 list-disc pl-5 text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Input({ value, onChange, type = "text" }: { value: string; onChange: (v: string) => void; type?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
}
