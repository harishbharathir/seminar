import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, Users, Clock, Calendar as CalendarIcon, Filter, BookOpen, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import BookingCalendar from "@/components/booking-calendar";
import DashboardLayout from "./dashboard-layout";

const TIME_SLOTS = [
  { id: 1, time: "9:50-10:00" },
  { id: 2, time: "10:00-10:45" },
  { id: 3, time: "11:00-11:50" },
  { id: 4, time: "11:50-12:45" },
  { id: 5, time: "1:25-2:20" },
  { id: 6, time: "2:20-3:05" },
  { id: 7, time: "3:10-4:00" },
  { id: 8, time: "4:00-4:50" },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "accepted":
    case "booked":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "pending":
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <XCircle className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
    case "booked":
      return "bg-green-50 text-green-700 border-green-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

function FacultyDashboard() {
  const { currentUser } = useStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHall, setSelectedHall] = useState<string | null>(null);
  const [capacityFilter, setCapacityFilter] = useState<string>("");
  const [featureFilter, setFeatureFilter] = useState<string>("");
  const [apiBookings, setApiBookings] = useState<any[]>([]);
  const [apiHalls, setApiHalls] = useState<any[]>([]);

  // Fetch bookings and halls from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, hallsRes] = await Promise.all([
          fetch('/api/bookings', { credentials: 'include' }),
          fetch('/api/halls', { credentials: 'include' })
        ]);
        
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setApiBookings(bookingsData);
        }
        
        if (hallsRes.ok) {
          const hallsData = await hallsRes.json();
          setApiHalls(hallsData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Get user's bookings from API
  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return apiBookings.filter(b => b.userId === currentUser.id);
  }, [apiBookings, currentUser]);

  // Filter halls based on search and filters
  const filteredHalls = useMemo(() => {
    return apiHalls.filter(hall => {
      const matchesSearch = hall.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (hall.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCapacity = !capacityFilter || parseInt(hall.capacity) >= parseInt(capacityFilter);
      const matchesFeature = !featureFilter || (hall.amenities || '').toLowerCase().includes(featureFilter.toLowerCase());
      return matchesSearch && matchesCapacity && matchesFeature;
    });
  }, [apiHalls, searchQuery, capacityFilter, featureFilter]);

  // Get today's bookings for quick stats
  const todaysBookings = apiBookings.filter(b => 
    b.bookingDate === new Date().toISOString().split('T')[0]
  );
  const myTodaysBookings = todaysBookings.filter(b => b.userId === currentUser?.id);

  // Get upcoming bookings
  const upcomingBookings = myBookings
    .filter(b => new Date(b.bookingDate) >= startOfDay(new Date()))
    .sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime())
    .slice(0, 3);

  const clearFilters = () => {
    setSearchQuery("");
    setCapacityFilter("");
    setFeatureFilter("");
  };

  return (
    <DashboardLayout 
      title="Faculty Dashboard" 
      subtitle="Book halls and manage your reservations"
    >
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Today's Bookings</p>
                  <p className="text-2xl font-bold text-blue-900">{myTodaysBookings.length}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-green-900">{myBookings.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Available Halls</p>
                  <p className="text-2xl font-bold text-purple-900">{apiHalls.length}</p>
                </div>
                <MapPin className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Pending</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {myBookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="book" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-blue-50 border border-blue-200">
            <TabsTrigger value="book" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Book Halls
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              My Bookings
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Calendar View
            </TabsTrigger>
          </TabsList>

          {/* Book Halls Tab */}
          <TabsContent value="book" className="space-y-6">
            {/* Search and Filters */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Search className="h-5 w-5" />
                  Find the Perfect Hall
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search halls..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-blue-200 focus:border-blue-400"
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Min capacity"
                    value={capacityFilter}
                    onChange={(e) => setCapacityFilter(e.target.value)}
                    className="border-blue-200 focus:border-blue-400"
                  />
                  <Input
                    placeholder="Feature (e.g., Projector)"
                    value={featureFilter}
                    onChange={(e) => setFeatureFilter(e.target.value)}
                    className="border-blue-200 focus:border-blue-400"
                  />
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Halls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHalls.map((hall) => {
                const todayBookings = todaysBookings.filter(b => b.hallId === hall._id);
                const availableSlots = TIME_SLOTS.length - todayBookings.filter(b => b.status === 'accepted' || b.status === 'booked').length;
                
                return (
                  <Card 
                    key={hall._id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                      selectedHall === hall._id 
                        ? 'border-blue-500 bg-blue-50 shadow-lg' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedHall(selectedHall === hall._id ? null : hall._id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-blue-900">{hall.name}</CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{hall.capacity} seats</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{availableSlots} slots today</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={availableSlots > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                        >
                          {availableSlots > 0 ? 'Available' : 'Full'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-3">{hall.location || 'No location specified'}</p>
                      <div className="flex flex-wrap gap-1">
                        {(hall.amenities || '').split(',').filter(Boolean).slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-blue-200 text-blue-700">
                            {feature.trim()}
                          </Badge>
                        ))}
                        {(hall.amenities || '').split(',').filter(Boolean).length > 3 && (
                          <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                            +{(hall.amenities || '').split(',').filter(Boolean).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Booking Interface */}
            {selectedHall && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">
                    Book {apiHalls.find(h => h._id === selectedHall)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingCalendar hallId={selectedHall} date={selectedDate} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-900">Upcoming Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => {
                      const hall = apiHalls.find(h => h._id === booking.hallId);
                      const timeSlot = TIME_SLOTS.find(t => t.id === booking.period);
                      return (
                        <div key={booking._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(booking.status)}
                            <div>
                              <p className="font-medium text-gray-900">{hall?.name}</p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(booking.bookingDate), 'MMM dd, yyyy')} • {timeSlot?.time}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>All My Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {myBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No bookings yet. Start by booking a hall!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myBookings
                      .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
                      .map((booking) => {
                        const hall = apiHalls.find(h => h._id === booking.hallId);
                        const timeSlot = TIME_SLOTS.find(t => t.id === booking.period);
                        const isPast = new Date(booking.bookingDate) < startOfDay(new Date());
                        
                        return (
                          <Card key={booking._id} className={`${isPast ? 'opacity-60' : ''}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  {getStatusIcon(booking.status)}
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{hall?.name}</h4>
                                    <p className="text-sm text-gray-600">{booking.bookingReason}</p>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                      <span>{format(new Date(booking.bookingDate), 'MMM dd, yyyy')}</span>
                                      <span>{timeSlot?.time}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge className={getStatusColor(booking.status)}>
                                    {booking.status}
                                  </Badge>
                                  {!isPast && booking.status !== 'cancelled' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`/api/bookings/${booking._id}`, {
                                            method: 'DELETE',
                                            credentials: 'include'
                                          });
                                          if (response.ok) {
                                            toast({ title: "Booking cancelled successfully" });
                                            // Refresh bookings
                                            const bookingsRes = await fetch('/api/bookings', { credentials: 'include' });
                                            if (bookingsRes.ok) {
                                              const bookingsData = await bookingsRes.json();
                                              setApiBookings(bookingsData);
                                            }
                                          }
                                        } catch (error) {
                                          toast({ title: "Failed to cancel booking", variant: "destructive" });
                                        }
                                      }}
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar View Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date < startOfDay(new Date()) || date > addDays(new Date(), 30)}
                    className="rounded-md border border-blue-200"
                  />
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    Bookings for {format(selectedDate, 'MMMM dd, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {apiHalls.map((hall) => {
                      const hallBookings = apiBookings.filter(b => 
                        b.hallId === hall._id && 
                        b.bookingDate === selectedDate.toISOString().split('T')[0]
                      );
                      const confirmedBookings = hallBookings.filter(b => b.status === 'accepted' || b.status === 'booked');
                      
                      return (
                        <div key={hall._id} className="border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">{hall.name}</h4>
                          <div className="grid grid-cols-4 gap-2">
                            {TIME_SLOTS.map((slot) => {
                              const booking = confirmedBookings.find(b => b.period === slot.id);
                              const isMyBooking = booking?.userId === currentUser?.id;
                              
                              return (
                                <div 
                                  key={slot.id} 
                                  className={`p-2 rounded text-xs text-center ${
                                    booking 
                                      ? isMyBooking 
                                        ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                                        : 'bg-red-100 text-red-800 border border-red-300'
                                      : 'bg-green-100 text-green-800 border border-green-300'
                                  }`}
                                >
                                  <div className="font-medium">{slot.time.split('-')[0]}</div>
                                  <div className="mt-1">
                                    {booking 
                                      ? isMyBooking 
                                        ? 'Your booking' 
                                        : 'Booked'
                                      : 'Available'
                                    }
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default FacultyDashboard;