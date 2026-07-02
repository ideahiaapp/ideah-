"use client";

import { useRef, useEffect } from "react";

interface Props {
  html: string;
}

/* Injeta o HTML do template e expõe método para serializar os campos */
export function TemplateFormSection({ html }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  /* Conecta range inputs ao seu <output> vizinho */
  useEffect(() => {
    const div = ref.current;
    if (!div) return;
    const ranges = div.querySelectorAll<HTMLInputElement>("input[type=range]");
    ranges.forEach(range => {
      const output = range.nextElementSibling?.querySelector("output") ??
                     range.parentElement?.querySelector("output");
      if (output) {
        output.value = range.value;
        range.addEventListener("input", () => { output.value = range.value; });
      }
    });
  }, [html]);

  return (
    <>
      <style>{`
        .tpl-form section { margin-bottom: 2rem; }
        .tpl-form h2 { font-size: 1.25rem; font-weight: 700; color: #5b21b6; margin-bottom: 0.25rem; }
        .tpl-form h3 { font-size: 0.875rem; font-weight: 700; color: #374151; margin: 1.25rem 0 0.5rem; }
        .tpl-form p.hint { font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.5rem; }
        .tpl-form label { display: block; font-size: 0.8125rem; font-weight: 600; color: #4b5563; margin: 0.75rem 0 0.3rem; }
        .tpl-form textarea,
        .tpl-form input[type=text],
        .tpl-form input[type=email],
        .tpl-form input[type=tel],
        .tpl-form input[type=number] {
          width: 100%; padding: 0.625rem 1rem; font-size: 0.875rem;
          border: 1px solid #e5e7eb; border-radius: 0.75rem;
          background: #fff; color: #1f2937;
          outline: none; box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .tpl-form textarea:focus,
        .tpl-form input[type=text]:focus,
        .tpl-form input[type=email]:focus,
        .tpl-form input[type=tel]:focus,
        .tpl-form input[type=number]:focus {
          border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(167,139,250,0.15);
        }
        .tpl-form textarea { resize: vertical; }
        .tpl-form .radio-group,
        .tpl-form .checkbox-group {
          display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem;
        }
        .tpl-form .radio-group label,
        .tpl-form .checkbox-group label {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-weight: 400; margin: 0; cursor: pointer;
          background: #f9fafb; border: 1px solid #e5e7eb;
          padding: 0.375rem 0.75rem; border-radius: 9999px;
          font-size: 0.8125rem; color: #374151;
          transition: border-color 0.15s, background 0.15s;
        }
        .tpl-form .radio-group label:hover,
        .tpl-form .checkbox-group label:hover { border-color: #a78bfa; background: #f5f3ff; }
        .tpl-form input[type=radio],
        .tpl-form input[type=checkbox] { accent-color: #7c3aed; }
        .tpl-form .fields-row {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 0.5rem;
        }
        .tpl-form input[type=range] { width: 100%; accent-color: #7c3aed; margin-top: 0.5rem; }
        .tpl-form .range-label { font-size: 0.8125rem; color: #6b7280; }
        .tpl-form output { font-weight: 700; color: #5b21b6; }
      `}</style>
      <div
        className="tpl-form bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        ref={ref}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}

/** Renderiza o template HTML com as respostas já preenchidas (somente leitura) */
export function TemplateAnswersView({ html, answers }: { html: string; answers: Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const div = ref.current;
    if (!div) return;
    div.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input[name], textarea[name], select[name]"
    ).forEach(el => {
      const name  = el.getAttribute("name");
      const value = name ? answers[name] : undefined;
      if (value === undefined) return;
      if (el instanceof HTMLInputElement) {
        if (el.type === "radio") {
          el.checked = el.value === String(value);
        } else if (el.type === "checkbox") {
          const arr = Array.isArray(value) ? value as string[] : [];
          el.checked = arr.includes(el.value);
        } else if (el.type === "range") {
          el.value = String(value);
          const output = el.nextElementSibling?.querySelector("output") ??
                         el.parentElement?.querySelector("output");
          if (output) output.value = String(value);
        } else {
          el.value = String(value);
        }
      } else {
        (el as HTMLTextAreaElement | HTMLSelectElement).value = String(value);
      }
      el.setAttribute("disabled", "");
    });
  }, [html, answers]);

  return (
    <>
      <style>{`
        .tpl-ro section { margin-bottom: 2rem; }
        .tpl-ro h2 { font-size: 1.1rem; font-weight: 700; color: #5b21b6; margin-bottom: 0.25rem; }
        .tpl-ro h3 { font-size: 0.875rem; font-weight: 700; color: #374151; margin: 1.25rem 0 0.5rem; }
        .tpl-ro p.hint { font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.5rem; }
        .tpl-ro label { display: block; font-size: 0.8125rem; font-weight: 600; color: #4b5563; margin: 0.75rem 0 0.3rem; }
        .tpl-ro textarea,
        .tpl-ro input[type=text], .tpl-ro input[type=email],
        .tpl-ro input[type=tel], .tpl-ro input[type=number] {
          width: 100%; padding: 0.5rem 0.875rem; font-size: 0.875rem;
          border: 1px solid #e5e7eb; border-radius: 0.75rem;
          background: #f9fafb; color: #1f2937; box-sizing: border-box; resize: vertical;
        }
        .tpl-ro textarea:disabled, .tpl-ro input:disabled { opacity: 1; cursor: default; }
        .tpl-ro .radio-group, .tpl-ro .checkbox-group {
          display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem;
        }
        .tpl-ro .radio-group label, .tpl-ro .checkbox-group label {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-weight: 400; margin: 0; cursor: default;
          background: #f9fafb; border: 1px solid #e5e7eb;
          padding: 0.375rem 0.75rem; border-radius: 9999px;
          font-size: 0.8125rem; color: #374151;
        }
        .tpl-ro .radio-group label:has(input:checked),
        .tpl-ro .checkbox-group label:has(input:checked) {
          background: #ede9fe; border-color: #a78bfa; color: #5b21b6; font-weight: 600;
        }
        .tpl-ro input[type=radio], .tpl-ro input[type=checkbox] { accent-color: #7c3aed; }
        .tpl-ro .fields-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.5rem; }
        .tpl-ro input[type=range] { width: 100%; accent-color: #7c3aed; margin-top: 0.5rem; }
        .tpl-ro output { font-weight: 700; color: #5b21b6; }
      `}</style>
      <div ref={ref} className="tpl-ro" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

/** Serializa todos os inputs nomeados dentro do elemento para um objeto JSON */
export function serializeTemplateForm(container: HTMLElement): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const seen = new Set<string>();

  container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input[name], textarea[name], select[name]"
  ).forEach(el => {
    const name = el.getAttribute("name");
    if (!name) return;

    if (el instanceof HTMLInputElement) {
      if (el.type === "radio") {
        if (el.checked) result[name] = el.value;
      } else if (el.type === "checkbox") {
        if (!seen.has(name)) {
          // Collect all checkboxes with same name as array
          const all = container.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name="${name}"]`);
          const values = Array.from(all).filter(c => c.checked).map(c => c.value);
          result[name] = values;
          seen.add(name);
        }
      } else if (el.type === "range") {
        result[name] = Number(el.value);
      } else {
        result[name] = el.value;
      }
    } else {
      result[name] = (el as HTMLTextAreaElement | HTMLSelectElement).value;
    }
  });

  return result;
}
