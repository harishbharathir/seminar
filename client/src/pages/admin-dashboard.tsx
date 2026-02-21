import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import { Building2, Users, Clock, CheckCircle, XCircle, Download, Search, LogOut, TrendingUp, UserPlus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";

interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  department?: string;
  role: "admin" | "faculty";
  createdAt: string;
}

interface Hall {
  id: string;
  name: string;
  capacity: string;
  location?: string;
  amenities?: string;
  createdAt: string;
}

interface Booking {
  id: string;
  hallId: string;
  userId: string;
  facultyName?: string;
  bookingReason?: string;
  bookingDate: string;
  period: number;
  status: "pending" | "accepted" | "booked" | "rejected" | "cancelled";
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

const PERIODS = [
  { id: 1, time: "9:50-10:00" },
  { id: 2, time: "10:00-10:45" },
  { id: 3, time: "11:00-11:50" },
  { id: 4, time: "11:50-12:45" },
  { id: 5, time: "1:25-2:20" },
  { id: 6, time: "2:20-3:05" },
  { id: 7, time: "3:10-4:00" },
  { id: 8, time: "4:00-4:50" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "accepted": return "bg-blue-100 text-blue-800 border-blue-300";
    case "booked": return "bg-green-100 text-green-800 border-green-300";
    case "rejected": return "bg-red-100 text-red-800 border-red-300";
    case "cancelled": return "bg-gray-100 text-gray-800 border-gray-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showNewHallDialog, setShowNewHallDialog] = useState(false);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedBookingForReject, setSelectedBookingForReject] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [newHall, setNewHall] = useState({
    name: "",
    capacity: "",
    location: "",
    amenities: "",
  });

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    department: "",
    role: "faculty" as "admin" | "faculty",
  });

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    fetchHalls();
    fetchBookings();
    fetchUsers();

    newSocket.on("hall:created", (hall: Hall | null) => {
      if (!hall) return;
      setHalls((prev) => [...prev, hall]);
      toast({ title: "✨ New hall added", description: hall.name });
    });

    newSocket.on("booking:created", (booking: Booking | null) => {
      if (!booking) return;
      setBookings((prev) => [...prev, booking]);
      toast({ title: "📋 New booking request", description: "Check pending requests" });
    });

    newSocket.on("booking:updated", (booking: Booking | null) => {
      if (!booking) return;
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? booking : b)));
    });

    newSocket.on("booking:cancelled", (booking: Booking | null) => {
      if (!booking) return;
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? booking : b)));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchHalls = async () => {
    try {
      const res = await fetch("/api/halls", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setHalls(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch halls", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch halls", variant: "destructive" });
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch bookings", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch bookings", variant: "destructive" });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
    }
  };

  const createHall = async () => {
    if (!newHall.name || !newHall.capacity) {
      toast({ title: "Error", description: "Name and capacity are required", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/halls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newHall),
      });

      if (res.ok) {
        setNewHall({ name: "", capacity: "", location: "", amenities: "" });
        setShowNewHallDialog(false);
        fetchHalls();
        toast({ title: "✅ Success", description: "Hall created successfully" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create hall", variant: "destructive" });
    }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast({ title: "Error", description: "Username and password are required", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        setNewUser({ username: "", password: "", name: "", email: "", department: "", role: "faculty" });
        setShowNewUserDialog(false);
        fetchUsers();
        toast({ title: "✅ Success", description: "Faculty account created successfully" });
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchUsers();
        toast({ title: "✅ Success", description: "User deleted successfully" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const payload: any = { status };
      if (status === "rejected" && !rejectionReason) {
        toast({ title: "Error", description: "Please provide a rejection reason", variant: "destructive" });
        return;
      }
      if (status === "rejected") {
        payload.rejectionReason = rejectionReason;
      }

      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setRejectionReason("");
        setSelectedBookingForReject(null);
        fetchBookings();
        toast({ title: "✅ Success", description: `Booking ${status}` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update booking", variant: "destructive" });
    }
  };

  const exportToExcel = async () => {
    try {
      const res = await fetch("/api/bookings/export/excel", { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bookings-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: "✅ Exported", description: "Excel file downloaded" });
      } else {
        toast({ title: "Error", description: "Failed to export", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to export", variant: "destructive" });
    }
  };

  const setCurrentUser = useStore((state) => state.setCurrentUser);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setCurrentUser(null);
      // Router will automatically show AuthPage when currentUser is null
    } catch (error) {
      toast({ title: "Error", description: "Logout failed", variant: "destructive" });
    }
  };

  const getBookingsForHall = (hallId: string) => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    return bookings.filter((b) => b.hallId === hallId && b.bookingDate === dateStr);
  };

  const getPeriodStatus = (hallId: string, period: number) => {
    return getBookingsForHall(hallId).find((b) => b.period === period);
  };

  const filteredBookings = bookings.filter((booking) => {
    const hall = halls.find((h) => h.id === booking.hallId);
    const matchesSearch = hall?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bookingReason?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalHalls: halls.length,
    totalBookings: bookings.length,
    totalUsers: users.filter(u => u.role === "faculty").length,
    pendingRequests: bookings.filter((b) => b.status === "pending").length,
    confirmedBookings: bookings.filter((b) => b.status === "booked" || b.status === "accepted").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Admin Dashboard</h1>
            <p className="text-sm text-blue-600">Manage halls and bookings</p>
          </div>
          <Button onClick={logout} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Halls</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalHalls}</p>
                </div>
                <Building2 className="h-10 w-10 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Confirmed</p>
                  <p className="text-3xl font-bold text-green-900">{stats.confirmedBookings}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-3xl font-bold text-yellow-900">{stats.pendingRequests}</p>
                </div>
                <Clock className="h-10 w-10 text-yellow-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Faculty Users</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.totalUsers}</p>
                </div>
                <Users className="h-10 w-10 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="halls" className="w-full">
          <TabsList className="bg-blue-100">
            <TabsTrigger value="halls" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Halls</TabsTrigger>
            <TabsTrigger value="faculty" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Faculty</TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Calendar</TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Requests {stats.pendingRequests > 0 && <Badge className="ml-2 bg-red-500">{stats.pendingRequests}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="all-bookings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">All Bookings</TabsTrigger>
          </TabsList>

          {/* Halls Tab */}
          <TabsContent value="halls" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-blue-900">Managed Halls</h2>
              <Button onClick={() => setShowNewHallDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                + Add New Hall
              </Button>
            </div>
            {halls.length === 0 ? (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  No halls created yet. Click "Add New Hall" to create one.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {halls.map((hall) => (
                  <Card key={hall.id} className="border-blue-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <CardTitle className="text-lg">{hall.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm"><strong>Capacity:</strong> {hall.capacity} seats</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm"><strong>Location:</strong> {hall.location || "N/A"}</span>
                      </div>
                      <p className="text-sm"><strong>Amenities:</strong> {hall.amenities || "None"}</p>
                      <p className="text-xs text-gray-500">Created: {new Date(hall.createdAt).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Faculty Tab */}
          <TabsContent value="faculty" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-blue-900">Faculty Management</h2>
              <Button onClick={() => setShowNewUserDialog(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
                <UserPlus className="h-4 w-4" />
                Add Faculty
              </Button>
            </div>
            {users.filter(u => u.role === "faculty").length === 0 ? (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  No faculty accounts created yet. Click "Add Faculty" to create one.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.filter(u => u.role === "faculty").map((user) => (
                  <Card key={user.id} className="border-blue-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {user.username}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteUser(user.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm"><strong>Role:</strong> {user.role}</span>
                      </div>
                      {user.email && (
                        <p className="text-sm"><strong>Email:</strong> {user.email}</p>
                      )}
                      <p className="text-xs text-gray-500">Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg text-blue-900">Select Date</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} className="rounded-md border-blue-200" />
                </CardContent>
              </Card>

              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-lg font-semibold text-blue-900">
                  Schedule for {selectedDate.toLocaleDateString()}
                </h3>
                {halls.length === 0 ? (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-blue-800">No halls available.</AlertDescription>
                  </Alert>
                ) : (
                  halls.map((hall) => (
                    <Card key={hall.id} className="border-blue-200">
                      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardTitle className="text-lg">{hall.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {PERIODS.map((period) => {
                            const booking = getPeriodStatus(hall.id, period.id);
                            return (
                              <div key={period.id} className="p-3 border rounded-lg bg-gray-50">
                                <p className="font-semibold text-sm text-gray-700">{period.time}</p>
                                {booking ? (
                                  <Badge className={`mt-2 ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="mt-2 border-green-300 text-green-700">
                                    Available
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {stats.pendingRequests === 0 ? (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">No pending booking requests.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {bookings.filter((b) => b.status === "pending").map((booking) => {
                  const hall = halls.find((h) => h.id === booking.hallId);
                  const periodInfo = PERIODS.find((p) => p.id === booking.period);

                  return (
                    <Card key={booking.id} className="border-blue-200 hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Hall</p>
                              <p className="font-semibold text-blue-900">{hall?.name || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Date</p>
                              <p className="font-semibold">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Period</p>
                              <p className="font-semibold">{periodInfo?.time || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                            </div>
                          </div>
                          {booking.bookingReason && (
                            <div>
                              <p className="text-sm text-gray-600">Reason</p>
                              <p className="text-sm font-medium">{booking.bookingReason}</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateBookingStatus(booking.id, "accepted")}>
                              Accept
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setSelectedBookingForReject(booking)}>
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* All Bookings Tab */}
          <TabsContent value="all-bookings" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search bookings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 gap-2">
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </div>

            {filteredBookings.length === 0 ? (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">No bookings found.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => {
                  const hall = halls.find((h) => h.id === booking.hallId);
                  const periodInfo = PERIODS.find((p) => p.id === booking.period);

                  return (
                    <Card key={booking.id} className="border-blue-200">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Hall</p>
                            <p className="font-semibold text-sm">{hall?.name || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Date</p>
                            <p className="text-sm">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Period</p>
                            <p className="text-sm">{periodInfo?.time || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Reason</p>
                            <p className="text-sm">{booking.bookingReason || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Status</p>
                            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Hall Dialog */}
      <Dialog open={showNewHallDialog} onOpenChange={setShowNewHallDialog}>
        <DialogContent className="border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Add New Hall</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="hallName">Hall Name *</Label>
              <Input id="hallName" placeholder="e.g., Auditorium A" value={newHall.name} onChange={(e) => setNewHall({ ...newHall, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity *</Label>
              <Input id="capacity" type="number" placeholder="e.g., 100" value={newHall.capacity} onChange={(e) => setNewHall({ ...newHall, capacity: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g., Building A, Floor 2" value={newHall.location} onChange={(e) => setNewHall({ ...newHall, location: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="amenities">Amenities</Label>
              <Input id="amenities" placeholder="e.g., Projector, Whiteboard, AC" value={newHall.amenities} onChange={(e) => setNewHall({ ...newHall, amenities: e.target.value })} />
            </div>
            <Button onClick={createHall} className="w-full bg-blue-600 hover:bg-blue-700">
              Create Hall
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={!!selectedBookingForReject} onOpenChange={() => setSelectedBookingForReject(null)}>
        <DialogContent className="border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-900">Reject Booking Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Rejection *</Label>
              <Input id="reason" placeholder="Enter rejection reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            </div>
            <Button variant="destructive" onClick={() => selectedBookingForReject && updateBookingStatus(selectedBookingForReject.id, "rejected")} className="w-full">
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Faculty Dialog */}
      <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
        <DialogContent className="border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Add Faculty Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="e.g., john.doe"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g., Dr. John Doe"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@university.edu"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g., Computer Science"
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value: "admin" | "faculty") => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createUser} className="w-full bg-blue-600 hover:bg-blue-700">
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
