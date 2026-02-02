// components/AudioModeration/LiteracyNavigationControls.jsx
"use client";

import { ChevronLeft, ChevronRight, SkipForward, Users } from "lucide-react";

export default function LiteracyNavigationControls({
  currentSection,
  currentIndex,
  currentStudentIndex,
  assessmentData,
  studentIds,
  organizationId,
  assessmentId,
  studentId,
  router,
  getNextUnmoderatedItem,
  onNavigateToItem
}) {
  // Helper function to get results by section
  const getSectionResults = (section) => {
    if (!assessmentData?.literacy_results?.reading_results) return [];
    
    const typeMap = {
      'letter': 'Letter',
      'word': 'Word', 
      'paragraph': 'Paragraph',
      'story': 'Story'
    };
    
    const targetType = typeMap[section] || section;
    return assessmentData.literacy_results.reading_results.filter(
      result => result?.metadata?.type === targetType || result?.type === targetType
    );
  };

  // Get all available sections
  const getAvailableSections = () => {
    if (!assessmentData?.literacy_results?.reading_results) return [];
    
    const sections = [];
    const types = ['Letter', 'Word', 'Paragraph', 'Story'];
    
    types.forEach(type => {
      const results = assessmentData.literacy_results.reading_results.filter(
        result => result?.metadata?.type === type || result?.type === type
      );
      if (results.length > 0) {
        sections.push({
          id: type.toLowerCase(),
          name: type,
          results: results
        });
      }
    });
    
    return sections;
  };

  const navigateToSectionItem = (section, index) => {
    router.push(
      `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}/audiomoderation?section=${section}&index=${index}`
    );
  };

  const navigateToStudent = (studentIndex) => {
    if (studentIndex >= 0 && studentIndex < studentIds.length) {
      const nextStudentId = studentIds[studentIndex];
      router.push(
        `/dashboard/${organizationId}/moderations/${assessmentId}/students/${nextStudentId}/audiomoderation?section=letter&index=0`
      );
    }
  };

  const handlePrevious = () => {
    const currentItems = getSectionResults(currentSection);
    
    if (currentIndex > 0) {
      // Previous item in same section
      navigateToSectionItem(currentSection, currentIndex - 1);
    } else {
      // Go to previous section
      const sections = getAvailableSections();
      const currentSectionIndex = sections.findIndex(s => s.id === currentSection);
      
      if (currentSectionIndex > 0) {
        const prevSection = sections[currentSectionIndex - 1];
        const prevItems = prevSection.results;
        const prevIndex = prevItems.length - 1;
        navigateToSectionItem(prevSection.id, prevIndex);
      }
    }
  };

  const handleNext = () => {
    const currentItems = getSectionResults(currentSection);
    
    if (currentIndex < currentItems.length - 1) {
      // Next item in same section
      navigateToSectionItem(currentSection, currentIndex + 1);
    } else {
      // Go to next section
      const sections = getAvailableSections();
      const currentSectionIndex = sections.findIndex(s => s.id === currentSection);
      
      if (currentSectionIndex < sections.length - 1) {
        const nextSection = sections[currentSectionIndex + 1];
        navigateToSectionItem(nextSection.id, 0);
      }
    }
  };

  const handleNextUnmoderated = () => {
    const nextItem = getNextUnmoderatedItem();
    if (nextItem) {
      onNavigateToItem(nextItem.section, nextItem.index);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < studentIds.length - 1) {
      navigateToStudent(currentStudentIndex + 1);
    }
  };

  const getSectionStats = () => {
    const sections = getAvailableSections();
    return sections.map(section => {
      const moderated = section.results.filter(item => 
        item.metadata?.modeltranscriptionverified === true
      ).length;
      
      return {
        section: section.id,
        name: section.name,
        total: section.results.length,
        moderated,
        current: section.id === currentSection
      };
    });
  };

  const sectionStats = getSectionStats();
  const totalModerated = sectionStats.reduce((sum, stat) => sum + stat.moderated, 0);
  const totalItems = sectionStats.reduce((sum, stat) => sum + stat.total, 0);
  const progress = totalItems > 0 ? Math.round((totalModerated / totalItems) * 100) : 0;

  // Check if we're at the first item of the first section
  const availableSections = getAvailableSections();
  const isAtFirstItem = currentIndex === 0 && currentSection === availableSections[0]?.id;
  
  // Check if we're at the last item of the last section
  const currentItems = getSectionResults(currentSection);
  const isAtLastItem = currentIndex === currentItems.length - 1 && 
                      currentSection === availableSections[availableSections.length - 1]?.id;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Overall Progress</span>
          <span>{totalModerated}/{totalItems} ({progress}%)</span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handlePrevious}
          disabled={isAtFirstItem}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        
        <button
          onClick={handleNext}
          disabled={isAtLastItem}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <button
          onClick={handleNextUnmoderated}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          Next Unmoderated
        </button>
        
        <button
          onClick={handleNextStudent}
          disabled={currentStudentIndex >= studentIds.length - 1}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-2/20 hover:bg-primary-2/30 disabled:opacity-50 disabled:cursor-not-allowed text-primary-2 border border-primary-2/30 rounded-lg transition-colors"
        >
          <Users className="w-4 h-4" />
          Next Student
        </button>
      </div>

      {/* Student Navigation */}
      <div className="pt-4 border-t border-gray-600">
        <div className="text-sm text-gray-400 mb-2">Student</div>
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {currentStudentIndex + 1} of {studentIds.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => navigateToStudent(currentStudentIndex - 1)}
              disabled={currentStudentIndex <= 0}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded text-sm transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => navigateToStudent(currentStudentIndex + 1)}
              disabled={currentStudentIndex >= studentIds.length - 1}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded text-sm transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}