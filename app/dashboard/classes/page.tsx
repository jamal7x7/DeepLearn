"use client";
import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useClassStore } from "@/store/class-store";
import { Plus, Edit, Trash } from "lucide-react";

export default function ClassesPage() {
  const {
    classes,
    search,
    setSearch,
    filteredClasses,
    isModalOpen,
    openModal,
    closeModal,
    editingClass,
    startEditClass,
    stopEditClass,
    saveClass,
    removeClass,
  } = useClassStore();

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Classes</h1>
        <Button onClick={openModal} variant="default" size="sm">
          <Plus className="w-4 h-4 mr-1" /> New Class
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Input
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClasses.map(cls => (
                <TableRow key={cls.id}>
                  <TableCell className="font-semibold">{cls.name}</TableCell>
                  <TableCell><Badge>{cls.subject}</Badge></TableCell>
                  <TableCell>{cls.teacher}</TableCell>
                  <TableCell>{cls.schedule}</TableCell>
                  <TableCell className="truncate max-w-xs">{cls.description}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => startEditClass(cls)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => removeClass(cls.id)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ClassModal
        open={isModalOpen}
        onClose={closeModal}
        onSave={saveClass}
        editingClass={editingClass}
        stopEdit={stopEditClass}
      />
    </div>
  );
}

function ClassModal({ open, onClose, onSave, editingClass, stopEdit }) {
  const [form, setForm] = React.useState(
    editingClass || { name: "", subject: "", teacher: "", schedule: "", description: "" }
  );

  React.useEffect(() => {
    setForm(editingClass || { name: "", subject: "", teacher: "", schedule: "", description: "" });
  }, [editingClass, open]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
    onClose();
    stopEdit();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{editingClass ? "Edit Class" : "Add Class"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <Input name="name" placeholder="Class Name" value={form.name} onChange={handleChange} required />
          <Input name="subject" placeholder="Subject" value={form.subject} onChange={handleChange} required />
          <Input name="teacher" placeholder="Teacher" value={form.teacher} onChange={handleChange} required />
          <Input name="schedule" placeholder="Schedule (e.g. Mon 9am)" value={form.schedule} onChange={handleChange} required />
          <Input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="default">{editingClass ? "Save" : "Add"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
