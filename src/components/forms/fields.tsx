import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="label-caps text-[0.65rem] text-navy/70 mb-2 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone/60">{hint}</span>}
    </label>
  );
}

const base =
  "w-full rounded-sm border border-navy/20 bg-card px-4 py-3 text-navy placeholder:text-stone/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(base, props.className)} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(base, "min-h-[140px] resize-y", props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(base, "appearance-none", props.className)} />;
}

export function SubmitButton({
  pending,
  children,
  className,
}: {
  pending: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center rounded-sm bg-navy px-8 py-3.5 label-caps text-[0.7rem] text-ivory hover:bg-midnight disabled:opacity-60 transition-colors",
        className,
      )}
    >
      {pending ? "Submitting…" : children}
    </button>
  );
}

export function SuccessPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-sm border border-gold/40 bg-gold/5 p-8 text-center">
      <div className="mx-auto mb-4 h-14 w-14 rounded-full border border-gold flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="text-gold"
        >
          <path d="M4 12l6 6L20 6" />
        </svg>
      </div>
      <h3 className="font-display text-2xl text-navy mb-2">{title}</h3>
      <p className="text-stone">{body}</p>
    </div>
  );
}
