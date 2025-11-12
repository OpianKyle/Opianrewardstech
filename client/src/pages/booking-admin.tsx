import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

type TimeSlot = {
  id: string;
  startTime: Date;
  endTime: Date;
  meetingType: "google_meet" | "teams";
  meetingUrl: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  isAvailable: number;
  createdAt: Date;
  updatedAt: Date;
};

type Booking = {
  id: string;
  timeSlotId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  clientCompany: string | null;
  notes: string | null;
  status: "confirmed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
};

export default function BookingAdmin() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [meetingType, setMeetingType] = useState<"google_meet" | "teams">("google_meet");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorEmail, setCreatorEmail] = useState("");

  const { data: timeSlots, isLoading: loadingSlots } = useQuery<TimeSlot[]>({
    queryKey: ["/api/time-slots"],
  });

  const { data: bookings, isLoading: loadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const createSlotMutation = useMutation({
    mutationFn: async (data: {
      startTime: Date;
      endTime: Date;
      meetingType: "google_meet" | "teams";
      meetingUrl?: string;
      creatorName?: string;
      creatorEmail?: string;
    }) => {
      return await apiRequest("POST", "/api/time-slots", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-slots"] });
      toast({ title: "Success", description: "Time slot created successfully" });
      setStartDate("");
      setStartTime("");
      setEndTime("");
      setMeetingUrl("");
      setCreatorName("");
      setCreatorEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/time-slots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-slots"] });
      toast({ title: "Success", description: "Time slot deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateSlot = () => {
    if (!startDate || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);

    createSlotMutation.mutate({
      startTime: startDateTime,
      endTime: endDateTime,
      meetingType,
      meetingUrl: meetingUrl || undefined,
      creatorName: creatorName || undefined,
      creatorEmail: creatorEmail || undefined,
    });
  };

  const getBookingsForSlot = (slotId: string) => {
    return bookings?.filter((b) => b.timeSlotId === slotId) || [];
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">
            Manage your presentation time slots and view bookings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Time Slot
            </CardTitle>
            <CardDescription>
              Add a new available time slot for client presentations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" data-testid="label-date">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-time" data-testid="label-start-time">
                  Start Time
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  data-testid="input-start-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time" data-testid="label-end-time">
                  End Time
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  data-testid="input-end-time"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-type" data-testid="label-meeting-type">
                  Meeting Type
                </Label>
                <Select value={meetingType} onValueChange={(v) => setMeetingType(v as "google_meet" | "teams")}>
                  <SelectTrigger id="meeting-type" data-testid="select-meeting-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_meet">Google Meet</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-url" data-testid="label-meeting-url">
                  Meeting URL (Optional)
                </Label>
                <Input
                  id="meeting-url"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  data-testid="input-meeting-url"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creator-name" data-testid="label-creator-name">
                  Your Name (Optional)
                </Label>
                <Input
                  id="creator-name"
                  type="text"
                  placeholder="John Doe"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  data-testid="input-creator-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creator-email" data-testid="label-creator-email">
                  Your Email (Optional)
                </Label>
                <Input
                  id="creator-email"
                  type="email"
                  placeholder="john@example.com"
                  value={creatorEmail}
                  onChange={(e) => setCreatorEmail(e.target.value)}
                  data-testid="input-creator-email"
                />
                <p className="text-xs text-muted-foreground">
                  You'll receive an email when someone books this time slot
                </p>
              </div>
            </div>
            <Button
              onClick={handleCreateSlot}
              disabled={createSlotMutation.isPending}
              data-testid="button-create-slot"
            >
              {createSlotMutation.isPending ? "Creating..." : "Create Time Slot"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Time Slots & Bookings
            </CardTitle>
            <CardDescription>
              View and manage all time slots and their bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSlots || loadingBookings ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-4">
                {timeSlots?.length === 0 ? (
                  <p className="text-muted-foreground">No time slots created yet</p>
                ) : (
                  timeSlots?.map((slot) => {
                    const slotBookings = getBookingsForSlot(slot.id);
                    const isBooked = slotBookings.some((b) => b.status === "confirmed");

                    return (
                      <Card key={slot.id} data-testid={`card-slot-${slot.id}`}>
                        <CardHeader className="space-y-0 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {format(new Date(slot.startTime), "PPP")}
                              </CardTitle>
                              <CardDescription>
                                {format(new Date(slot.startTime), "p")} -{" "}
                                {format(new Date(slot.endTime), "p")}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm px-2 py-1 rounded-md ${
                                  isBooked
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-green-500/10 text-green-500"
                                }`}
                                data-testid={`status-slot-${slot.id}`}
                              >
                                {isBooked ? "Booked" : "Available"}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteSlotMutation.mutate(slot.id)}
                                disabled={deleteSlotMutation.isPending}
                                data-testid={`button-delete-${slot.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <span className="capitalize">{slot.meetingType.replace("_", " ")}</span>
                            {slot.meetingUrl && (
                              <>
                                <span>•</span>
                                <a
                                  href={slot.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                  data-testid={`link-meeting-${slot.id}`}
                                >
                                  Meeting Link
                                </a>
                              </>
                            )}
                          </div>
                        </CardHeader>
                        {slotBookings.length > 0 && (
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Bookings:</p>
                              {slotBookings.map((booking) => (
                                <div
                                  key={booking.id}
                                  className="p-3 rounded-md bg-muted text-sm"
                                  data-testid={`booking-${booking.id}`}
                                >
                                  <div className="font-medium">{booking.clientName}</div>
                                  <div className="text-muted-foreground">{booking.clientEmail}</div>
                                  {booking.clientPhone && (
                                    <div className="text-muted-foreground">{booking.clientPhone}</div>
                                  )}
                                  {booking.clientCompany && (
                                    <div className="text-muted-foreground">{booking.clientCompany}</div>
                                  )}
                                  {booking.notes && (
                                    <div className="mt-1 text-muted-foreground italic">{booking.notes}</div>
                                  )}
                                  <div className="mt-1">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-md ${
                                        booking.status === "confirmed"
                                          ? "bg-green-500/10 text-green-500"
                                          : "bg-destructive/10 text-destructive"
                                      }`}
                                    >
                                      {booking.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
