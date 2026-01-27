import { Download } from "lucide-react";
import { useState } from "react";

export default function TableControls({ 
  itemsPerPage, 
  onItemsPerPageChange, 
  canExport, 
  onExport,
  hasData 
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="flex flex-wrap justify-between items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-foreground font-medium">Show:</label>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border border-gray-500 rounded-xl px-3 py-2 text-sm 
                    focus:outline-none focus:ring-1 focus:ring-primary-3 focus:border-transparent
                    bg-background-lighter text-foreground cursor-pointer"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span className="text-sm text-gray-300">per page</span>
      </div>

      {canExport && (
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-2 text-white rounded-xl hover:bg-primary-3 transition-colors"
            disabled={!hasData}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-background-light rounded-xl shadow-lg z-50 border border-primary-3/30">
              <button
                onClick={() => {
                  onExport('csv');
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600 text-left"
              >
                Export as CSV
              </button>
              <button
                onClick={() => {
                  onExport('excel');
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors border-b border-gray-600 text-left"
              >
                Export as Excel
              </button>
              <button
                onClick={() => {
                  onExport('json');
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-foreground hover:bg-primary-3/20 hover:text-primary-3 transition-colors text-left"
              >
                Export as JSON
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}