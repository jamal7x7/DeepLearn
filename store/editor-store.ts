import { create } from "zustand";

export interface EditorFile {
  id: string;
  name: string;
  content: string;
}

interface EditorStore {
  files: EditorFile[];
  currentFileId: string;
  setCurrentFileId: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  createFile: () => void;
  deleteFile: (id: string) => void;
  toolbarAction: string | null;
  setToolbarAction: (action: string | null) => void;
}

const initialFiles: EditorFile[] = [
  { id: "intro", name: "Introduction.mdx", content: "# Welcome to your course!\nStart editing..." },
  { id: "chapter1", name: "Chapter1.mdx", content: "## Chapter 1\nContent here..." },
];

export const useEditorStore = create<EditorStore>((set, get) => ({
  files: initialFiles,
  currentFileId: initialFiles[0].id,
  setCurrentFileId: (id) => set({ currentFileId: id }),
  updateFileContent: (id, content) => set(state => ({
    files: state.files.map(f => f.id === id ? { ...f, content } : f),
  })),
  createFile: () => set(state => {
    const newId = Math.random().toString(36).slice(2, 10);
    const newFile = { id: newId, name: `NewFile${state.files.length + 1}.mdx`, content: "" };
    return {
      files: [...state.files, newFile],
      currentFileId: newId,
    };
  }),
  deleteFile: (id) => set(state => {
    let files = state.files.filter(f => f.id !== id);
    let currentFileId = files.length ? files[0].id : "";
    return { files, currentFileId };
  }),
  toolbarAction: null,
  setToolbarAction: (action) => set({ toolbarAction: action }),
}));
