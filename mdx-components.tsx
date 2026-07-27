import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h2: (props) => (
    <h2
      className="mt-12 border-t border-line pt-8 text-2xl font-bold"
      {...props}
    />
  ),
  h3: (props) => <h3 className="mt-8 text-lg font-bold" {...props} />,
  p: (props) => <p className="mt-4 leading-relaxed text-muted" {...props} />,
  ul: (props) => (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-muted" {...props} />
  ),
  ol: (props) => (
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: (props) => (
    <a
      className="text-accent underline underline-offset-2 hover:text-accent-hover"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-bold text-ink" {...props} />,
  code: (props) => (
    <code
      className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[0.9em]"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="prose-scroll mt-6 rounded-lg bg-ink p-4 font-mono text-sm text-page"
      {...props}
    />
  ),
  table: (props) => (
    <div className="prose-scroll mt-6">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-b border-line px-3 py-2 text-left font-bold"
      {...props}
    />
  ),
  td: (props) => (
    <td className="border-b border-line px-3 py-2 text-muted" {...props} />
  ),
  blockquote: (props) => (
    <blockquote
      className="mt-6 border-l-2 border-accent pl-4 text-muted italic"
      {...props}
    />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
