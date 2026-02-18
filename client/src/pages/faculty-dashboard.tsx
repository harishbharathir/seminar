import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import { Building2, Users, Clock, CheckCircle, XCircle, Calendar, LogOut, BookOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Hall {
  _id: string;
  name: string;
  capacity: string;
  location?: string;
  amenities?: string;
  createdAt: string;
}

interface Booking {
  _id: string;
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

export default function FacultyDashboard() {
  const { toast } = useToast();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [selectedDateForBook, setSelectedDateForBook] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [bookingReason, setBookingReason] = useState("");
  const [bookedSlots, setBookedSlots] = useState<Map<string, number[]>>(new Map());
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    fetchHalls();
    fetchMyBookings();

    newSocket.on("hall:created", (hall: Hall) => {
      setHalls((prev) => [...prev, hall]);
      fetchHalls();
    });

    newSocket.on("booking:created", (booking: Booking | null) => {
      if (!booking) return;
      fetchMyBookings();
      fetchBookedSlots();
    });

    newSocket.on("booking:updated", (booking: Booking | null) => {
      if (!booking) return;
      fetchMyBookings();
      fetchBookedSlots();
    });

    newSocket.on("booking:cancelled", (booking: Booking | null) => {
      if (!booking) return;
      fetchMyBookings();
      fetchBookedSlots();
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
        if (data.length > 0 && !selectedHall) {
          setSelectedHall(data[0]);
        }
      } else {
        toast({ title: "Error", description: "Failed to fetch halls", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch halls", variant: "destructive" });
    }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await fetch("/api/bookings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMyBookings(data);
        updateBookedSlots(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch bookings", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch bookings", variant: "destructive" });
    }
  };

  const fetchBookedSlots = async () => {
    try {
      const res = await fetch("/api/bookings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        updateBookedSlots(data);
      } else {
        console.error("Failed to fetch booked slots");
      }
    } catch (error) {
      console.error("Failed to fetch booked slots");
    }
  };

  const updateBookedSlots = (bookings: Booking[]) => {
    const slots = new Map<string, number[]>();
    bookings.forEach((booking) => {
      if (booking.status === "booked" || booking.status === "accepted") {
        const key = `${booking.hallId}-${booking.bookingDate}`;
        if (!slots.has(key)) {
          slots.set(key, []);
        }
        slots.get(key)!.push(booking.period);
      }
    });
    setBookedSlots(slots);
  };

  const bookHall = async () => {
    if (!selectedHall || !selectedDateForBook || !selectedPeriod || !bookingReason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields including booking reason",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          hallId: selectedHall._id,
          bookingDate: selectedDateForBook,
          period: selectedPeriod,
          bookingReason,
        }),
      });

      if (res.ok) {
        toast({ title: "✅ Success", description: "Booking request sent to admin" });
        setSelectedDateForBook("");
        setSelectedPeriod(null);
        setBookingReason("");
        fetchMyBookings();
        fetchBookedSlots();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to book hall",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to book hall", variant: "destructive" });
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast({ title: "✅ Success", description: "Booking cancelled" });
        fetchMyBookings();
        fetchBookedSlots();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel booking", variant: "destructive" });
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setCurrentUser(null);
    } catch (error) {
      toast({ title: "Error", description: "Logout failed", variant: "destructive" });
    }
  };

  const isSlotBooked = (hallId: string, date: string, period: number) => {
    const key = `${hallId}-${date}`;
    return bookedSlots.get(key)?.includes(period) || false;
  };

  const getTomorrowDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  };

  const stats = {
    totalBookings: myBookings.length,
    pendingBookings: myBookings.filter(b => b.status === "pending").length,
    confirmedBookings: myBookings.filter(b => b.status === "accepted" || b.status === "booked").length,
    rejectedBookings: myBookings.filter(b => b.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Faculty Dashboard</h1>
            <p className="text-sm text-blue-600">Book halls and manage your reservations</p>
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
                  <p className="text-sm text-blue-600 font-medium">Total Bookings</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalBookings}</p>
                </div>
                <BookOpen className="h-10 w-10 text-blue-500 opacity-80" />
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
                  <p className="text-3xl font-bold text-yellow-900">{stats.pendingBookings}</p>
                </div>
                <Clock className="h-10 w-10 text-yellow-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Rejected</p>
                  <p className="text-3xl font-bold text-red-900">{stats.rejectedBookings}</p>
                </div>
                <XCircle className="h-10 w-10 text-red-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Halls */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-blue-900">Available Halls</h2>
            {halls.length === 0 ? (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  No halls available at the moment.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {halls.map((hall) => (
                  <Card
                    key={hall._id}
                    className={`cursor-pointer transition-all border-blue-200 hover:shadow-lg ${
                      selectedHall?._id === hall._id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : "hover:border-blue-300"
                    }`}
                    onClick={() => setSelectedHall(hall)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-blue-900">{hall.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span>Capacity: {hall.capacity} seats</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span>Location: {hall.location || "N/A"}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <strong>Amenities:</strong> {hall.amenities || "None"}
                          </p>
                        </div>
                        {selectedHall?._id === hall._id && (
                          <Badge className="bg-blue-600 text-white">Selected</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div>
            <Card className="border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Book a Hall
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {selectedHall ? (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">Selected Hall:</p>
                      <p className="text-lg font-semibold text-blue-800">{selectedHall.name}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">
                        Reason for Booking *
                      </Label>
                      <Textarea
                        placeholder="e.g., Lecture on Advanced Mathematics, Department Meeting, Workshop on AI, etc."
                        value={bookingReason}
                        onChange={(e) => setBookingReason(e.target.value)}
                        className="mt-2 h-20 resize-none border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">
                        Date *
                      </Label>
                      <input
                        type="date"
                        value={selectedDateForBook}
                        onChange={(e) => setSelectedDateForBook(e.target.value)}
                        min={getTomorrowDate()}
                        className="mt-2 w-full border border-blue-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">
                        Time Period *
                      </Label>
                      <div className="mt-2 space-y-2">
                        {PERIODS.map((period) => {
                          const booked = selectedDateForBook
                            ? isSlotBooked(selectedHall._id, selectedDateForBook, period.id)
                            : false;
                          return (
                            <button
                              key={period.id}
                              onClick={() => !booked && setSelectedPeriod(period.id)}
                              disabled={booked}
                              className={`w-full py-3 px-4 text-sm rounded-lg border transition-all font-medium ${
                                booked
                                  ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                                  : selectedPeriod === period.id
                                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                  : "border-blue-200 hover:border-blue-500 hover:bg-blue-50 text-gray-700"
                              }`}
                            >
                              {period.time}
                              {booked && " (Booked)"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <Button
                      onClick={bookHall}
                      className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-base font-semibold"
                      disabled={!bookingReason.trim() || !selectedDateForBook || !selectedPeriod}
                    >
                      Request Booking
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">
                      Select a hall from the list to start booking
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* My Bookings */}
        <div>
          <h2 className="text-xl font-semibold text-blue-900 mb-4">My Bookings</h2>
          {myBookings.length === 0 ? (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                You haven't made any bookings yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {myBookings.map((booking) => {
                const hall = halls.find((h) => h._id === booking.hallId);
                const periodInfo = PERIODS.find((p) => p.id === booking.period);

                return (
                  <Card key={booking._id} className="border-blue-200 hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Hall</p>
                            <p className="font-semibold text-blue-900">{hall?.name || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Date</p>
                            <p className="font-semibold">
                              {new Date(booking.bookingDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Period</p>
                            <p className="font-semibold">{periodInfo?.time || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>

                        {booking.bookingReason && (
                          <div>
                            <p className="text-sm text-gray-600">Booking Reason</p>
                            <p className="text-sm font-medium bg-gray-50 p-3 rounded-lg">
                              {booking.bookingReason}
                            </p>
                          </div>
                        )}

                        {booking.status === "rejected" && booking.rejectionReason && (
                          <Alert className="bg-red-50 border-red-200">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                              <strong>Rejection Reason:</strong> {booking.rejectionReason}
                            </AlertDescription>
                          </Alert>
                        )}

                        {(booking.status === "pending" || booking.status === "accepted") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => cancelBooking(booking._id)}
                            className="gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel Booking
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}