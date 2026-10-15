import { flagUrl } from "../data/flags";
import type { Country } from "../data/countries";

interface FlagProps {
  country: Country;
  /** Until the answer is shown, the alt text must not give it away. */
  revealed: boolean;
  size?: "large" | "option" | "small";
  /** Alt text while hidden. Defaults to "A mystery flag". */
  label?: string;
}

export function Flag({ country, revealed, size = "large", label = "A mystery flag" }: FlagProps) {
  return (
    <img
      className={`flag flag-${size}`}
      src={flagUrl(country.code)}
      alt={revealed ? `Flag of ${country.name}` : label}
      draggable={false}
    />
  );
}
