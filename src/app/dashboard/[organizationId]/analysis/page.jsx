"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useAnalysis } from '@/hooks/useAnalysis';
import DashboardLayout from '../DashboardLayout';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AssessmentAnalysisPage() {
  const { organizationId } = useParams();
  const {
    assessments,
    error,
    listLoading,
    detailLoading,
    fetchAllAssessments,
    getAssessmentById,
  } = useAnalysis();
  const [selectedAssessmentData, setSelectedAssessmentData] = useState(null);
  const [loadingState, setLoadingState] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  // Load data once on mount
  useEffect(() => {
    async function loadPageData() {
      try {
        setLoadingState(true);
        const fetchedAssessments = await fetchAllAssessments();
        if (!fetchedAssessments.length) {
          setLoadingState(false);
          return;
        }
        const firstAssessmentId = fetchedAssessments[0].id;
        setSelectedId(firstAssessmentId);
        const data = await getAssessmentById(firstAssessmentId);
        setSelectedAssessmentData(data);
      } catch (err) {
        console.error('Failed to load page data:', err);
      } finally {
        setLoadingState(false);
      }
    }
    loadPageData();
  }, [fetchAllAssessments, getAssessmentById]);

  // Chart data for reading type pass rates by grade (stacked)
  const readingTypeChartData = {
    labels: selectedAssessmentData?.stats.gradeStats
      ? Object.keys(selectedAssessmentData.stats.gradeStats).sort((a, b) => Number(a) - Number(b))
      : [],
    datasets: [
      {
        label: 'Letter Recognition',
        data: selectedAssessmentData?.stats.gradeStats
          ? Object.values(selectedAssessmentData.stats.gradeStats)
              .sort((a, b) => {
                const keyA = Object.keys(selectedAssessmentData.stats.gradeStats).find(
                  (k) => selectedAssessmentData.stats.gradeStats[k] === a
                );
                const keyB = Object.keys(selectedAssessmentData.stats.gradeStats).find(
                  (k) => selectedAssessmentData.stats.gradeStats[k] === b
                );
                return Number(keyA) - Number(keyB);
              })
              .map((stats) => stats.readingTypeStats.letterrecognition.percentage)
          : [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        stack: 'Stack 0',
      },
      {
        label: 'Word',
        data: selectedAssessmentData?.stats.gradeStats
          ? Object.values(selectedAssessmentData.stats.gradeStats)
              .sort((a, b) => {
                const keyA = Object.keys(selectedAssessmentData.stats.gradeStats).find(
                  (k) => selectedAssessmentData.stats.gradeStats[k] === a
                );
                const keyB = Object.keys(selectedAssessmentData.stats.gradeStats).find(
                  (k) => selectedAssessmentData.stats.gradeStats[k] === b
                );
                return Number(keyA) - Number(keyB);
              })
              .map((stats) => stats.readingTypeStats.word.percentage)
          : [],
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        stack: 'Stack 0',
      },
      {
        label: 'Paragraph',
        data: selectedAssessmentData?.stats.gradeStats
          ? Object.values(selectedAssessmentData.stats.gradeStats)
              .sort((a, b) => {
                const keyA = Object.keys(selectedAssessmentData.stats.gradeStats).find(
                  (k) => selectedAssessmentData.stats.gradeStats[k] === a
                );
                const keyB = Object.keys(selectedAssessmentData.stats.gradeStats).find(
                  (k) => selectedAssessmentData.stats.gradeStats[k] === b
                );
                return Number(keyA) - Number(keyB);
              })
              .map((stats) => stats.readingTypeStats.paragraph.percentage)
          : [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        stack: 'Stack 0',
      },
      {
        label: 'Story',
        data: selectedAssessmentData?.stats.gradeStats
          ? Object.values(selectedAssessmentData.stats.gradeStats)
              .sort((a, b) => {
                const keyA = Object.keys(selectedAssessmentData.stats.gradeStats).find(
                  (k) => selectedAssessmentData.stats.gradeStats[k] === a
                );
                const keyB = Object.keys(selectedAssessmentData.stats.gradeStats).find(
                  (k) => selectedAssessmentData.stats.gradeStats[k] === b
                );
                return Number(keyA) - Number(keyB);
              })
              .map((stats) => stats.readingTypeStats.story.percentage)
          : [],
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        stack: 'Stack 0',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: 'Grade', color: '#000000' },
        ticks: { color: '#000000' },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Pass Rate (%)', color: '#000000' },
        ticks: { color: '#000000' },
      },
    },
    plugins: {
      legend: { display: true, position: 'top', labels: { color: '#000000' } },
      tooltip: { enabled: true },
    },
  };

  // If orgId is missing
  if (!organizationId) {
    return (
      <DashboardLayout organizationId={organizationId}>
        <div className="min-h-screen bg-blue-50 flex items-center justify-center">
          <p className="text-black">Organization ID is missing</p>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state
  if (listLoading || detailLoading || loadingState) {
    return (
      <DashboardLayout organizationId={organizationId}>
        <div className="min-h-screen bg-blue-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error
  if (error) {
    return (
      <DashboardLayout organizationId={organizationId}>
        <div className="min-h-screen bg-blue-50 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-black px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout organizationId={organizationId}>
      <div className="min-h-screen bg-blue-50 p-4 md:p-8 text-black">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Assessment Analysis</h1>

        {/* Show assessments */}
        {assessments.length === 0 ? (
          <p className="text-black">No assessments found.</p>
        ) : (
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assessments.map((assessment) => (
              <button
                key={assessment.id}
                onClick={async () => {
                  setSelectedId(assessment.id);
                  setLoadingState(true);
                  try {
                    const data = await getAssessmentById(assessment.id);
                    setSelectedAssessmentData(data);
                  } catch (err) {
                    console.error('Failed to fetch assessment:', err);
                  } finally {
                    setLoadingState(false);
                  }
                }}
                className={`p-4 rounded-lg text-left ${
                  selectedId === assessment.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-black'
                }`}
              >
                {assessment.name}
              </button>
            ))}
          </div>
        )}

        {/* Show selected assessment data */}
        {selectedAssessmentData?.assessment ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-black">
              {selectedAssessmentData.assessment.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-black">Assessment Statistics</h3>
                <p className="text-black">
                  Total Students: {selectedAssessmentData.stats.completed + selectedAssessmentData.stats.incomplete}
                </p>
                <p className="text-black">Completed: {selectedAssessmentData.stats.completed}</p>
                <p className="text-black">Incomplete: {selectedAssessmentData.stats.incomplete}</p>
              </div>

              {/* MCQ Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-black">Multiple Choice Questions</h3>
                <p className="text-black">Total: {selectedAssessmentData.stats.mcqStats.total}</p>
                <p className="text-black">Passed: {selectedAssessmentData.stats.mcqStats.passed}</p>
                <p className="text-black">Failed: {selectedAssessmentData.stats.mcqStats.failed}</p>
              </div>

              {/* Reading Type Stats */}
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <h3 className="font-semibold mb-2 text-black">Reading Type Statistics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(selectedAssessmentData.stats.readingTypeStats).map(([type, stats]) => (
                    <div key={type} className="bg-gray-100 p-3 rounded">
                      <h4 className="font-medium capitalize text-black">{type.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <p className="text-black">Total: {stats.total}</p>
                      <p className="text-black">Passed: {stats.passed}</p>
                      <p className="text-black">Failed: {stats.failed}</p>
                      <p className="text-black">Pass Rate: {stats.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reading Type Pass Rates by Grade Chart */}
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <h3 className="font-semibold mb-2 text-black">Reading Type Pass Rates by Grade</h3>
                <div className="h-64">
                  <Bar data={readingTypeChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 p-8 text-center rounded-lg">
            <p className="text-black">No assessment data available</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}