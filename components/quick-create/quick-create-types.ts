// Types for Quick Create Modal

export type TeamType = "class" | "club" | "study group" | "other";

export interface TeamFormValues {
  name: string;
  type: TeamType;
}

export interface InviteFormValues {
  email: string;
}

export interface CourseFormValues {
  title: string;
  code: string;
}
