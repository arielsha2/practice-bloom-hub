import type { DiagnosisResult } from '@/components/bots/DiagnosisResultDialog';
import { parseDiagnosisReport } from '@/lib/diagnosisReport';

// Maps the stored diagnosis_output row (snake_case, written by bot-extract-output) to what the result dialog shows.
export function diagnosisFromOutput(d: Record<string, unknown>): DiagnosisResult {
  return {
    presentingTheory: String(d.presenting_theory ?? ''),
    whatIsWorking: String(d.what_is_working ?? ''),
    bottleneck: String(d.bottleneck_description ?? ''),
    diagnosisSummary: String(d.diagnosis_summary ?? ''),
    bottleneckStage: String(d.bottleneck_stage ?? ''),
    evidenceSummary: String(d.evidence_summary ?? ''),
    behavioralMechanism: String(d.behavioral_mechanism ?? ''),
    notThePriority: String(d.not_the_priority ?? ''),
    pathForward: String(d.path_forward ?? ''),
    recommendedTool: String(d.recommended_tool ?? ''),
    areaMap: Array.isArray(d.area_map) ? (d.area_map as DiagnosisResult['areaMap']) : [],
    report: parseDiagnosisReport(d.report),
  };
}
