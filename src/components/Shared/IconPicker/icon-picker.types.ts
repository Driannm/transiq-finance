export type IconId = string;

export type IconPickerProps = {
  value: IconId | null;
  onChange: (iconId: IconId) => void;
  category?: "saving" | "bill" | "general" | "all";
};