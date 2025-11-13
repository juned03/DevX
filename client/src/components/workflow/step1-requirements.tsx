import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Check, FileText } from "lucide-react";
import { useWorkflow } from "@/context/workflow-context";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";

const DEFAULT_REQUIREMENT = "I need a system to ingest bureau rating algorithms. As an actuary, I will import filing to create rating calculations using AI for premium calculations.";

export function Step1Requirements() {
  const {
    requirement,
    setRequirement,
    setGuidelines,
    setEpics,
    setFeatures,
    setUserStories,
    setPersonas,
    isGenerating,
    setIsGenerating,
    setCurrentStep,
    setStep1Complete,
    step1Complete,
  } = useWorkflow();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRequirement(text);
        toast.success(`File "${file.name}" uploaded successfully`);
      };
      reader.readAsText(file);
    }
  };

  const handleGenerate = async () => {
    if (!requirement.trim()) {
      toast.error("Please enter a requirement");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate guidelines
      const guidelinesRes = await apiRequest("POST", "/api/workflow/generate-guidelines", {
        input: requirement,
      });
      const guidelinesData = await guidelinesRes.json();
      setGuidelines(guidelinesData.guidelines);
      
      // Generate artifacts
      const artifactsRes = await apiRequest("POST", "/api/workflow/generate-artifacts", {
        requirement,
      });
      const artifactsData = await artifactsRes.json();
      setEpics(artifactsData.epics);
      setFeatures(artifactsData.features);
      setUserStories(artifactsData.userStories);
      setPersonas(artifactsData.personas);
      
      setStep1Complete(true);
      toast.success("Guidelines and artifacts generated successfully!");
      
      // Auto-advance to step 2 after a brief delay
      setTimeout(() => {
        setCurrentStep(2);
      }, 500);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExample = () => {
    setRequirement(DEFAULT_REQUIREMENT);
    toast.success("Example requirement loaded");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Requirements Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="requirement" className="text-sm font-medium">
              Enter your requirements or upload a file
            </label>
            <Textarea
              id="requirement"
              placeholder="Describe your system requirements in detail..."
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              rows={8}
              className="resize-none"
              data-testid="textarea-requirement"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".txt,.pdf,.docx"
              onChange={handleFileUpload}
              data-testid="input-file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </span>
              </Button>
            </label>

            <Button variant="secondary" onClick={loadExample} data-testid="button-load-example">
              Load Example
            </Button>

            {uploadedFile && (
              <span className="text-sm text-muted-foreground">
                Uploaded: {uploadedFile.name}
              </span>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !requirement.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
            data-testid="button-generate"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Guidelines & Artifacts...
              </>
            ) : step1Complete ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Generation Complete
              </>
            ) : (
              "Generate Guidelines & Artifacts"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
