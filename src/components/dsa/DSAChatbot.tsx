import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Send, User, MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface DSAChatbotProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
}

const DSAChatbot: React.FC<DSAChatbotProps> = ({ 
  isMinimized = false, 
  onToggleMinimize,
  onClose 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your DSA study assistant. I can help you with:\n\n• Algorithm explanations\n• Problem-solving strategies\n• Time & space complexity analysis\n• Code review and optimization\n• Study recommendations\n\nWhat would you like to learn today?",
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call DSA chatbot service
      const response = await fetch('http://localhost:8002/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          context: 'dsa_learning'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from DSA assistant');
      }

      const result = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: result.response || "I'm having trouble understanding that. Could you rephrase your question about DSA concepts?",
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('DSA Chatbot error:', error);
      
      // Fallback responses for common DSA topics
      const fallbackResponse = getFallbackResponse(inputValue);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: fallbackResponse,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      
      toast({
        title: "Connection Issue",
        description: "Using offline responses. Backend service may be unavailable.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('array') || lowerQuery.includes('sorting')) {
      return "Arrays are fundamental data structures! For sorting:\n\n• **Bubble Sort**: O(n²) - Good for learning\n• **Quick Sort**: O(n log n) average - Very efficient\n• **Merge Sort**: O(n log n) - Stable, consistent\n\nKey tip: Practice with different array problems to master pointer techniques!";
    }
    
    if (lowerQuery.includes('tree') || lowerQuery.includes('binary')) {
      return "Binary Trees are crucial for DSA! Key concepts:\n\n• **Traversals**: Inorder, Preorder, Postorder\n• **BST Properties**: Left < Root < Right\n• **Common Problems**: Height, Diameter, LCA\n\nStart with basic traversals and build up to complex tree problems!";
    }
    
    if (lowerQuery.includes('graph') || lowerQuery.includes('bfs') || lowerQuery.includes('dfs')) {
      return "Graph algorithms are powerful! Essential ones:\n\n• **BFS**: Level-order, shortest path in unweighted graphs\n• **DFS**: Deep exploration, cycle detection\n• **Dijkstra**: Shortest path with weights\n• **Union-Find**: Connected components\n\nVisualize the graph first, then choose the right traversal method!";
    }
    
    if (lowerQuery.includes('dynamic') || lowerQuery.includes('dp')) {
      return "Dynamic Programming is all about optimization! Approach:\n\n1. **Identify**: Overlapping subproblems\n2. **Define**: State and recurrence relation\n3. **Implement**: Top-down (memoization) or bottom-up\n\nStart with Fibonacci, Climbing Stairs, then move to 2D DP problems!";
    }
    
    if (lowerQuery.includes('time') || lowerQuery.includes('complexity')) {
      return "Time Complexity Analysis:\n\n• **O(1)**: Constant - Hash operations\n• **O(log n)**: Logarithmic - Binary search\n• **O(n)**: Linear - Single loop\n• **O(n log n)**: Efficient sorting\n• **O(n²)**: Nested loops\n\nAlways analyze your solution and think about optimizations!";
    }
    
    return "Great question! DSA is all about practice and understanding patterns. Here are some general tips:\n\n• Start with easy problems and build confidence\n• Focus on understanding patterns rather than memorizing\n• Practice coding by hand sometimes\n• Explain your approach before coding\n\nWhat specific DSA topic would you like to explore?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isMinimized) {
    return (
      <Button
        onClick={onToggleMinimize}
        className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[32rem] shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-primary/10 rounded-full">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            DSA Study Assistant
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="w-8 h-8 p-0"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isBot ? '' : 'flex-row-reverse'}`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={message.isBot ? 'bg-primary/10' : 'bg-secondary/10'}>
                    {message.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] ${
                    message.isBot
                      ? 'bg-muted text-foreground'
                      : 'bg-primary text-primary-foreground ml-auto'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about algorithms, data structures..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DSAChatbot;