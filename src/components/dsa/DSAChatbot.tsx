import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Send, User, MessageCircle, X, Minimize2, Maximize2, Loader2, GripVertical, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
  const isMobile = useIsMobile();
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

  // Responsive default sizes
  const getDefaultSize = () => {
    if (typeof window === 'undefined') return { width: 420, height: 600 };
    const width = window.innerWidth;
    if (width < 640) return { width: width - 32, height: window.innerHeight - 100 };
    if (width < 1024) return { width: 400, height: 500 };
    return { width: 420, height: 600 };
  };

  const getDefaultPosition = () => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const width = window.innerWidth;
    const height = window.innerHeight;
    const defaultSize = getDefaultSize();
    
    // Position at bottom-right with fixed 24px padding
    const x = width - defaultSize.width - 24;
    const y = height - defaultSize.height - 24;
    
    return { x, y };
  };

  // Helper function to constrain position within viewport
  const constrainToViewport = (x: number, y: number, width: number, height: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Constrain X (horizontal) - keep within bounds
    let constrainedX = Math.max(16, x); // Minimum 16px from left
    constrainedX = Math.min(viewportWidth - width - 16, constrainedX); // Minimum 16px from right

    // Constrain Y (vertical) - keep within bounds but RESPECT drag position
    let constrainedY = Math.max(16, y); // Minimum 16px from top
    constrainedY = Math.min(viewportHeight - height - 16, constrainedY); // Minimum 16px from bottom

    return { x: constrainedX, y: constrainedY };
  };

  // Load saved size/position from localStorage
  const [chatbotSize, setChatbotSize] = useState(() => {
    if (typeof window === 'undefined') return getDefaultSize();
    const deviceType = window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
    const saved = localStorage.getItem(`chatbot-size-${deviceType}`);
    return saved ? JSON.parse(saved) : getDefaultSize();
  });

  const [chatbotPosition, setChatbotPosition] = useState(() => {
    if (typeof window === 'undefined') return getDefaultPosition();
    const deviceType = window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
    const saved = localStorage.getItem(`chatbot-position-${deviceType}`);
    return saved ? JSON.parse(saved) : getDefaultPosition();
  });

  // Reset position when component mounts to ensure visibility
  useEffect(() => {
    // Only reset position on first mount if position is off-screen
    const defaultPos = getDefaultPosition();
    const isOffScreen = 
      chatbotPosition.x < 0 || 
      chatbotPosition.x > window.innerWidth - chatbotSize.width ||
      chatbotPosition.y < 0 ||
      chatbotPosition.y > window.innerHeight - chatbotSize.height;

    if (isOffScreen) {
      console.log('⚠️ Chatbot position is off-screen, resetting to default');
      setChatbotPosition(defaultPos);
    } else {
      console.log('✅ Chatbot position is valid:', chatbotPosition);
    }
  }, []); // Only run once on mount

  // Handle scroll position - chatbot should stay fixed
  useEffect(() => {
    const handleScroll = () => {
      console.log('📜 Page scrolled, chatbot remains fixed');
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save size/position to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const deviceType = window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
    localStorage.setItem(`chatbot-size-${deviceType}`, JSON.stringify(chatbotSize));
    localStorage.setItem(`chatbot-position-${deviceType}`, JSON.stringify(chatbotPosition));
  }, [chatbotSize, chatbotPosition]);

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
      // Get current user for feedback context
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try enhanced AI search with feedback context (fallback to edge function)
      try {
        const response = await fetch('http://localhost:8004/feedback/chatbot-response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userMessage.content,
            user_id: user?.id || 'anonymous',
            context: 'dsa_practice',
            user_level: 'intermediate'
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
            description: `Source: ${data.source === 'contextual_ai' ? 'Personalized AI with your feedback history' : 'AI Knowledge base'}`,
          });
          return;
        }
      } catch (backendError) {
        console.log('Backend service unavailable, falling back to edge function');
      }

      // Fallback to backend API
      console.log('💬 Sending chatbot message to backend:', {
        query: userMessage.content,
        user_id: user?.id,
        timestamp: new Date().toISOString()
      });

      const backendResponse = await fetch('http://localhost:8004/feedback/chatbot-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          user_id: user?.id || 'anonymous',
          context: 'dsa_practice',
          user_level: 'intermediate'
        })
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('📥 Received chatbot response:', {
          source: data.source,
          response_length: data.response.length,
          suggestions: data.suggestions?.length || 0
        });

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || 'I apologize, but I couldn\'t generate a response. Please try again.',
          isBot: true,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        
        toast({
          title: "AI Response Generated",
          description: `Source: ${data.source === 'contextual_ai' ? 'Personalized AI with your feedback history' : 'AI Knowledge base'}`,
        });
      } else {
        throw new Error('Backend chatbot service unavailable');
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
      <Card className="fixed bottom-6 right-6 w-64 shadow-lg border-primary/20 z-50">
        <CardHeader 
          className="pb-2 cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors"
          onClick={onToggleMinimize}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">DSA Assistant</span>
            </div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setChatbotPosition(getDefaultPosition());
                  toast({
                    title: "Chatbot position reset",
                    description: "The chatbot has been moved to the default position",
                  });
                }}
                title="Reset position"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onToggleMinimize?.(); }}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClose?.(); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Mobile full-screen mode
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold">DSA Assistant</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                {message.isBot && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
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
                        ),
                        a: ({ href, children }) => (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(href, '_blank');
                            }}
                          >
                            {children}
                          </a>
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
                  <Avatar className="h-8 w-8 flex-shrink-0">
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
                    <span className="text-muted-foreground">Searching...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4 bg-card">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about DSA..."
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
      </div>
    );
  }

  // Desktop resizable mode - ANCHORED TO VIEWPORT BOTTOM (fixed position)
  return (
    <Rnd
      size={chatbotSize}
      position={chatbotPosition}
      onDragStop={(e, d) => {
        console.log('🎯 Drag stopped at:', { x: d.x, y: d.y });
        const constrained = constrainToViewport(d.x, d.y, chatbotSize.width, chatbotSize.height);
        console.log('📍 Constrained position:', constrained);
        setChatbotPosition(constrained);

        // Save to localStorage
        const deviceType = window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
        localStorage.setItem(`chatbot-position-${deviceType}`, JSON.stringify(constrained));
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const newHeight = parseInt(ref.style.height);
        const newWidth = parseInt(ref.style.width);
        console.log('📏 Resized to:', { width: newWidth, height: newHeight });
        console.log('📍 Position during resize:', position);

        setChatbotSize({ width: newWidth, height: newHeight });

        // Constrain position to keep chatbot visible
        const constrained = constrainToViewport(position.x, position.y, newWidth, newHeight);
        console.log('📍 Final constrained position:', constrained);
        setChatbotPosition(constrained);

        // Save both size and position
        const deviceType = window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
        localStorage.setItem(`chatbot-size-${deviceType}`, JSON.stringify({ width: newWidth, height: newHeight }));
        localStorage.setItem(`chatbot-position-${deviceType}`, JSON.stringify(constrained));
      }}
      minWidth={360}
      minHeight={400}
      maxWidth={800}
      maxHeight={window.innerHeight - 100}
      dragHandleClassName="chatbot-drag-handle"
      style={{ position: 'fixed' }}
      className="z-50"
      enableResizing={{
        top: true,
        right: false,
        bottom: false,
        left: true,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: true,
      }}
      resizeHandleStyles={{
        top: {
          height: '8px',
          top: '0',
          cursor: 'ns-resize',
        },
        left: {
          width: '8px',
          left: '0',
          cursor: 'ew-resize',
        },
        topLeft: {
          width: '16px',
          height: '16px',
          left: '0',
          top: '0',
          cursor: 'nwse-resize',
        },
      }}
      resizeHandleComponent={{
        top: <div className="absolute top-0 left-0 right-0 h-2 hover:bg-primary/20 transition-colors" />,
        left: <div className="absolute left-0 top-0 bottom-0 w-2 hover:bg-primary/20 transition-colors" />,
        topLeft: (
          <div className="absolute top-0 left-0 w-4 h-4 bg-primary/30 hover:bg-primary/50 rounded-br-lg transition-colors flex items-center justify-center">
            <GripVertical className="w-3 h-3 text-primary-foreground" />
          </div>
        ),
      }}
    >
      <Card className={cn(
        "h-full shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm flex flex-col",
        "transition-all duration-200"
      )}>
        <CardHeader className="pb-2 chatbot-drag-handle cursor-move hover:bg-primary/5 transition-colors border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span>DSA Assistant</span>
            </CardTitle>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const defaultPos = getDefaultPosition();
                  const defaultSize = getDefaultSize();
                  setChatbotPosition(defaultPos);
                  setChatbotSize(defaultSize);
                  toast({
                    title: "Position reset",
                    description: "The chatbot has been moved to the default position",
                  });
                }}
                title="Reset position"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
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
                      <span className="text-muted-foreground">Analyzing...</span>
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
    </Rnd>
  );
};

export default DSAChatbot;
