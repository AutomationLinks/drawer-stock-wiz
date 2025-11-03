import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const donationSchema = z.object({
  amount: z.string().min(1, "Please select or enter an amount"),
  customAmount: z.string().optional(),
  coverFee: z.boolean().default(false),
  frequency: z.enum(["one-time", "monthly"]),
  campaign: z.string().min(1, "Please select a campaign"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  organization: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationSchema>;

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Payment Form Component
const PaymentForm = ({ 
  clientSecret, 
  onSuccess 
}: { 
  clientSecret: string; 
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/donate?success=true`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      toast({
        title: "Thank You!",
        description: "Your donation has been processed successfully.",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Complete Donation'
        )}
      </Button>
    </form>
  );
};

export const DonationForm = () => {
  const [step, setStep] = useState(1);
  const [selectedAmount, setSelectedAmount] = useState<string>("50");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: "50",
      frequency: "one-time",
      coverFee: false,
      campaign: "General",
    },
  });

  const amount = watch("amount");
  const customAmount = watch("customAmount");
  const coverFee = watch("coverFee");
  const frequency = watch("frequency");

  const calculateProcessingFee = () => {
    const baseAmount = amount === "other" ? parseFloat(customAmount || "0") : parseFloat(amount);
    return (baseAmount * 0.029 + 0.30).toFixed(2);
  };

  const getTotalAmount = () => {
    const baseAmount = amount === "other" ? parseFloat(customAmount || "0") : parseFloat(amount);
    const fee = coverFee ? parseFloat(calculateProcessingFee()) : 0;
    return (baseAmount + fee).toFixed(2);
  };

  const onSubmit = async (data: DonationFormData) => {
    setIsCreatingPayment(true);
    
    try {
      const actualAmount = amount === "other" ? parseFloat(customAmount || "0") : parseFloat(amount);
      const totalAmount = parseFloat(getTotalAmount());
      const processingFee = coverFee ? parseFloat(calculateProcessingFee()) : 0;

      // Call edge function to create payment intent
      const { data: paymentData, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          organization: data.organization,
          amount: actualAmount,
          processingFee: processingFee,
          totalAmount: totalAmount,
          frequency: data.frequency,
          campaign: data.campaign,
        },
      });

      if (error) throw error;

      setClientSecret(paymentData.clientSecret);
      setStep(3); // Move to payment step
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    reset();
    setStep(1);
    setSelectedAmount("50");
    setClientSecret("");
  };

  const handleNext = () => {
    if (amount === "other" && !customAmount) {
      return;
    }
    setStep(2);
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader className="text-center border-b">
        <div className="flex items-center justify-center mb-2">
          <Heart className="w-8 h-8 text-primary fill-primary" />
        </div>
        <CardTitle className="text-2xl">Make a Donation</CardTitle>
        <CardDescription>
          Your support makes a difference
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <div className="space-y-6">
              {/* Amount Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Choose Your Amount</Label>
                <RadioGroup
                  value={selectedAmount}
                  onValueChange={(value) => {
                    setSelectedAmount(value);
                    setValue("amount", value);
                  }}
                  className="grid grid-cols-2 gap-3"
                >
                  {["50", "100", "200", "other"].map((value) => (
                    <div key={value} className="relative">
                      <RadioGroupItem
                        value={value}
                        id={`amount-${value}`}
                        className="peer sr-only"
                      />
                       <Label
                        htmlFor={`amount-${value}`}
                        className="flex items-center justify-center rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                      >
                        <span className="text-lg font-semibold">
                          {value === "other" ? "Other" : `$${formatCurrency(value)}`}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              {/* Custom Amount Input */}
              {selectedAmount === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="customAmount">Enter Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="customAmount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      {...register("customAmount")}
                    />
                  </div>
                </div>
              )}

              {/* Campaign Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Campaign</Label>
                <Select
                  value={watch("campaign")}
                  onValueChange={(value) => setValue("campaign", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Drawers of Hope">Drawers of Hope</SelectItem>
                    <SelectItem value="Dignity in Bulk">Dignity in Bulk</SelectItem>
                    <SelectItem value="Give to the Max">Give to the Max</SelectItem>
                  </SelectContent>
                </Select>
                {errors.campaign && (
                  <p className="text-sm text-destructive">{errors.campaign.message}</p>
                )}
              </div>

              {/* Frequency Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Donation Frequency</Label>
                <RadioGroup
                  value={frequency}
                  onValueChange={(value: "one-time" | "monthly") =>
                    setValue("frequency", value)
                  }
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="relative">
                    <RadioGroupItem
                      value="one-time"
                      id="freq-once"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="freq-once"
                      className="flex items-center justify-center rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                    >
                      One-Time
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem
                      value="monthly"
                      id="freq-monthly"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="freq-monthly"
                      className="flex items-center justify-center rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                    >
                      Monthly
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Processing Fee */}
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50">
                <Checkbox
                  id="coverFee"
                  checked={coverFee}
                  onCheckedChange={(checked) => setValue("coverFee", checked as boolean)}
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="coverFee"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Yes, I'll cover the ${formatCurrency(calculateProcessingFee())} processing fee.
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    This ensures 100% of your donation goes to the cause
                  </p>
                </div>
              </div>

              {/* Total Amount Display */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${formatCurrency(getTotalAmount())}
                  </span>
                </div>
                {frequency === "monthly" && (
                  <p className="text-xs text-muted-foreground mt-1">per month</p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleNext}
                className="w-full"
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization (Optional)</Label>
                  <Input
                    id="organization"
                    placeholder="Acme Inc."
                    {...register("organization")}
                  />
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Donation:</span>
                  <span className="font-medium">
                    ${formatCurrency(amount === "other" ? customAmount || "0" : amount)}
                  </span>
                </div>
                {coverFee && (
                  <div className="flex justify-between text-sm">
                    <span>Processing Fee:</span>
                    <span className="font-medium">${formatCurrency(calculateProcessingFee())}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-border pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-primary">${formatCurrency(getTotalAmount())}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {frequency === "monthly" ? "Recurring monthly" : "One-time donation"}
                </p>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={isCreatingPayment}
              >
                {isCreatingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Payment...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to donation details
              </Button>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-2">Complete Your Payment</h3>
                  <p className="text-muted-foreground">
                    Enter your payment details to complete your {frequency === "monthly" ? "monthly" : "one-time"} donation of ${getTotalAmount()}
                  </p>
                </div>
                
                <PaymentForm 
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                />

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep(2);
                    setClientSecret("");
                  }}
                  className="w-full"
                >
                  Back to Information
                </Button>
              </div>
            </Elements>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
