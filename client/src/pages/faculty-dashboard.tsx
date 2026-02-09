import { useState } from "react";
import { useStore, Hall } from "@/lib/store";
import DashboardLayout from "./dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, CheckCircle2, AlertCircle } from "lucide-react";
import BookingCalendar from "@/components/booking-calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

export default function FacultyDashboard() {
  const { halls } = useStore();
  const [selectedHallId, setSelectedHallId] = useState<string>(halls[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const selectedHall = halls.find(h => h.id === selectedHallId);

  // Date selection logic (Today + 2 days)
  const today = new Date();
  const dates = [today, addDays(today, 1), addDays(today, 2)];

  return (
    <DashboardLayout 
      title="Book a Seminar Hall" 
      subtitle="Select a hall and time slot for your lecture or event."
    >
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar - Hall Selection */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Available Halls</h3>
            <div className="grid gap-3">
              {halls.map((hall) => (
                <div 
                  key={hall.id}
                  onClick={() => setSelectedHallId(hall.id)}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-[1.02]",
                    "border rounded-lg overflow-hidden text-left",
                    selectedHallId === hall.id 
                      ? "ring-2 ring-primary border-primary bg-primary/5 shadow-md" 
                      : "bg-card hover:bg-accent/50"
                  )}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{hall.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {hall.capacity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{hall.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {hall.features.slice(0, 3).map((f, i) => (
                        <span key={i} className="text-[10px] bg-background border px-1.5 py-0.5 rounded text-muted-foreground">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Main Area - Booking */}
        <div className="lg:col-span-8 space-y-6">
          {selectedHall && (
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedHall.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Ready for booking
                    </CardDescription>
                  </div>
                  
                  {/* Date Picker Buttons */}
                  <div className="flex bg-muted p-1 rounded-lg">
                    {dates.map((date, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                          date.toDateString() === selectedDate.toDateString()
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {idx === 0 ? "Today" : format(date, "EEE, MMM d")}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <BookingCalendar 
                  hallId={selectedHall.id} 
                  date={selectedDate} 
                />
              </CardContent>

              <CardFooter className="bg-muted/30 border-t py-4 text-xs text-muted-foreground flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
                  <span>Booked (Waitlist Available)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></div>
                  <span>Your Booking</span>
                </div>
              </CardFooter>
            </Card>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-900 text-sm">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-semibold mb-1">Booking Policy Reminder</p>
              <ul className="list-disc list-inside space-y-1 opacity-90">
                <li>Faculty can book a maximum of 2 hours per day.</li>
                <li>Bookings are only open for today and the next 2 days.</li>
                <li>If a slot is taken, you will be added to the waitlist automatically.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
