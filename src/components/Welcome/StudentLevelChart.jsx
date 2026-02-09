"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Utility functions
const ChartDataFormatter = {
  formatLevelName: (level) => {
    if (!level) return "Unknown";
    
    // Special formatting for common literacy levels
    const specialFormats = {
      "non-reader": "Non-Reader",
      "reading-comprehension": "Reading Comprehension",
      "beginner": "Beginner",
      "letter": "Letter",
      "word": "Word",
      "paragraph": "Paragraph",
      "story": "Story",
      "above": "Above",
      "number_recognition": "Number Recognition",
      "addition": "Addition",
      "subtraction": "Subtraction",
      "multiplication": "Multiplication",
      "division": "Division",
    };
    
    // Return formatted name if available, otherwise format generically
    if (specialFormats[level]) {
      return specialFormats[level];
    }
    
    // Default formatting for any other level names
    return level
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
};

const ChartDataParser = {
  safeNumber: (value) => {
    if (value == null || value === '' || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) || !isFinite(num) || num < 0 ? 0 : num;
  }
};

const ChartDataTransformer = {
  transformData: (resultData, levelType) => {
    if (!resultData || typeof resultData !== 'object') {
      throw new Error('Invalid data structure received from API');
    }
    
    // Correct keys based on API response structure
    const baselineKey = levelType === "literacy" ? "baseline" : "baseline_numeracy";
    const endlineKey = levelType === "literacy" ? "endline" : "endline_numeracy";
    
    // Safely get baseline and endline data with fallbacks
    const baselineData = resultData[baselineKey] || {};
    const endlineData = resultData[endlineKey] || {};
    
    // Get ALL levels from the API response (API ensures all schema levels are present)
    let levels = Object.keys(baselineData);
    
    // If no levels, fall back to appropriate defaults
    if (levels.length === 0) {
      // console.warn(`No levels in API response for ${levelType}, using defaults`);
      levels = levelType === "literacy"
        ? ["beginner", "letter", "word", "paragraph", "story", "above"]
        : ["beginner", "number_recognition", "addition", "subtraction", "multiplication", "division"];
    }
    
    // console.log(`Transforming data for ${levelType}, levels found:`, levels);
    
    // Sort levels in logical order
    const sortLevels = (levelsArray, type) => {
      const levelOrder = {
        "literacy": {
          "non-reader": 0,
          "beginner": 0,
          "letter": 1,
          "word": 2,
          "paragraph": 3,
          "story": 4,
          "reading-comprehension": 4,
          "above": 5
        },
        "numeracy": {
          "beginner": 0,
          "number_recognition": 1,
          "addition": 2,
          "subtraction": 3,
          "multiplication": 4,
          "division": 5
        }
      };
      
      const orderMap = levelOrder[type] || {};
      
      return [...levelsArray].sort((a, b) => {
        const orderA = orderMap[a] !== undefined ? orderMap[a] : 99;
        const orderB = orderMap[b] !== undefined ? orderMap[b] : 99;
        return orderA - orderB;
      });
    };
    
    const sortedLevels = sortLevels(levels, levelType);
    
    // Transform data for chart
    const transformed = sortedLevels.map((level) => ({
      level: ChartDataFormatter.formatLevelName(level),
      baseline: ChartDataParser.safeNumber(baselineData[level]),
      current: ChartDataParser.safeNumber(endlineData[level]),
      rawLevel: level // Keep original level name
    }));
    
    return transformed;
  }
};

export default function StudentLevelsChart({ organizationId }) {
  const [loading, setLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState([])
  const [levelType, setLevelType] = useState("literacy") // literacy | numeracy

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return

      setLoading(true)
      setError(null)

      try {
        // Determine API endpoint based on dropdown
        const endpoint =
          levelType === "literacy"
            ? "/api/literacy/student-levels"
            : "/api/numeracy/levels"

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organization_id: organizationId }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json()

        if (!result.success) {
          setError(result.message || result.error || "API request failed")
          return
        }

        // console.log("API Response for", levelType, ":", result.data);
        
        // Transform data using utility function
        const transformed = ChartDataTransformer.transformData(result.data, levelType)
        // console.log("Transformed chart data:", transformed);
        
        // Show highest level at top (reverse the array)
        setChartData(transformed.reverse())
        
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [organizationId, levelType]) // Re-fetch when literacy/numeracy changes

  // Handle download functionality
  const handleDownload = async () => {
    if (!organizationId) {
      alert("Please select an organization first")
      return
    }

    setDownloadLoading(true)
    
    try {
      // console.log('Downloading for organization:', organizationId);
      
      const response = await fetch(`/api/export/student-performance?organization_id=${organizationId}`, {
        method: "GET",
      })

      // console.log('Response status:', response.status);
      
      // Check content type
      const contentType = response.headers.get('content-type') || '';
      // console.log('Content-Type:', contentType);
      
      if (contentType.includes('application/json')) {
        // It's an error response
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Download failed');
      }
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Get the blob
      const blob = await response.blob();
      // console.log('Blob type:', blob.type);
      // console.log('Blob size:', blob.size, 'bytes');
      
      // Validate blob
      if (blob.size === 0) {
        throw new Error('File is empty');
      }
      
      if (blob.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          blob.type !== 'application/octet-stream') {
        console.warn('Unexpected blob type:', blob.type);
        // Try to read as text to see if it's an error
        const text = await blob.text();
        if (text.length < 1000 && (text.includes('error') || text.includes('Error'))) {
          throw new Error('Server error: ' + text.substring(0, 100));
        }
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Get filename from header or use default
      let filename = "student_performance.xlsx";
      const contentDisposition = response.headers.get('Content-Disposition');
      // console.log('Content-Disposition header:', contentDisposition);
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=["']?([^"']+)["']?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        } else {
          // Try simpler match
          const simpleMatch = contentDisposition.match(/filename=["']?([^;"']+)["']?/i);
          if (simpleMatch && simpleMatch[1]) {
            filename = simpleMatch[1];
          }
        }
      }
      
      // console.log('Using filename:', filename);
      
      // Ensure filename ends with .xlsx
      if (!filename.toLowerCase().endsWith('.xlsx')) {
        filename += '.xlsx';
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
    } catch (error) {
      console.error("Download error:", error);
      alert(`Error downloading file: ${error.message}`);
    } finally {
      setDownloadLoading(false);
    }
  }

  // Tooltip for chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-lighter border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-2">{payload[0].payload.level}</p>
          <p className="text-xs text-gray-400">
            Baseline: <span className="text-white font-medium">{payload[0].value}</span>
          </p>
          <p className="text-xs text-gray-400">
            Current: <span className="text-white font-medium">{payload[1].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Loading UI
  if (loading) {
    return (
      <ChartContainer 
        title="STUDENT LEVEL DISTRIBUTION" 
        levelType={levelType} 
        setLevelType={setLevelType}
        onDownload={handleDownload}
        downloadLoading={downloadLoading}
      >
        <div className="h-80 flex items-center justify-center text-gray-400">
          Loading chart data...
        </div>
      </ChartContainer>
    )
  }

  // Error UI
  if (error) {
    return (
      <ChartContainer 
        title="STUDENT LEVEL DISTRIBUTION" 
        levelType={levelType} 
        setLevelType={setLevelType}
        onDownload={handleDownload}
        downloadLoading={downloadLoading}
      >
        <div className="h-80 flex items-center justify-center text-red-400">
          <div className="text-center">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm mt-2">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                setLoading(true);
                // Trigger a refetch
                const fetchData = async () => {
                  try {
                    const endpoint = levelType === "literacy" ? "/api/literacy/student-levels" : "/api/numeracy/levels";
                    const response = await fetch(endpoint, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ organization_id: organizationId }),
                    });
                    
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    
                    const result = await response.json();
                    
                    if (!result.success) {
                      setError(result.message || result.error || "API request failed");
                      return;
                    }
                    
                    const transformed = ChartDataTransformer.transformData(result.data, levelType);
                    setChartData(transformed.reverse());
                  } catch (err) {
                    setError(err.message || "Failed to fetch data");
                  } finally {
                    setLoading(false);
                  }
                };
                if (organizationId) fetchData();
              }}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300"
            >
              Try again
            </button>
          </div>
        </div>
      </ChartContainer>
    )
  }

  // Empty data state
  if (chartData.length === 0) {
    return (
      <ChartContainer 
        title="STUDENT LEVEL DISTRIBUTION" 
        levelType={levelType} 
        setLevelType={setLevelType}
        onDownload={handleDownload}
        downloadLoading={downloadLoading}
      >
        <div className="h-80 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="font-medium">No data available</p>
            <p className="text-sm mt-2">No student data found for the selected organization</p>
          </div>
        </div>
      </ChartContainer>
    )
  }

  // Chart UI
  return (
    <ChartContainer 
      title="STUDENT LEVEL DISTRIBUTION" 
      levelType={levelType} 
      setLevelType={setLevelType}
      onDownload={handleDownload}
      downloadLoading={downloadLoading}
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9CA3AF" />
          <YAxis 
            type="category" 
            dataKey="level" 
            stroke="#9CA3AF" 
            width={140}
            tickFormatter={(value) => value}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(55,65,81,0.3)" }} />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="rect"
            formatter={(value) => (
              <span className="text-sm text-gray-300">
                {value === "baseline" ? "Baseline" : "Current"}
              </span>
            )}
          />
          <Bar dataKey="baseline" fill="#6B7280" radius={[0, 4, 4, 0]} />
          <Bar dataKey="current" fill="#60A5FA" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// Dropdown + wrapper
function ChartContainer({ children, title, levelType, setLevelType, onDownload, downloadLoading }) {
  return (
    <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-primary-2">{title}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onDownload}
            disabled={downloadLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
          >
            {downloadLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </>
            )}
          </button>
          <Dropdown levelType={levelType} setLevelType={setLevelType} />
        </div>
      </div>
      {children}
    </div>
  )
}

function Dropdown({ levelType, setLevelType }) {
  return (
    <select
      value={levelType}
      onChange={(e) => setLevelType(e.target.value)}
      className="bg-gray-800 border border-gray-600 text-gray-200 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="literacy">Literacy</option>
      <option value="numeracy">Numeracy</option>
    </select>
  )
}