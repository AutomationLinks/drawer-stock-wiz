import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ImportCompaniesButtonProps {
  onClick: () => void;
}

export const ImportCompaniesButton = ({ onClick }: ImportCompaniesButtonProps) => {
  return (
    <Button onClick={onClick} variant="outline">
      <Upload className="mr-2 h-4 w-4" />
      Import CSV
    </Button>
  );
};
