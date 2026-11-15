"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PayloadDialog({
  title,
  payload,
}: {
  title: string;
  payload: Record<string, unknown>;
}) {
  const json = JSON.stringify(payload, null, 2);
  const [copied, setCopied] = useState(false);

  async function copyJson() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Ver JSON
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Cuerpo JSON recibido en la notificación.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={copyJson}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <ScrollArea className="max-h-[60vh] rounded-lg bg-muted">
          <pre className="p-4 font-mono text-xs leading-5 break-all whitespace-pre-wrap">
            {json}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
