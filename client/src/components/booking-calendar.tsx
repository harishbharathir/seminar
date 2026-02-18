import { useStore, Booking } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, User, Clock, AlertTriangle } from "lucide-react";
import type { Booking as APIBooking } from "@shared/schema";

interface BookingCalendarProps {
  hallId: string;
  date: Date;
}

// Period mapping: 1-8 periods to time slots
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const PERIOD_TIMES = {
  1: "9:50-10:40",
  2: "10:40-11:30", 
  3: "11:30-12:20",
  4: "12:20-1:10",
  5: "1:25-2:15",
  6: "2:15-3:05",
  7: "3:10-4:00",
  8: "4:00-4:50"
};

export default function BookingCalendar({ hallId, date }: BookingCalendarProps) {
  const { currentUser } = useStore();
  const { toast } = useToast();
  
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookings, setBookings] = useState<APIBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings for this hall and date
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/bookings?hallId=${hallId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [hallId]);

  // Filter bookings for this hall and date
  const todaysBookings = bookings.filter(b => 
    b.hallId === hallId && 
    b.bookingDate === date.toISOString().split('T')[0]
  );

  const getPeriodStatus = (period: number) => {
    const booked = todaysBookings.find(b => b.period === period && (b.status === 'accepted' || b.status === 'booked'));
    if (booked) {
      if (booked.userId === currentUser?.id) return 'my-booking';
      return 'booked';
    }
    const pending = todaysBookings.find(b => b.period === period && b.status === 'pending' && b.userId === currentUser?.id);
    if (pending) return 'pending';
    return 'available';
  };

  const getPendingForPeriod = (period: number) => {
    return todaysBookings.filter(b => b.period === period && b.status === 'pending');
  };

  const handlePeriodClick = (period: number) => {
    setSelectedPeriod(period);
    setPurpose("");
    setIsConfirmOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (selectedPeriod === null || !currentUser) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          hallId,
          bookingDate: date.toISOString().split('T')[0],
          period: selectedPeriod,
          bookingReason: purpose || "Seminar"
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh bookings
        const bookingsResponse = await fetch(`/api/bookings?hallId=${hallId}`, {
          credentials: 'include'
        });
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookings(bookingsData);
        }
        
        toast({
          title: "Booking Request Sent",
          description: "Your booking request has been sent to admin for approval",
          className: "border-green-500 bg-green-50"
        });
      } else {
        toast({
          title: "Booking Failed",
          description: data.message || "Failed to create booking",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsSubmitting(false);
    setIsConfirmOpen(false);
  };

  const handleCancel = async (bookingId: string) => {
    if (confirm("Cancel this booking?")) {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          // Refresh bookings
          const bookingsResponse = await fetch(`/api/bookings?hallId=${hallId}`, {
            credentials: 'include'
          });
          if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json();
            setBookings(bookingsData);
          }
          
          toast({ title: "Booking Cancelled" });
        } else {
          const data = await response.json();
          toast({ 
            title: "Cancellation Failed", 
            description: data.message,
            variant: "destructive" 
          });
        }
      } catch (error) {
        toast({ 
          title: "Cancellation Failed", 
          description: "Network error. Please try again.",
          variant: "destructive" 
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PERIODS.map((period) => {
          const status = getPeriodStatus(period);
          const pending = getPendingForPeriod(period);
          const bookedBooking = todaysBookings.find(b => b.period === period && (b.status === 'accepted' || b.status === 'booked'));
          const myBooking = todaysBookings.find(b => b.period === period && b.userId === currentUser?.id);

          let cardClass = "border bg-card hover:border-primary/50 cursor-pointer";
          let badgeClass = "bg-green-100 text-green-700";
          let statusText = "Available";

          if (status === 'booked') {
            cardClass = "border-red-100 bg-red-50/50 cursor-not-allowed";
            badgeClass = "bg-red-100 text-red-700";
            statusText = "Booked";
          } else if (status === 'my-booking') {
            cardClass = "border-primary bg-primary/5 ring-1 ring-primary cursor-default";
            badgeClass = "bg-primary text-primary-foreground";
            statusText = myBooking?.status === 'pending' ? "Pending" : "Your Booking";
          } else if (status === 'pending') {
            cardClass = "border-amber-300 bg-amber-50 ring-1 ring-amber-300 cursor-default";
            statusText = "Pending Approval";
            badgeClass = "bg-amber-100 text-amber-800";
          }

          return (
            <div 
              key={period}
              onClick={() => {
                if (status === 'my-booking' || status === 'booked' || status === 'pending') return;
                handlePeriodClick(period);
              }}
              className={cn(
                "relative rounded-xl p-4 transition-all duration-200 group flex flex-col justify-between min-h-[140px]",
                cardClass
              )}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm font-medium">{PERIOD_TIMES[period as keyof typeof PERIOD_TIMES]}</span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide", badgeClass)}>
                    {statusText}
                  </span>
                </div>
                
                {status === 'booked' && bookedBooking && (
                  <div className="text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1 mb-1">
                      <User className="h-3 w-3" /> 
                      <span className="truncate max-w-[120px]">Booked</span>
                    </div>
                    {pending.length > 0 && (
                      <div className="flex items-center gap-1 text-amber-600 font-medium">
                        <Clock className="h-3 w-3" />
                        {pending.length} pending
                      </div>
                    )}
                  </div>
                )}

                {status === 'my-booking' && myBooking && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs font-medium opacity-80">Purpose: {myBooking.bookingReason}</p>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-7 text-xs w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(myBooking._id);
                      }}
                    >
                      Cancel Booking
                    </Button>
                  </div>
                )}
                
                {status === 'pending' && myBooking && (
                   <div className="mt-2 space-y-2">
                    <p className="text-xs text-amber-700">Waiting for admin approval.</p>
                     <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs w-full border-amber-200 hover:bg-amber-100 hover:text-amber-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(myBooking._id);
                      }}
                    >
                      Cancel Request
                    </Button>
                   </div>
                )}
              </div>

              {/* Hover effect for available slots */}
              {status === 'available' && (
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl pointer-events-none">
                  <span className="bg-background shadow-sm px-3 py-1 rounded-full text-xs font-medium text-primary border">
                    Book Now
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              {selectedPeriod !== null && PERIOD_TIMES[selectedPeriod as keyof typeof PERIOD_TIMES]} on {format(date, "MMMM do, yyyy")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            
            <div className="grid gap-2">
              <Label htmlFor="purpose">Purpose of Booking</Label>
              <Input 
                id="purpose" 
                value={purpose} 
                onChange={(e) => setPurpose(e.target.value)} 
                placeholder="e.g. Data Structures Lecture, Guest Seminar..." 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmBooking} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
