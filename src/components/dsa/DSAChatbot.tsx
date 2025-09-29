import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Send, User, MessageCircle, X, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

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
      content: "👋 **Hello! I'm your enhanced DSA Assistant**\n\nI can help you with:\n- **Algorithm explanations** and implementations\n- **Data structure** concepts and operations\n- **Real-time web search** for the latest information\n- **Problem-solving strategies** and approaches\n\n🔍 *I have access to current web information to provide you with the most up-to-date resources and solutions.*\n\nWhat would you like to explore today?",
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
      content: inputValue.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Try enhanced AI search first
      const response = await fetch('https://jwmsgrodliegekbrhvgt.supabase.co/functions/v1/dsa-intelligent-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bXNncm9kbGllZ2VrYnJodmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzU3OTEsImV4cCI6MjA3MjA1MTc5MX0.Nk7JTZQx6Z5tKiVLHeZXUvy8Zkqk3Lc6pftr3H_25RY`
        },
        body: JSON.stringify({
          query: userMessage.content,
          context: 'dsa_practice',
          userLevel: 'intermediate'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || 'I apologize, but I couldn\'t generate a response. Please try again.',
          isBot: true,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        
        toast({
          title: "AI Response Generated",
          description: `Source: ${data.source === 'web_search' ? 'Real-time web search' : 'Knowledge base'}`,
        });
      } else {
        throw new Error('Search service unavailable');
      }
    } catch (error) {
      console.error('Error calling search service:', error);
      
      // Fallback to local responses
      const fallbackResponse = getFallbackResponse(userMessage.content);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: fallbackResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      toast({
        title: "Offline Mode",
        description: "Using cached responses. Try again later for live search.",
        variant: "default",
      });
    }

    setIsLoading(false);
  };

  const getFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('binary search')) {
      return `**Binary Search** is a divide-and-conquer algorithm for finding a target value in a sorted array.

**Key Points:**
- Time Complexity: O(log n)
- Space Complexity: O(1)
- Only works on sorted arrays

**Basic Steps:**
1. Compare target with middle element
2. If target < middle, search left half
3. If target > middle, search right half
4. Repeat until found or search space is empty

Would you like me to explain any specific binary search variation?`;
    }

    if (lowerQuery.includes('dynamic programming') || lowerQuery.includes('dp')) {
      return `**Dynamic Programming (DP)** is an optimization technique that solves problems by breaking them into simpler subproblems.

**Key Principles:**
1. **Optimal Substructure**: Solution can be built from optimal solutions of subproblems
2. **Overlapping Subproblems**: Same subproblems are solved multiple times

**Common Patterns:**
- Linear DP (Fibonacci, House Robber)
- 2D DP (Unique Paths, Edit Distance)
- Tree DP (Binary Tree problems)

**Approach:**
1. Identify the state
2. Define recurrence relation
3. Handle base cases
4. Optimize space if possible

Need help with a specific DP problem?`;
    }

    if (lowerQuery.includes('graph') || lowerQuery.includes('dfs') || lowerQuery.includes('bfs')) {
      return `**Graph Algorithms** are essential for solving connectivity and path-finding problems.

**Common Algorithms:**
- **DFS**: Explores as deep as possible before backtracking
- **BFS**: Explores neighbors before going deeper
- **Dijkstra's**: Shortest path in weighted graphs
- **Union-Find**: Connectivity and cycle detection

**Graph Representations:**
- Adjacency List: Better for sparse graphs
- Adjacency Matrix: Better for dense graphs

What specific graph problem are you working on?`;
    }

    if (lowerQuery.includes('tree') || lowerQuery.includes('binary tree')) {
      return `**Binary Trees** are hierarchical data structures with at most two children per node.

**Common Traversals:**
- **Inorder**: Left → Root → Right
- **Preorder**: Root → Left → Right  
- **Postorder**: Left → Right → Root
- **Level Order**: BFS traversal

**Important Concepts:**
- Height vs Depth
- Balanced vs Unbalanced trees
- Binary Search Trees (BST)

Which tree concept would you like me to explain further?`;
    }

    if (lowerQuery.includes('array') || lowerQuery.includes('sliding window')) {
      return `**Array Algorithms** and **Sliding Window** are fundamental techniques.

**Sliding Window Pattern:**
- Fixed size: Move window of fixed size
- Variable size: Expand/contract based on condition

**Common Array Techniques:**
- Two Pointers (fast/slow, left/right)
- Prefix Sum for range queries
- Kadane's algorithm for subarray problems

What specific array problem are you solving?`;
    }

    // Generic response
    return `I'd be happy to help with "${query}"! 

**Common DSA Topics I can assist with:**
- Arrays & Strings
- Linked Lists
- Trees & Graphs
- Dynamic Programming
- Binary Search
- Sorting & Searching

**For better assistance, please specify:**
- What specific problem are you working on?
- What's your current approach?
- Where are you getting stuck?

Feel free to ask about algorithms, data structures, or problem-solving strategies!`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isMinimized) {
    return (
      <Card className="fixed bottom-6 right-6 w-64 shadow-lg border-primary/20">
        <CardHeader 
          className="pb-2 cursor-pointer bg-primary/5"
          onClick={onToggleMinimize}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">DSA Assistant</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            DSA Assistant
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-[520px] p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                {message.isBot && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    message.isBot
                      ? 'bg-muted text-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {message.isBot ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                        em: ({ children }) => <em className="text-muted-foreground">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        code: ({ children }) => (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs font-mono mt-2">{children}</pre>
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                
                {!message.isBot && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-muted-foreground">Searching and analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about algorithms, data structures..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputValue.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DSAChatbot;