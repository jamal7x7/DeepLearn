import { create } from "zustand";

export interface ClassItem {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  schedule: string;
  description: string;
}

interface ClassStore {
  classes: ClassItem[];
  search: string;
  setSearch: (s: string) => void;
  filteredClasses: ClassItem[];
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  editingClass: ClassItem | null;
  startEditClass: (cls: ClassItem) => void;
  stopEditClass: () => void;
  saveClass: (cls: Omit<ClassItem, "id"> | ClassItem) => void;
  removeClass: (id: string) => void;
}

const initialClasses: ClassItem[] = [
  {
    id: "1",
    name: "Math 101",
    subject: "Mathematics",
    teacher: "Dr. Alice",
    schedule: "Mon 9:00 AM",
    description: "Intro to algebra and calculus.",
  },
  {
    id: "2",
    name: "Biology A",
    subject: "Biology",
    teacher: "Mr. Bob",
    schedule: "Wed 11:00 AM",
    description: "Cell structure and genetics.",
  },
];

export const useClassStore = create<ClassStore>((set, get) => ({
  classes: initialClasses,
  search: "",
  setSearch: (s) => set({ search: s }),
  get filteredClasses() {
    const { classes, search } = get();
    if (!search) return classes;
    return classes.filter((cls) =>
      [cls.name, cls.subject, cls.teacher, cls.schedule, cls.description]
        .some((field) => field.toLowerCase().includes(search.toLowerCase()))
    );
  },
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true, editingClass: null }),
  closeModal: () => set({ isModalOpen: false }),
  editingClass: null,
  startEditClass: (cls) => set({ isModalOpen: true, editingClass: cls }),
  stopEditClass: () => set({ editingClass: null }),
  saveClass: (cls) => set((state) => {
    if ('id' in cls) {
      // Edit existing
      return {
        classes: state.classes.map((c) => c.id === cls.id ? { ...c, ...cls } : c),
        isModalOpen: false,
        editingClass: null,
      };
    } else {
      // Add new
      const newClass: ClassItem = {
        ...cls,
        id: Math.random().toString(36).slice(2, 10),
      };
      return {
        classes: [...state.classes, newClass],
        isModalOpen: false,
        editingClass: null,
      };
    }
  }),
  removeClass: (id) => set((state) => ({
    classes: state.classes.filter((c) => c.id !== id),
  })),
}));
