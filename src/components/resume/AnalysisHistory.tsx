import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Clock, FileText, TrendingUp, Search, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface AnalysisHistoryItem {
  id: string;
  job_role: string;
  job_description: string;
  file_name: string;
  action_verb_score: number;
  star_methodology_score: number;
  ats_score: number;
  overall_score: number;
  created_at: string;
}

interface AnalysisHistoryProps {
  onSelectAnalysis: (analysisId: string) => void;
  selectedAnalysisId?: string;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  onSelectAnalysis,
  selectedAnalysisId
}) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchAnalysisHistory();
    }
  }, [user?.id]);

  const fetchAnalysisHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8003/analysis-history/${user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis history');
      }
      
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      toast({
        title: "Error",
        description: "Failed to load analysis history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item =>
    item.job_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-primary/10 text-primary border-primary/20';
    if (score >= 60) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Analysis History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Analysis History
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by job role or file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No analyses match your search' : 'No analysis history found'}
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAnalysisId === item.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => onSelectAnalysis(item.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm truncate">
                            {item.file_name}
                          </span>
                        </div>
                        
                        <div className="mb-2">
                          <Badge variant="outline" className="mb-1">
                            {item.job_role}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Overall:</span>
                            <Badge 
                              variant="outline" 
                              className={getScoreColor(item.overall_score)}
                            >
                              {Math.round(item.overall_score)}%
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">ATS:</span>
                            <Badge 
                              variant="outline" 
                              className={getScoreColor(item.ats_score)}
                            >
                              {Math.round(item.ats_score)}%
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.created_at)}
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};