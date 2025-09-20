"use client"

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { clarifyDoubtAction, textToSpeechAction } from "@/app/actions";
import { type ClarifyExamDoubtsInput } from "@/ai/flows/clarify-exam-doubts";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

interface ChatTutorProps {
  examContext: Omit<ClarifyExamDoubtsInput, 'userQuery' | 'chatHistory'>;
}

export default function ChatTutor({ examContext }: ChatTutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await clarifyDoubtAction({
        ...examContext,
        chatHistory: newMessages.slice(0, -1), // Send history up to the last user message
        userQuery: input,
      });

      setMessages(prev => [...prev, { role: 'model', content: response }]);
      
      // Convert response to speech
      const audioDataUri = await textToSpeechAction(response);
      if (audioDataUri) {
        if (audioRef.current) {
          audioRef.current.src = audioDataUri;
          audioRef.current.play().catch(console.error);
        }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I ran into a problem. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A slight delay to allow the new message to render before scrolling
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);

  // Effect to manage audio playback events
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handlePlay = () => setIsSpeaking(true);
    const handleEnded = () => setIsSpeaking(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handleEnded);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handleEnded);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="flex flex-col h-[600px] w-full bg-gradient-to-tr from-card to-secondary/50 rounded-xl shadow-2xl ring-1 ring-primary/20">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <Sparkles className="h-12 w-12 text-primary/50 mb-4" />
              <p className="text-lg font-medium">Welcome to your post-exam review!</p>
              <p className="text-sm">Ask a question about a specific problem or ask for a hint to get started!</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3",
                message.role === 'user' ? "justify-end" : ""
              )}
            >
              {message.role === 'model' && (
                <Avatar className={cn("w-9 h-9 border-2 border-primary/50 transition-all", isSpeaking && "ring-2 ring-primary ring-offset-2 ring-offset-background")}>
                  <AvatarFallback className="bg-primary/20"><Bot className="text-primary" /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl prose prose-sm",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-background/80 rounded-bl-none shadow-md"
                )}
              >
                <p className="m-0">{message.content}</p>
              </div>
               {message.role === 'user' && (
                <Avatar className="w-9 h-9 border-2">
                  <AvatarFallback className="bg-muted"><User /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-3">
                 <Avatar className="w-9 h-9 border-2 border-primary/50">
                  <AvatarFallback className="bg-primary/20"><Bot className="text-primary" /></AvatarFallback>
                </Avatar>
                <div className="bg-background/80 px-4 py-3 rounded-2xl flex items-center shadow-md">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            </div>
           )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border/50">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Can you explain why I got question 2 wrong?"
            autoComplete="off"
            disabled={isLoading}
            className="bg-background/80 focus-visible:ring-offset-0 focus-visible:ring-primary/80"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="shrink-0">
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
