import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OcrProcessingStateProps {
  onComplete: () => void;
}

export default function OcrProcessingState({ onComplete }: OcrProcessingStateProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2500;
    const interval = 50;
    const step = (100 / duration) * interval;
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(onComplete, 300);
      return () => clearTimeout(t);
    }
  }, [progress, onComplete]);

  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center space-y-1">
        <p className="text-base font-semibold text-foreground">🔍 กำลังอ่านเอกสาร...</p>
        <p className="text-sm text-muted-foreground">ระบบกำลังตรวจสอบใบกำกับภาษีของคุณ กรุณารอสักครู่</p>
      </div>
      <div className="w-full max-w-xs">
        <Progress value={progress} className="h-2" />
      </div>
      <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
    </div>
  );
}
