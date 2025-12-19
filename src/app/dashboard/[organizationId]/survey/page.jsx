// app/dashboard/[organizationId]/household/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiHome, FiUsers, FiFilter, FiDownload, FiSearch, FiChevronDown, FiChevronUp, FiUserCheck, FiUserX, FiTrash2, FiUser } from "react-icons/fi";
import { useOrganizationHouseholds } from "@/hooks/useOrganizationHouseholds";
import DashboardLayout from "../DashboardLayout";
import { fetchStudentNamesByLinkedIds, StudentFetcher } from "@/hooks/household/useHousehold";

export default function HouseholdPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId;
  
  const { 
    households, 
    metrics, 
    loading, 
    error,
    exportToExcel,
    isExporting,
    deleteDuplicateHouseholds
  } = useOrganizationHouseholds(organizationId);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedHousehold, setExpandedHousehold] = useState(null);
  const [filteredHouseholds, setFilteredHouseholds] = useState([]);
  const [linkedLearnerStatus, setLinkedLearnerStatus] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [studentNames, setStudentNames] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  
  // Function to fetch student names from Firebase directly
  const fetchStudentNamesFromFirebase = async (linkedLearnerIds) => {
    if (!linkedLearnerIds || linkedLearnerIds.length === 0) {
      return {};
    }

    setIsFetchingStudents(true);
    try {
      const names = await fetchStudentNamesByLinkedIds(organizationId, linkedLearnerIds);
      console.log("Fetched student names:", names); // Keep this to verify
      
      return names;
    } catch (error) {
      console.error('Error fetching student names from Firebase:', error);
      return {};
    } finally {
      setIsFetchingStudents(false);
    }
  };

  // Analyze linked learner IDs to find duplicates
  useEffect(() => {
    const analyzeLinkedLearners = async () => {
      if (households.length > 0) {
        const linkedLearnerMap = new Map();
        const status = {};
        const allLinkedLearnerIds = new Set();
        
        // First pass: collect all linked learner IDs
        households.forEach(household => {
          if (household.children && Array.isArray(household.children)) {
            household.children.forEach((child, index) => {
              const linkedLearnerId = child.linkedLearnerId;
              if (linkedLearnerId) {
                allLinkedLearnerIds.add(linkedLearnerId);
                if (!linkedLearnerMap.has(linkedLearnerId)) {
                  linkedLearnerMap.set(linkedLearnerId, []);
                }
                linkedLearnerMap.get(linkedLearnerId).push({
                  householdId: household.id,
                  householdName: household.householdHeadName || `Household ${household.id.slice(0, 6)}`,
                  childName: `${child.firstName || ''} ${child.lastName || ''}`.trim(),
                  childIndex: index,
                  householdData: household
                });
              }
            });
          }
        });
        
        // Fetch student names from Firebase
        const studentNamesData = await fetchStudentNamesFromFirebase(Array.from(allLinkedLearnerIds));
        setStudentNames(studentNamesData);
        
        // Second pass: mark status and identify which ones exist in students collection
        households.forEach(household => {
          const householdStatus = {};
          
          if (household.children && Array.isArray(household.children)) {
            household.children.forEach((child, index) => {
              const linkedLearnerId = child.linkedLearnerId;
              if (linkedLearnerId) {
                const entries = linkedLearnerMap.get(linkedLearnerId);
                const rawData = studentNamesData[linkedLearnerId];

                // === FIXED: Handle both string and object formats ===
                let studentName = null;
                let studentExistsInCollection = false;

                if (rawData !== undefined && rawData !== null) {
                  studentExistsInCollection = true;
                  if (typeof rawData === 'string') {
                    studentName = rawData.trim() || null;
                  } else if (typeof rawData === 'object') {
                    // Fallback for future object format
                    studentName = rawData.name || 
                                  `${rawData.firstName || ''} ${rawData.lastName || ''}`.trim() || null;
                  }
                }
                // ==================================================

                if (entries && entries.length > 1) {
                  const otherHouseholds = entries
                    .filter(entry => entry.householdId !== household.id)
                    .map(entry => ({
                      householdId: entry.householdId,
                      householdName: entry.householdName,
                      childName: entry.childName
                    }));
                  
                  householdStatus[index] = {
                    status: "sharing",
                    linkedLearnerId: linkedLearnerId,
                    sharedWith: otherHouseholds,
                    studentExistsInCollection,
                    studentName,
                    isSelectedForDeletion: false
                  };
                } else {
                  householdStatus[index] = {
                    status: "unique",
                    linkedLearnerId: linkedLearnerId,
                    studentExistsInCollection,
                    studentName
                  };
                }
              } else {
                householdStatus[index] = {
                  status: "no_id",
                  linkedLearnerId: null,
                  studentExistsInCollection: false
                };
              }
            });
          }
          
          status[household.id] = householdStatus;
        });
        
        setLinkedLearnerStatus(status);
      }
    };
    
    analyzeLinkedLearners();
  }, [households, organizationId]);
  
  // Apply filters and search (unchanged)
  useEffect(() => {
    let result = households;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(household => {
        return (
          (household.householdHeadName || '').toLowerCase().includes(term) ||
          (household.village || '').toLowerCase().includes(term) ||
          (household.schoolName || '').toLowerCase().includes(term) ||
          (household.children || []).some(child => 
            `${child.firstName || ''} ${child.lastName || ''}`.toLowerCase().includes(term)
          )
        );
      });
    }
    
    if (filterStatus !== "all") {
      result = result.filter(household => {
        const householdStatus = linkedLearnerStatus[household.id];
        if (!householdStatus) return false;
        
        if (filterStatus === "unique") {
          return Object.values(householdStatus).some(childStatus => 
            childStatus.status === "unique"
          );
        } else if (filterStatus === "sharing") {
          return Object.values(householdStatus).some(childStatus => 
            childStatus.status === "sharing"
          );
        }
        return true;
      });
    }
    
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'householdName') {
          aValue = a.householdHeadName || '';
          bValue = b.householdHeadName || '';
        } else if (sortConfig.key === 'school') {
          aValue = a.schoolName || '';
          bValue = b.schoolName || '';
        } else if (sortConfig.key === 'childrenCount') {
          aValue = (a.children || []).length;
          bValue = (b.children || []).length;
        } else if (sortConfig.key === 'sharedIds') {
          const aStatus = linkedLearnerStatus[a.id] || {};
          const aSharedCount = Object.values(aStatus).filter(s => s.status === "sharing").length;
          const bStatus = linkedLearnerStatus[b.id] || {};
          const bSharedCount = Object.values(bStatus).filter(s => s.status === "sharing").length;
          aValue = aSharedCount;
          bValue = bSharedCount;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredHouseholds(result);
  }, [households, searchTerm, filterStatus, linkedLearnerStatus, sortConfig]);
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const toggleHousehold = (householdId) => {
    setExpandedHousehold(expandedHousehold === householdId ? null : householdId);
  };
  
  const getHouseholdStats = (householdId) => {
    const status = linkedLearnerStatus[householdId] || {};
    const children = Object.values(status);
    const totalChildren = children.length;
    const uniqueCount = children.filter(s => s.status === "unique").length;
    const sharingCount = children.filter(s => s.status === "sharing").length;
    const noIdCount = children.filter(s => s.status === "no_id").length;
    
    return { totalChildren, uniqueCount, sharingCount, noIdCount };
  };
  
  const handleExport = async () => {
    try {
      const count = await exportToExcel();
      alert(`Successfully exported ${count} households to Excel`);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };
  
  const toggleSelectionForDeletion = (householdId, childIndex) => {
    const status = { ...linkedLearnerStatus };
    if (status[householdId] && status[householdId][childIndex]) {
      status[householdId][childIndex].isSelectedForDeletion = 
        !status[householdId][childIndex].isSelectedForDeletion;
      setLinkedLearnerStatus(status);
      
      const key = `${householdId}-${childIndex}`;
      if (status[householdId][childIndex].isSelectedForDeletion) {
        setSelectedForDeletion(prev => [...prev, key]);
      } else {
        setSelectedForDeletion(prev => prev.filter(item => item !== key));
      }
    }
  };
  
  const handleDeleteDuplicates = async () => {
    if (selectedForDeletion.length === 0) {
      alert("Please select items to delete");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedForDeletion.length} selected duplicate entries? This action cannot be undone.`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const itemsToDelete = selectedForDeletion.map(key => {
        const [householdId, childIndex] = key.split('-');
        return { householdId, childIndex: parseInt(childIndex) };
      });
      
      const response = await fetch(`/api/households/delete-duplicates`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          itemsToDelete
        })
      });
      
      if (response.ok) {
        alert(`Successfully deleted ${selectedForDeletion.length} duplicate entries`);
        setSelectedForDeletion([]);
        window.location.reload();
      } else {
        throw new Error('Failed to delete duplicates');
      }
    } catch (error) {
      alert(`Error deleting duplicates: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const selectAllNonStudentDuplicates = () => {
    const status = { ...linkedLearnerStatus };
    const selected = [];
    
    Object.keys(status).forEach(householdId => {
      Object.keys(status[householdId]).forEach(childIndex => {
        const childStatus = status[householdId][childIndex];
        if (childStatus.status === "sharing" && !childStatus.studentExistsInCollection) {
          status[householdId][childIndex].isSelectedForDeletion = true;
          selected.push(`${householdId}-${childIndex}`);
        }
      });
    });
    
    setLinkedLearnerStatus(status);
    setSelectedForDeletion(selected);
  };
  
  if (loading || isFetchingStudents) {
    return (
      <DashboardLayout organizationId={organizationId}>
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-background-lighter rounded w-64 mb-6"></div>
              <div className="h-96 bg-background-light rounded-2xl"></div>
            </div>
            {isFetchingStudents && (
              <div className="mt-4 text-center text-gray-400">
                Fetching student data from Firebase...
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout organizationId={organizationId}>
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6">
              <p className="text-red-400">Error loading households: {error.message}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout organizationId={organizationId}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FiHome className="text-primary-2" />
              Household Data - Duplicate Management
            </h1>
            <p className="text-gray-300 mt-2">
              Manage household survey data with linked learner ID tracking and duplicate removal
            </p>
          </div>
          
          {/* Delete Controls */}
          {selectedForDeletion.length > 0 && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiTrash2 className="w-5 h-5 text-red-400" />
                  <span className="text-foreground">
                    {selectedForDeletion.length} item(s) selected for deletion
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedForDeletion([])}
                    className="px-4 py-2 text-sm rounded-lg bg-gray-600 hover:bg-gray-700 text-gray-300 transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleDeleteDuplicates}
                    disabled={isDeleting}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDeleting
                        ? 'bg-red-700 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    <FiTrash2 className="w-4 h-4" />
                    {isDeleting ? 'Deleting...' : `Delete ${selectedForDeletion.length} Item(s)`}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-background-light rounded-2xl p-6 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Total Households</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{metrics.totalHouseholds}</p>
                </div>
                <div className="p-3 bg-primary-2/20 rounded-xl">
                  <FiHome className="w-6 h-6 text-primary-2" />
                </div>
              </div>
            </div>
            
            <div className="bg-background-light rounded-2xl p-6 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Linked Learners</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {Object.values(linkedLearnerStatus).reduce((total, status) => 
                      total + Object.values(status).filter(s => s.status === "unique").length, 0
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Unique IDs</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <FiUserCheck className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-background-light rounded-2xl p-6 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Shared IDs</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {Object.values(linkedLearnerStatus).reduce((total, status) => 
                      total + Object.values(status).filter(s => s.status === "sharing").length, 0
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Requires Review</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <FiUserX className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-background-light rounded-2xl p-6 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">In Students DB</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {Object.values(linkedLearnerStatus).reduce((total, status) => 
                      total + Object.values(status).filter(s => s.studentExistsInCollection).length, 0
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Verified Students</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <FiUser className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-background-light rounded-2xl p-6 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Selected</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {selectedForDeletion.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">For Deletion</p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <FiTrash2 className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="bg-background-light rounded-2xl p-6 border border-gray-600 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              {/* Search */}
              <div className="relative w-full lg:w-auto lg:flex-1 max-w-xl">
                <input
                  type="text"
                  placeholder="Search households, children, villages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-500 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-primary-2 focus:border-primary-2
                           bg-background-lighter text-foreground placeholder-gray-400 shadow-md"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <FiFilter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-500 rounded-xl px-3 py-2 text-sm 
                             focus:outline-none focus:ring-1 focus:ring-primary-2 focus:border-primary-2
                             bg-background-lighter text-foreground cursor-pointer shadow-md"
                  >
                    <option value="all">All Households</option>
                    <option value="unique">Only Unique IDs</option>
                    <option value="sharing">Only Shared IDs</option>
                  </select>
                </div>
                
                <button
                  onClick={selectAllNonStudentDuplicates}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium 
                           bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Select Non-Student Duplicates
                </button>
                
                <button
                  onClick={handleExport}
                  disabled={isExporting || households.length === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                    isExporting || households.length === 0
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-primary-2 hover:bg-blue-600 text-white'
                  }`}
                >
                  <FiDownload className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Export Excel'}
                </button>
              </div>
            </div>
            
            {/* Results Count */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-300">
                Showing {filteredHouseholds.length} of {households.length} households
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Sort by:</span>
                <button
                  onClick={() => handleSort('householdName')}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                    sortConfig.key === 'householdName'
                      ? 'bg-primary-2 text-white'
                      : 'bg-background-lighter text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Name {sortConfig.key === 'householdName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('sharedIds')}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                    sortConfig.key === 'sharedIds'
                      ? 'bg-primary-2 text-white'
                      : 'bg-background-lighter text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Shared IDs {sortConfig.key === 'sharedIds' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>
          
          {/* Households Table */}
          <div className="bg-background-light rounded-2xl border border-gray-600 overflow-hidden">
            {filteredHouseholds.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">
                  {searchTerm || filterStatus !== "all" 
                    ? "No households match your search criteria" 
                    : "No household data available"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-background-lighter border-b border-gray-600">
                      <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Household</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Location</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-foreground">School</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Children</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-foreground">ID Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHouseholds.map((household) => {
                      const stats = getHouseholdStats(household.id);
                      const isExpanded = expandedHousehold === household.id;
                      
                      return (
                        <>
                          <tr 
                            key={household.id}
                            className="border-b border-gray-600 hover:bg-background-lighter cursor-pointer transition-colors"
                            onClick={() => toggleHousehold(household.id)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <button className="p-1 hover:bg-gray-700 rounded">
                                  {isExpanded ? (
                                    <FiChevronUp className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {household.householdHeadName || `Household ${household.id.slice(0, 6)}`}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    ID: {household.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <p className="text-foreground">{household.village || "N/A"}</p>
                                <p className="text-gray-400 text-xs">{household.subCounty || "N/A"}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-300">{household.schoolName || "N/A"}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-foreground">{stats.totalChildren}</span>
                                {stats.sharingCount > 0 && (
                                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                    {stats.sharingCount} shared
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1">
                                {stats.uniqueCount > 0 && (
                                  <span 
                                    className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full cursor-help"
                                    title={`${stats.uniqueCount} unique linked learner IDs`}
                                  >
                                    {stats.uniqueCount} unique
                                  </span>
                                )}
                                {stats.sharingCount > 0 && (
                                  <span 
                                    className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full cursor-help"
                                    title={`${stats.sharingCount} shared linked learner IDs`}
                                  >
                                    {stats.sharingCount} sharing
                                  </span>
                                )}
                                {stats.noIdCount > 0 && (
                                  <span 
                                    className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full cursor-help"
                                    title={`${stats.noIdCount} children without linked learner IDs`}
                                  >
                                    {stats.noIdCount} no ID
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleHousehold(household.id)}
                                className="px-3 py-1 text-sm rounded-lg bg-background-lighter hover:bg-gray-700 text-gray-300 transition-colors"
                              >
                                {isExpanded ? "Hide Children" : "Show Children"}
                              </button>
                            </td>
                          </tr>
                          
                          {/* Expanded Children Details */}
                          {isExpanded && household.children && household.children.length > 0 && (
                            <tr className="bg-background-lighter/50">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="pl-8">
                                  <h4 className="font-medium text-foreground mb-3">Children in Household</h4>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                      <thead>
                                        <tr className="border-b border-gray-600/50">
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Select</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Child Name (Household)</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Age</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Gender</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Grade</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Linked Learner ID</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Status</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Student Name (Database)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {household.children.map((child, index) => {
                                          const status = linkedLearnerStatus[household.id]?.[index] || { 
                                            status: "no_id",
                                            studentExistsInCollection: false 
                                          };
                                          const isSelected = status.isSelectedForDeletion || false;
                                          
                                          return (
                                            <tr key={index} className={`border-b border-gray-600/30 last:border-0 ${isSelected ? 'bg-red-500/10' : ''}`}>
                                              <td className="px-4 py-2">
                                                {status.status === "sharing" && (
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectionForDeletion(household.id, index)}
                                                    className="w-4 h-4 rounded border-gray-600 bg-background-lighter 
                                                             focus:ring-red-500 focus:ring-offset-background"
                                                  />
                                                )}
                                              </td>
                                              <td className="px-4 py-2 text-sm">
                                                <span className="font-medium text-foreground">
                                                  {child.firstName} {child.lastName}
                                                </span>
                                              </td>
                                              <td className="px-4 py-2 text-sm text-gray-300">{child.age || "N/A"}</td>
                                              <td className="px-4 py-2 text-sm text-gray-300">{child.gender || "N/A"}</td>
                                              <td className="px-4 py-2 text-sm text-gray-300">{child.grade || "N/A"}</td>
                                              <td className="px-4 py-2 text-sm">
                                                <code className="px-2 py-1 bg-gray-800 rounded text-xs">
                                                  {child.linkedLearnerId || "No ID"}
                                                </code>
                                              </td>
                                              <td className="px-4 py-2">
                                                {status.status === "unique" && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                    <FiUserCheck className="w-3 h-3" />
                                                    Unique
                                                  </span>
                                                )}
                                                {status.status === "sharing" && (
                                                  <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 
                                                      bg-red-500/20 text-red-400 text-xs rounded-full">
                                                      <FiUserX className="w-3 h-3" />
                                                      Shared with {status.sharedWith?.length || 0} other household(s)
                                                    </span>
                                                    {status.sharedWith && status.sharedWith.length > 0 && (
                                                      <div className="mt-1">
                                                        <details className="text-xs text-gray-400">
                                                          <summary className="cursor-pointer hover:text-gray-300">
                                                            View sharing details
                                                          </summary>
                                                          <ul className="mt-1 pl-4 space-y-1">
                                                            {status.sharedWith.map((other, idx) => (
                                                              <li key={idx} className="flex items-center gap-2">
                                                                <span>• {other.householdName}</span>
                                                                <span className="text-gray-500">|</span>
                                                                <span>Child: {other.childName}</span>
                                                              </li>
                                                            ))}
                                                          </ul>
                                                        </details>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                                {status.status === "no_id" && (
                                                  <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                                                    No Linked ID
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-4 py-2">
                                                {status.studentExistsInCollection ? (
                                                  <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                      <FiUser className="w-3 h-3 text-blue-400" />
                                                      <span className="text-sm font-medium text-blue-300">
                                                        {status.studentName || "Unknown"}
                                                      </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                      Found in students collection
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-red-400">
                                                      Not found
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                      Not in students collection
                                                    </span>
                                                  </div>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="mt-6 p-4 bg-background-light rounded-2xl border border-gray-600">
            <h4 className="font-medium text-foreground mb-2">Status Legend</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-300">Unique: Linked learner ID is unique to this child</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-300">Sharing: Linked learner ID is shared with other household(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-300">In Students DB: Student exists in Firebase students collection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-300">Selected: Marked for deletion</span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Tip:</strong> The "Child Name (Household)" shows the name from survey data, 
                while "Student Name (Database)" shows the actual name from Firebase students collection. 
                Compare these to identify which duplicates to delete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}