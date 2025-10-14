import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";

const donationSchema = z.object({
  amount: z.string().min(1, "Please select or enter an amount"),
  customAmount: z.string().optional(),
  coverFee: z.boolean().default(false),
  frequency: z.enum(["one-time", "monthly"]),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  company: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationSchema>;

export const DonationForm = () => {
  const [step, setStep] = useState(1);
  const [selectedAmount, setSelectedAmount] = useState<string>("50");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: "50",
      frequency: "one-time",
      coverFee: false,
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

  const onSubmit = (data: DonationFormData) => {
    console.log("Donation data:", data);
    // Here you would integrate with Stripe/PayPal
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
          {step === 1 ? (
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
                          {value === "other" ? "Other" : `$${value}`}
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
                    Yes, I'll cover the ${calculateProcessingFee()} processing fee.
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
                    ${getTotalAmount()}
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
          ) : (
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
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    placeholder="Acme Inc."
                    {...register("company")}
                  />
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Donation:</span>
                  <span className="font-medium">
                    ${amount === "other" ? customAmount : amount}
                  </span>
                </div>
                {coverFee && (
                  <div className="flex justify-between text-sm">
                    <span>Processing Fee:</span>
                    <span className="font-medium">${calculateProcessingFee()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-border pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-primary">${getTotalAmount()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {frequency === "monthly" ? "Recurring monthly" : "One-time donation"}
                </p>
              </div>

              {/* Payment Method Buttons */}
              <div className="space-y-3">
                <Button type="submit" className="w-full" size="lg">
                  Continue with Debit/Credit Card
                </Button>
              </div>

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
        </form>
      </CardContent>
    </Card>
  );
};
