// components/Overview/DataQualityCompleteness.tsx
import { AlertTriangle } from 'lucide-react';

const DataQualityCompleteness = () => {
  return (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6">
      <h2 className="text-xl font-bold text-foreground mb-6 tracking-wide">
        DATA QUALITY & COMPLETENESS
      </h2>
      
      <div className="space-y-4 mb-8">
        {/* Missing Data Alerts */}
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="flex-1 pt-1">
            <h3 className="font-semibold text-foreground text-base mb-1">
              Missing Data Alerts:
            </h3>
            <p className="text-gray-300 text-base">5 schools with incomplete profiles.</p>
          </div>
        </div>

        {/* Flagged Duplicate Data */}
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="flex-1 pt-1">
            <h3 className="font-semibold text-foreground text-base mb-1">
              Flagged Duplicate Data
            </h3>
            <p className="text-gray-300 text-base">125 learner records</p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      <div className="mt-8">
        <h3 className="font-medium text-foreground mb-3 text-base">
          Learners Uploaded vs. Expected<br />
          (School A)
        </h3>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-background-lighter rounded-full h-3 mb-2">
            <div
              className="bg-primary-2 h-3 rounded-full transition-all duration-500"
              style={{ width: '95%' }}
            ></div>
          </div>
          
          {/* Percentage Label */}
          <div className="text-center mt-2">
            <span className="text-foreground font-medium text-base">
              95% (475/500)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataQualityCompleteness;