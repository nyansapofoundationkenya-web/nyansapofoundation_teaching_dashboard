// @/components/AssessmentNameStep.jsx
"use client";

export default function AssessmentNameStep({ formData, setFormData, setStep }) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-primary-2 flex items-center justify-center">
              <span className="text-white font-semibold">1</span>
            </div>
            <div className="h-1 w-20 bg-primary-2"></div>
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-gray-400 font-semibold">2</span>
            </div>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
          Name Your Assessment
        </h3>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Enter a name for this assessment. It will be combined with school names to create unique assessment names.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          Assessment Name *
        </label>
        <input
          type="text"
          value={formData.assessmentName}
          onChange={(e) => setFormData(prev => ({ ...prev, assessmentName: e.target.value }))}
          placeholder="e.g., Q1_2024, Term1_Math, Yearly_Assessment"
          className="w-full px-4 py-3 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-2 text-foreground bg-background-lighter transition-colors"
          required
        />
        <p className="text-xs text-gray-400 mt-2">
          This name will be combined with school names in the format: <code className="text-primary-2">{"{assessmentName}_{schoolName}"}</code>
        </p>
      </div>

      <div className="bg-primary-2/20 border border-primary-2/30 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-primary-2 mb-2">Example:</h4>
        <p className="text-sm text-foreground">
          If you enter <span className="font-semibold text-primary-2">"Q1_2024"</span> and select a school named 
          <span className="font-semibold text-primary-2"> "Kitende Primary"</span>, the assessment will be named:
        </p>
        <div className="mt-2 p-3 bg-background-light rounded-lg border border-gray-600">
          <code className="text-primary-2 font-mono">Q1_2024_Kitende_Primary</code>
        </div>
      </div>
    </div>
  );
}