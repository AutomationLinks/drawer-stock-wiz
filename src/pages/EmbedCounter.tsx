import { DonationCounter } from "@/components/DonationCounter";

const EmbedCounter = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <DonationCounter />
      </div>
    </div>
  );
};

export default EmbedCounter;
