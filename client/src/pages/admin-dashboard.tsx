import { useState } from "react";
import { useStore } from "@/lib/store";
import DashboardLayout from "./dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Users, Monitor, Speaker, Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { halls, addHall, deleteHall } = useStore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([]);

  const toggleFeature = (feature: string) => {
    setFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleAddHall = () => {
    if (!name || !capacity) {
      toast({ title: "Validation Error", description: "Name and Capacity are required", variant: "destructive" });
      return;
    }

    addHall({
      name,
      capacity: parseInt(capacity),
      description,
      features
    });

    setIsDialogOpen(false);
    resetForm();
    toast({ title: "Success", description: "New hall added to the system." });
  };

  const handleDeleteHall = (id: string) => {
    if (confirm("Are you sure? This will cancel all bookings associated with this hall.")) {
      deleteHall(id);
      toast({ title: "Deleted", description: "Hall removed successfully." });
    }
  };

  const resetForm = () => {
    setName("");
    setCapacity("");
    setDescription("");
    setFeatures([]);
  };

  const featureOptions = [
    { id: "Projector", icon: Monitor },
    { id: "AC", icon: Wind },
    { id: "Sound System", icon: Speaker },
    { id: "Whiteboard", icon: Users }, // Placeholder icon
  ];

  return (
    <DashboardLayout 
      title="Admin Control Panel" 
      subtitle="Manage seminar halls and system configurations."
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Managed Halls</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add New Hall
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Seminar Hall</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Hall Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Einstein Hall" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Seating Capacity</Label>
                  <Input id="capacity" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 100" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the venue..." />
                </div>
                <div className="grid gap-2">
                  <Label>Features</Label>
                  <div className="flex flex-wrap gap-2">
                    {featureOptions.map(opt => (
                      <Button
                        key={opt.id}
                        type="button"
                        variant={features.includes(opt.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleFeature(opt.id)}
                        className="h-8"
                      >
                        <opt.icon className="mr-2 h-3 w-3" />
                        {opt.id}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddHall}>Save Hall</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hall Name</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {halls.map((hall) => (
                  <TableRow key={hall.id}>
                    <TableCell className="font-medium">
                      <div>{hall.name}</div>
                      <div className="text-xs text-muted-foreground">{hall.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{hall.capacity} Seats</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {hall.features.map(f => (
                          <span key={f} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{f}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteHall(hall.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
