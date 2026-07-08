"use client";

import { FontAwesomeIcon, faPlus, faXmark } from "@getyourboat/ui";
import { useId, useState, type KeyboardEvent } from "react";
import { Label } from "../ui";

interface ChipInputProps {
  label: string;
  description?: string;
  placeholder?: string;
  value: string[];
  onChange: (chips: string[]) => void;
  required?: boolean;
  suggestions?: string[];
}

/**
 * Tag/chip input: type + Enter (or comma) adds a chip, × removes one, Backspace
 * on an empty field removes the last. Values are a `string[]`, matching the API
 * payload shape for experience list fields (included, notIncluded, etc.).
 */
export function ChipInput({
  label,
  description,
  placeholder,
  value,
  onChange,
  required,
  suggestions = [],
}: ChipInputProps) {
  const [input, setInput] = useState("");
  const inputId = useId();

  const addChip = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeChip(value.length - 1);
    }
  };

  const remainingSuggestions = suggestions.filter((s) => !value.includes(s));

  return (
    <div>
      <Label required={required}>{label}</Label>
      {description ? <p className="mb-1.5 text-xs text-gray-500">{description}</p> : null}

      <div
        className="flex min-h-[52px] cursor-text flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2.5 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15"
        onClick={() => document.getElementById(inputId)?.focus()}
      >
        {value.map((chip, i) => (
          <span
            key={chip}
            className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700"
          >
            {chip}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeChip(i);
              }}
              className="ml-0.5 text-brand-500 transition-colors hover:text-danger-500"
              aria-label={`${chip} kaldır`}
            >
              <FontAwesomeIcon icon={faXmark} className="text-[12px]" aria-hidden />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) addChip(input);
          }}
          placeholder={value.length === 0 ? placeholder ?? "Yaz ve Enter'a bas…" : ""}
          className="min-w-[160px] flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>

      <p className="mt-1 text-xs text-gray-400">
        {`Her madde için Enter'a bas · ${value.length} madde eklendi`}
      </p>

      {remainingSuggestions.length > 0 ? (
        <div className="mt-2">
          <p className="mb-1.5 text-xs text-gray-400">Hızlı ekle:</p>
          <div className="flex flex-wrap gap-1.5">
            {remainingSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addChip(s)}
                className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-all hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
              >
                <FontAwesomeIcon icon={faPlus} className="text-[10px]" aria-hidden />
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
