import { Alert } from "./feedback";

export interface FormErrorBannerProps {
  /** Field key → error message */
  fieldErrors: Record<string, string>;
  /** Optional map of field key → display label for the summary list */
  fieldLabels?: Record<string, string>;
  className?: string;
}

/**
 * Summary banner for validation failures. Lists how many fields need attention
 * and shows each field's specific error message.
 */
export function FormErrorBanner({
  fieldErrors,
  fieldLabels,
  className,
}: FormErrorBannerProps) {
  const entries = Object.entries(fieldErrors);
  if (entries.length === 0) return null;

  const count = entries.length;
  const title =
    count === 1
      ? "1 alan kontrol edilmeli"
      : `${count} alan kontrol edilmeli`;

  return (
    <Alert variant="danger" className={className}>
      <div className="space-y-2">
        <p className="font-medium">{title}</p>
        <ul className="list-disc space-y-1 pl-4">
          {entries.map(([field, message]) => (
            <li key={field}>
              <span className="font-medium">
                {fieldLabels?.[field] ?? field.replace(/_/g, " ")}:
              </span>{" "}
              {message}
            </li>
          ))}
        </ul>
      </div>
    </Alert>
  );
}
