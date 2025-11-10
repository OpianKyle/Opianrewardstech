import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

type TimeSlot = {
  id: string;
  startTime: Date;
  endTime: Date;
  meetingType: "google_meet" | "teams";
  meetingUrl: string | null;
  isAvailable: number;
  createdAt: Date;
  updatedAt: Date;
};

export default function Booking() {
  const { toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
    notes: "",
  });

  const { data: timeSlots, isLoading } = useQuery<TimeSlot[]>({
    queryKey: ["/api/time-slots/available"],
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: {
      timeSlotId: string;
      clientName: string;
      clientEmail: string;
      clientPhone?: string;
      clientCompany?: string;
      notes?: string;
    }) => {
      return await apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-slots/available"] });
      setShowSuccess(true);
      setShowForm(false);
      setFormData({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        clientCompany: "",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setShowForm(true);
    setShowSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    bookingMutation.mutate({
      timeSlotId: selectedSlot.id,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone || undefined,
      clientCompany: formData.clientCompany || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleBack = () => {
    setShowForm(false);
    setSelectedSlot(null);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <CardDescription>
              Your presentation has been successfully scheduled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-md bg-muted">
              <p className="font-medium mb-2">Meeting Details:</p>
              <p className="text-sm text-muted-foreground">
                {selectedSlot && (
                  <>
                    <span className="block">{format(new Date(selectedSlot.startTime), "PPP")}</span>
                    <span className="block">
                      {format(new Date(selectedSlot.startTime), "p")} -{" "}
                      {format(new Date(selectedSlot.endTime), "p")}
                    </span>
                    <span className="block capitalize mt-2">
                      Platform: {selectedSlot.meetingType.replace("_", " ")}
                    </span>
                  </>
                )}
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              A confirmation email has been sent to {formData.clientEmail}
            </p>
            <Button
              onClick={() => {
                setShowSuccess(false);
                setSelectedSlot(null);
                queryClient.invalidateQueries({ queryKey: ["/api/time-slots/available"] });
              }}
              className="w-full"
              data-testid="button-book-another"
            >
              Book Another Presentation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForm && selectedSlot) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
            data-testid="button-back"
          >
            ← Back to Time Slots
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Booking</CardTitle>
              <CardDescription>
                Fill in your details to confirm your presentation booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 rounded-md bg-muted">
                <p className="font-medium mb-2">Selected Time:</p>
                <p className="text-sm">
                  {format(new Date(selectedSlot.startTime), "PPP")} at{" "}
                  {format(new Date(selectedSlot.startTime), "p")} -{" "}
                  {format(new Date(selectedSlot.endTime), "p")}
                </p>
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {selectedSlot.meetingType.replace("_", " ")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" data-testid="label-name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" data-testid="label-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" data-testid="label-phone">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    data-testid="input-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" data-testid="label-company">
                    Company Name
                  </Label>
                  <Input
                    id="company"
                    value={formData.clientCompany}
                    onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                    data-testid="input-company"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" data-testid="label-notes">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any specific topics or questions you'd like to discuss?"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    data-testid="input-notes"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={bookingMutation.isPending}
                  data-testid="button-submit"
                >
                  {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Book a Presentation</h1>
          <p className="text-muted-foreground">
            Select an available time slot for your presentation
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading available times...</p>
          </div>
        ) : timeSlots?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No available time slots at the moment. Please check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timeSlots?.map((slot) => (
              <Card
                key={slot.id}
                className="hover-elevate cursor-pointer"
                onClick={() => handleSlotSelect(slot)}
                data-testid={`card-timeslot-${slot.id}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5" />
                    {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {format(new Date(slot.startTime), "h:mm a")} -{" "}
                    {format(new Date(slot.endTime), "h:mm a")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {slot.meetingType.replace("_", " ")}
                    </span>
                    <Button variant="outline" size="sm" data-testid={`button-select-${slot.id}`}>
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
