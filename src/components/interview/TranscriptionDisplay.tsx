import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Circle } from "lucide-react";

interface TranscriptionDisplayProps {
	text: string;
	isRecording: boolean;
}

const TranscriptionDisplay = ({ text, isRecording }: TranscriptionDisplayProps) => {
	const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm flex items-center gap-2">
					<Mic className="h-4 w-4" /> Live Transcription
					{isRecording && (
						<span className="flex items-center gap-1 text-red-600 text-xs">
							<Circle className="h-3 w-3 fill-red-600" /> Recording
						</span>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-sm min-h-[96px] whitespace-pre-wrap leading-relaxed">
					{text ? text : (isRecording ? "Listening... start speaking" : "Start recording to see transcription")}
				</div>
				<div className="mt-3 text-xs text-muted-foreground">Word count: {words}</div>
			</CardContent>
		</Card>
	);
};

export default TranscriptionDisplay;
