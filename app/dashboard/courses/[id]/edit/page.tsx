"use client";
import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Save, Folder, FileText, Trash } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

// Placeholder for MDX rendering (replace with real MDX preview in production)
function MDXPreview({ value }: { value: string }) {
  return (
    <div className="prose prose-neutral max-w-none border-l-2 pl-4 border-muted/30 bg-muted/10 rounded-md min-h-[200px]">
      {value || <span className="text-muted-foreground">Live MDX preview...</span>}
    </div>
  );
}

export default function CourseEditorPage({ params }: { params: { id: string } }) {
  const {
    files,
    currentFileId,
    setCurrentFileId,
    updateFileContent,
    createFile,
    deleteFile,
    toolbarAction,
    setToolbarAction,
  } = useEditorStore();
  const file = files.find(f => f.id === currentFileId) || files[0];

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 h-[90vh]">
      {/* File Tree Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0 border-r pr-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">Files</span>
          <Button size="icon" variant="ghost" onClick={createFile}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <ul className="space-y-1">
          {files.map(f => (
            <li key={f.id} className="flex items-center gap-2">
              <Button
                variant={f.id === currentFileId ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentFileId(f.id)}
              >
                <FileText className="w-4 h-4 mr-2" /> {f.name}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => deleteFile(f.id)}>
                <Trash className="w-4 h-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {/* Editor + Preview Split Pane */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex flex-row items-center gap-4">
            <span className="font-semibold text-xl">{file.name}</span>
            <div className="flex gap-2">
              <Button size="icon" variant={toolbarAction === "bold" ? "secondary" : "ghost"} onClick={() => setToolbarAction("bold")}>B</Button>
              <Button size="icon" variant={toolbarAction === "italic" ? "secondary" : "ghost"} onClick={() => setToolbarAction("italic")}>I</Button>
              <Button size="icon" variant={toolbarAction === "code" ? "secondary" : "ghost"} onClick={() => setToolbarAction("code")}>{"</>"}</Button>
              <Button size="icon" variant={toolbarAction === "image" ? "secondary" : "ghost"} onClick={() => setToolbarAction("image")}>IMG</Button>
              <Button size="icon" variant={toolbarAction === "checklist" ? "secondary" : "ghost"} onClick={() => setToolbarAction("checklist")}>☑</Button>
              <Button size="icon" variant={toolbarAction === "quote" ? "secondary" : "ghost"} onClick={() => setToolbarAction("quote")}>"</Button>
            </div>
            <Button variant="default" size="sm" className="ml-auto" onClick={() => {/* Save logic */}}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 flex-1">
            <textarea
              className="flex-1 min-h-[200px] rounded-md border p-2 font-mono bg-background resize-none"
              value={file.content}
              onChange={e => updateFileContent(file.id, e.target.value)}
              placeholder="Write MDX content here..."
            />
            <div className="flex-1">
              <MDXPreview value={file.content} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
