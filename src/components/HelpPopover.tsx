import { ReactNode } from "react";
import { HelpCircle, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HelpPopoverProps {
  title: string;
  body: string | ReactNode;
  articleId?: string; // links to /help#articleId
  side?: "top" | "bottom" | "left" | "right";
}

export function HelpPopover({ title, body, articleId, side = "top" }: HelpPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label={`Help: ${title}`}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} className="w-72 p-4 text-sm" sideOffset={6}>
        <p className="font-semibold text-foreground mb-2">{title}</p>
        <div className="text-muted-foreground leading-relaxed text-xs">{body}</div>
        {articleId && (
          <Link
            to={`/help`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
          >
            <ExternalLink className="h-3 w-3" /> Read full article
          </Link>
        )}
      </PopoverContent>
    </Popover>
  );
}
