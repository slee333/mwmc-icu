"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Button from "@/components/ui/Button";

interface LlmResultDisplayProps {
  result: string;
}

export default function LlmResultDisplay({ result }: LlmResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mt-5">
        <h3 className="text-[15px] font-bold text-success">
          LLM Output Generated
        </h3>
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy Results"}
        </Button>
      </div>
      <div className="bg-bg border border-card-border rounded-lg p-5 mt-4 max-h-[600px] overflow-y-auto prose prose-sm max-w-none prose-headings:text-text prose-headings:font-bold prose-p:text-text-dim prose-strong:text-text prose-li:text-text-dim prose-hr:border-card-border">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
      </div>
    </div>
  );
}
