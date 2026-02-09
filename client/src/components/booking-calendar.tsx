import { useStore, Booking } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, User, Clock, AlertTriangle } from "lucide-react";

interface BookingCalendarProps {
  hallId: string;
  date: Date;
}

// 9:00 to 5:00 in 50min slots
// We'll simplify to hourly starts for UI clarity, but label them as 50 mins
const SLOTS = [9, 10, 11, 12, 13, 14, 15, 16];

export default function BookingCalendar({ hallId, date }: BookingCalendarProps) {
  const { bookings, addBooking, currentUser, getWaitlistPosition, cancelBooking } = useStore();
  const { toast } = useToast();
  
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter bookings for this hall and date
  const todaysBookings = bookings.filter(b => 
    b.hallId === hallId && 
    new Date(b.date).toDateString() === date.toDateString()
  );

  const getSlotStatus = (slot: number) => {
    const confirmed = todaysBookings.find(b => b.slot === slot && b.status === 'confirmed');
    if (confirmed) {
      if (confirmed.userId === currentUser?.id) return 'my-booking';
      return 'booked';
    }
    return 'available';
  };

  const getWaitlistForSlot = (slot: number) => {
    return todaysBookings.filter(b => b.slot === slot && b.status === 'waitlist');
  };

  const handleSlotClick = (slot: number) => {
    setSelectedSlot(slot);
    setPurpose("");
    setIsConfirmOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (selectedSlot === null || !currentUser) return;
    
    setIsSubmitting(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const result = addBooking({
      hallId,
      userId: currentUser.id,
      date: date.toISOString(),
      slot: selectedSlot,
      purpose: purpose || "Seminar"
    });

    setIsSubmitting(false);
    setIsConfirmOpen(false);

    if (result.success) {
      toast({
        title: result.isWaitlist ? "Added to Waitlist" : "Booking Confirmed",
        description: result.message,
        variant: result.isWaitlist ? "default" : "default", // distinct style for waitlist?
        className: result.isWaitlist ? "border-amber-500 bg-amber-50" : "border-green-500 bg-green-50"
      });
    } else {
      toast({
        title: "Booking Failed",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const handleCancel = (bookingId: string) => {
    if (confirm("Cancel this booking?")) {
      cancelBooking(bookingId);
      toast({ title: "Booking Cancelled" });
    }
  };

  const formatTime = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour > 12 ? hour - 12 : hour;
    return `${h}:00 ${ampm} - ${h}:50 ${ampm}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SLOTS.map((slot) => {
          const status = getSlotStatus(slot);
          const waitlist = getWaitlistForSlot(slot);
          const myWaitlist = waitlist.find(b => b.userId === currentUser?.id);
          const confirmedBooking = todaysBookings.find(b => b.slot === slot && b.status === 'confirmed');

          let cardClass = "border bg-card hover:border-primary/50 cursor-pointer";
          let badgeClass = "bg-green-100 text-green-700";
          let statusText = "Available";

          if (status === 'booked') {
            cardClass = "border-red-100 bg-red-50/50 cursor-pointer hover:border-red-300";
            badgeClass = "bg-red-100 text-red-700";
            statusText = "Booked";
          } else if (status === 'my-booking') {
            cardClass = "border-primary bg-primary/5 ring-1 ring-primary cursor-default";
            badgeClass = "bg-primary text-primary-foreground";
            statusText = "Your Booking";
          }

          if (myWaitlist) {
            cardClass = "border-amber-300 bg-amber-50 ring-1 ring-amber-300 cursor-default";
            statusText = `Waitlist #${getWaitlistPosition(myWaitlist.id)}`;
            badgeClass = "bg-amber-100 text-amber-800";
          }

          return (
            <div 
              key={slot}
              onClick={() => {
                if (status === 'my-booking') return; // Can't book again, maybe click to cancel?
                if (myWaitlist) return; // Already on waitlist
                handleSlotClick(slot);
              }}
              className={cn(
                "relative rounded-xl p-4 transition-all duration-200 group flex flex-col justify-between min-h-[140px]",
                cardClass
              )}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm font-medium">{formatTime(slot)}</span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide", badgeClass)}>
                    {statusText}
                  </span>
                </div>
                
                {status === 'booked' && confirmedBooking && (
                  <div className="text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1 mb-1">
                      <User className="h-3 w-3" /> 
                      <span className="truncate max-w-[120px]">
                        {useStore.getState().users.find(u => u.id === confirmedBooking.userId)?.name || 'Unknown'}
                      </span>
                    </div>
                    {/* Only show waitlist count if significant */}
                    {waitlist.length > 0 && (
                      <div className="flex items-center gap-1 text-amber-600 font-medium">
                        <Clock className="h-3 w-3" />
                        {waitlist.length} on waitlist
                      </div>
                    )}
                  </div>
                )}

                {status === 'my-booking' && confirmedBooking && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs font-medium opacity-80">Purpose: {confirmedBooking.purpose}</p>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-7 text-xs w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(confirmedBooking.id);
                      }}
                    >
                      Cancel Booking
                    </Button>
                  </div>
                )}
                
                {myWaitlist && (
                   <div className="mt-2 space-y-2">
                    <p className="text-xs text-amber-700">You are in line if the current booking is cancelled.</p>
                     <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs w-full border-amber-200 hover:bg-amber-100 hover:text-amber-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(myWaitlist.id);
                      }}
                    >
                      Leave Waitlist
                    </Button>
                   </div>
                )}
              </div>

              {/* Hover effect for available/booked slots to show action */}
              {!myWaitlist && status !== 'my-booking' && (
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl pointer-events-none">
                  <span className="bg-background shadow-sm px-3 py-1 rounded-full text-xs font-medium text-primary border">
                    {status === 'booked' ? 'Join Waitlist' : 'Book Now'}
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
            <DialogTitle>
              {selectedSlot !== null && getSlotStatus(selectedSlot) === 'booked' ? "Join Waitlist" : "Confirm Booking"}
            </DialogTitle>
            <DialogDescription>
              {selectedSlot !== null && formatTime(selectedSlot)} on {format(date, "MMMM do, yyyy")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {selectedSlot !== null && getSlotStatus(selectedSlot) === 'booked' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md flex gap-3 text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>This slot is currently occupied. Joining the waitlist means you'll be automatically booked if the current reservation is cancelled.</p>
              </div>
            )}
            
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
              {selectedSlot !== null && getSlotStatus(selectedSlot) === 'booked' ? "Join Waitlist" : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
