import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Tasarım ön ayarındaki özel yazı boyutları (text-body, text-body-sm …) tailwind-merge'e
// tanıtılmazsa renk sınıfı sanılır ve aynı öğedeki text-white gibi renkleri siler.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "heading", "subheading", "body", "body-sm", "caption"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
