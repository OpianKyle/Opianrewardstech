import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreditCard, Plus, Trash2, AlertCircle } from "lucide-react";
import PaymentFormNew from "./payment-form-new";

interface PaymentMethod {
  id: string;
  cardType: string | null;
  lastFourDigits: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isActive: number;
  createdAt: string;
}

export function PaymentMethods() {
  const { toast } = useToast();
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  // Fetch payment methods
  const { data: paymentMethods, isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  // Delete payment method mutation
  const deleteMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest("DELETE", `/api/payment-methods/${paymentMethodId}`, {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete payment method");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Method Removed",
        description: "Your card has been successfully removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      setCardToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteConfirm = () => {
    if (cardToDelete) {
      deleteMutation.mutate(cardToDelete);
    }
  };

  const getCardIcon = (cardType: string | null) => {
    switch (cardType?.toLowerCase()) {
      case "visa":
        return "💳";
      case "mastercard":
        return "💳";
      case "american express":
        return "💳";
      default:
        return "💳";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur">
        <CardContent className="py-8">
          <p className="text-center text-gray-400">Loading payment methods...</p>
        </CardContent>
      </Card>
    );
  }

  const activeCards = paymentMethods?.filter(pm => pm.isActive === 1) || [];

  return (
    <>
      <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white text-xl">Saved Payment Methods</CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                Manage your saved cards for faster checkout
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddCard(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-gray-900"
              data-testid="button-add-card"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 mb-4">No saved payment methods</p>
              <Button
                onClick={() => setShowAddCard(true)}
                variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                data-testid="button-add-first-card"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Card
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCards.map((method) => (
                <Card
                  key={method.id}
                  className="bg-gray-700/30 border-gray-600 hover:border-cyan-500/50 transition-colors"
                  data-testid={`card-payment-method-${method.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{getCardIcon(method.cardType)}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">
                              {method.cardType || "Card"} •••• {method.lastFourDigits || "****"}
                            </p>
                            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                              Active
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            Expires: {String(method.expiryMonth).padStart(2, "0")}/
                            {method.expiryYear}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCardToDelete(method.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        data-testid={`button-delete-${method.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="max-w-2xl bg-gray-800 border-cyan-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Payment Method</DialogTitle>
            <DialogDescription className="text-gray-300">
              Add a new card for faster payments. Your card details are encrypted and securely stored.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Alert className="mb-4 bg-blue-500/10 border-blue-500/30">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                Note: Adding a card requires a small authorization amount (R1.00) which will be refunded immediately.
              </AlertDescription>
            </Alert>
            {/* Placeholder for add card form - you can integrate PaymentFormNew or create a simpler form */}
            <p className="text-gray-400 text-center py-8">
              Card tokenization form will be added here
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!cardToDelete} onOpenChange={() => setCardToDelete(null)}>
        <DialogContent className="bg-gray-800 border-cyan-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Remove Payment Method</DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to remove this card? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setCardToDelete(null)}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Removing..." : "Remove Card"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
