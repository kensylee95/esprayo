// types/event.types.ts
export enum EventType {
  WEDDING = "wedding",
  BIRTHDAY = "birthday",
  GRADUATION = "graduation",
  ANNIVERSARY = "anniversary",
  NAMING = "naming",
  OTHER = "other",
}

export interface CreateEventForm {
  type: EventType | null;
  title: string;
  venue: string;
  welcomeMessage: string;
}

export const EVENT_TYPE_OPTIONS: {
  value: EventType;
  label: string;
  emoji: string;
}[] = [
  { value: EventType.WEDDING, label: "Wedding", emoji: "💍" },
  { value: EventType.BIRTHDAY, label: "Birthday", emoji: "🎂" },
  { value: EventType.GRADUATION, label: "Graduation", emoji: "🎓" },
  { value: EventType.ANNIVERSARY, label: "Anniversary", emoji: "💑" },
  { value: EventType.NAMING, label: "Naming", emoji: "👶" },
  { value: EventType.OTHER, label: "Other", emoji: "✨" },
];

export const EVENT_TYPE_EMOJI: Record<EventType, string> = {
  [EventType.WEDDING]: "💍",
  [EventType.BIRTHDAY]: "🎂",
  [EventType.GRADUATION]: "🎓",
  [EventType.ANNIVERSARY]: "💑",
  [EventType.NAMING]: "👶",
  [EventType.OTHER]: "✨",
};
