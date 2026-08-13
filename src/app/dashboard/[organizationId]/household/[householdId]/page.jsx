"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import DashboardLayout from "../../DashboardLayout";
import { useHouseholdDetails } from "@/hooks/useHouseholdDetails";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Trash2, Plus } from "lucide-react";

export default function HouseholdDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const organizationId = params.organizationId;
  const householdId = params.householdId;
  const projectId = searchParams.get("projectId");
  const schoolId = searchParams.get("schoolId");

  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role;
  const allowedEditRoles = ["admin", "super_admin", "project_manager"];
  const canEdit = allowedEditRoles.includes(userRole);

  const { household, loading, error, refetchHousehold } = useHouseholdDetails(
    organizationId,
    householdId,
    projectId,
    schoolId
  );

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [newParent, setNewParent] = useState(null);
  const [newChild, setNewChild] = useState(null);

  useEffect(() => {
    if (household) {
      setFormData(JSON.parse(JSON.stringify(household)));
      setNewParent(null);
      setNewChild(null);
    }
  }, [household]);

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // --- Handlers ---

  const handleInputChange = (e, field) => {
    const { value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleNestedChange = (e, parentKey, childKey) => {
    const { value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [parentKey]: { ...prev[parentKey], [childKey]: val },
    }));
  };

  const handleArrayItemChange = (arrayKey, index, field, value) => {
    setFormData((prev) => {
      const newArray = [...(prev[arrayKey] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayKey]: newArray };
    });
  };

  // ----- CHILDREN (top‑level) -----
  const handleChildItemChange = (index, field, value) => {
    setFormData((prev) => {
      const children = [...(prev.children || [])];
      children[index] = { ...children[index], [field]: value };
      return { ...prev, children };
    });
  };

  const deleteChild = (index) => {
    if (!confirm("Remove this child?")) return;
    setFormData((prev) => {
      const children = [...(prev.children || [])];
      children.splice(index, 1);
      return { ...prev, children };
    });
  };

  const addChild = () => {
    setNewChild({
      firstName: "",
      lastName: "",
      age: "",
      gender: "",
      linkedLearnerId: "",
      livesWith: "",
    });
  };

  const saveNewChild = () => {
    if (!newChild.firstName.trim() || !newChild.lastName.trim()) {
      alert("Please enter first and last name");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      children: [...(prev.children || []), newChild],
    }));
    setNewChild(null);
  };

  const cancelNewChild = () => setNewChild(null);

  // ----- PARENTS (top‑level) -----
  const deleteParent = (index) => {
    if (!confirm("Remove this parent/guardian?")) return;
    setFormData((prev) => {
      const newParents = [...(prev.parents || [])];
      newParents.splice(index, 1);
      return { ...prev, parents: newParents };
    });
  };

  const addParent = () => {
    setNewParent({
      name: "",
      age: "",
      type: "",
      relationshipToHead: "",
      highestEducationLevel: "",
      hasAttendedSchool: false,
    });
  };

  const saveNewParent = () => {
    if (!newParent.name.trim()) {
      alert("Please enter a name");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      parents: [...(prev.parents || []), newParent],
    }));
    setNewParent(null);
  };

  const cancelNewParent = () => setNewParent(null);

  // ----- Assets -----
  const handleAssetsChange = (e) => {
    const raw = e.target.value;
    const items = raw.split(",").map((s) => s.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, householdAssets: items }));
  };

  // ----- Save -----
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const householdRef = doc(
        db,
        `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/households/${householdId}`
      );
      const { id, ...updateData } = formData;
      await updateDoc(householdRef, updateData);
      await refetchHousehold();
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating household:", err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(JSON.parse(JSON.stringify(household)));
    setIsEditing(false);
    setSaveError(null);
    setNewParent(null);
    setNewChild(null);
  };

  // --- Loading / Error ---
  if (loading) {
    return (
      <div className="flex h-screen bg-background justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2"></div>
          <span className="text-foreground">Loading household details...</span>
        </div>
      </div>
    );
  }

  if (error || !household || !formData) {
    return (
      <div className="flex h-screen bg-background justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-secondary-1 mb-2">
            {error ? "Error Loading Data" : "Household Not Found"}
          </h2>
          <p className="text-foreground">
            {error ? error.message : "The requested household could not be found."}
          </p>
        </div>
      </div>
    );
  }

  // --- Helpers for rendering fields ---
  const renderField = (label, field, type = "text", options = {}) => {
    const value = formData[field] ?? "";
    const inputProps = {
      id: field,
      name: field,
      type,
      value: type === "checkbox" ? undefined : value,
      checked: type === "checkbox" ? !!value : undefined,
      onChange: (e) => handleInputChange(e, field),
      className:
        "w-full px-3 py-2 border border-gray-500 rounded-lg bg-background-light text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3",
      disabled: saving,
      ...options,
    };

    return (
      <div>
        <label htmlFor={field} className="text-sm font-medium text-gray-300 block mb-1">
          {label}
        </label>
        {isEditing ? (
          type === "checkbox" ? (
            <input {...inputProps} type="checkbox" className="h-5 w-5 rounded border-gray-500 bg-background-light text-primary-3 focus:ring-primary-3" />
          ) : (
            <input {...inputProps} />
          )
        ) : (
          // Display value: for booleans show "Yes"/"No", otherwise show value or "N/A"
          <p className="text-foreground">
            {type === "checkbox" ? (value ? "Yes" : "No") : value || "N/A"}
          </p>
        )}
      </div>
    );
  };

  const renderNestedField = (label, parentKey, childKey, type = "text") => {
    const value = formData[parentKey]?.[childKey] ?? "";
    const inputProps = {
      id: `${parentKey}-${childKey}`,
      name: `${parentKey}-${childKey}`,
      type,
      value: type === "checkbox" ? undefined : value,
      checked: type === "checkbox" ? !!value : undefined,
      onChange: (e) => handleNestedChange(e, parentKey, childKey),
      className:
        "w-full px-3 py-2 border border-gray-500 rounded-lg bg-background-light text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3",
      disabled: saving,
    };

    return (
      <div>
        <label htmlFor={`${parentKey}-${childKey}`} className="text-sm font-medium text-gray-300 block mb-1">
          {label}
        </label>
        {isEditing ? (
          type === "checkbox" ? (
            <input {...inputProps} type="checkbox" className="h-5 w-5 rounded border-gray-500 bg-background-light text-primary-3 focus:ring-primary-3" />
          ) : (
            <input {...inputProps} />
          )
        ) : (
          <p className="text-foreground">
            {type === "checkbox" ? (value ? "Yes" : "No") : value || "N/A"}
          </p>
        )}
      </div>
    );
  };

  // --- Main JSX ---
  return (
    <DashboardLayout title="Household Details" organizationId={organizationId} currentSection={"survey"}>
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {household.householdHeadName}
              </h1>
              <p className="text-sm text-gray-300 mt-1">
                Household ID: {household.id} • Interviewed on {formatDate(household.interviewDate)} by {household.interviewerName}
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center gap-3">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  household.consentGiven
                    ? "bg-secondary-2/20 text-secondary-2"
                    : "bg-secondary-1/20 text-secondary-1"
                }`}
              >
                {household.consentGiven ? "Consent Given" : "No Consent"}
              </span>
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-primary-3 text-white rounded-lg hover:bg-primary-4 transition-colors text-sm font-medium"
                >
                  Edit
                </button>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
          </div>
          {saveError && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              Error saving: {saveError}
            </div>
          )}
        </div>

        {/* Household Information */}
        <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Household Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Show county only if editing OR data exists */}
            {(isEditing || formData.county) && renderField("County", "county")}
            {renderField("Household Head", "householdHead", "checkbox")}
            {renderField("Household Head Phone", "householdHeadPhone")}
            {renderField("Total Members", "householdMembersCount", "number")}
            <div className="md:col-span-2">{renderField("Income Source", "incomeSource")}</div>
            <div className="md:col-span-2">{renderField("Main Language", "mainLanguage")}</div>
            <div className="md:col-span-2">{renderField("Marital Status", "maritalStatus")}</div>
            <div className="md:col-span-2">{renderField("Has Electricity", "hasElectricity", "checkbox")}</div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-300 block mb-1">Household Assets</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.householdAssets?.join(", ") || ""}
                  onChange={handleAssetsChange}
                  className="w-full px-3 py-2 border border-gray-500 rounded-lg bg-background-light text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3"
                  placeholder="Enter assets separated by commas"
                  disabled={saving}
                />
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.householdAssets?.length > 0 ? (
                    formData.householdAssets.map((asset, idx) => (
                      <span key={idx} className="inline-flex px-2 py-1 text-xs bg-background-light text-foreground rounded border border-gray-600">
                        {asset}
                      </span>
                    ))
                  ) : (
                    <p className="text-foreground">N/A</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Parents / Guardians - unchanged */}
        <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Parents / Guardians</h2>
            {isEditing && (
              <button
                onClick={addParent}
                className="px-3 py-1 bg-primary-3 text-white rounded-lg hover:bg-primary-4 transition-colors text-sm flex items-center gap-1"
                disabled={saving}
              >
                <Plus size={16} /> Add Parent
              </button>
            )}
          </div>
          {/* new parent form and list - same as before */}
          {newParent && isEditing && (
            <div className="border border-blue-500 rounded-lg p-4 mb-4 bg-background-light">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Name *" value={newParent.name} onChange={(e) => setNewParent({ ...newParent, name: e.target.value })} className="px-3 py-2 border border-gray-500 rounded bg-background-light text-foreground" />
                <input type="text" placeholder="Age" value={newParent.age} onChange={(e) => setNewParent({ ...newParent, age: e.target.value })} className="px-3 py-2 border border-gray-500 rounded bg-background-light text-foreground" />
                <input type="text" placeholder="Type (e.g., Mother, Father)" value={newParent.type} onChange={(e) => setNewParent({ ...newParent, type: e.target.value })} className="px-3 py-2 border border-gray-500 rounded bg-background-light text-foreground" />
                <input type="text" placeholder="Relationship to Head" value={newParent.relationshipToHead} onChange={(e) => setNewParent({ ...newParent, relationshipToHead: e.target.value })} className="px-3 py-2 border border-gray-500 rounded bg-background-light text-foreground" />
                <input type="text" placeholder="Highest Education" value={newParent.highestEducationLevel} onChange={(e) => setNewParent({ ...newParent, highestEducationLevel: e.target.value })} className="px-3 py-2 border border-gray-500 rounded bg-background-light text-foreground" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={newParent.hasAttendedSchool} onChange={(e) => setNewParent({ ...newParent, hasAttendedSchool: e.target.checked })} className="h-5 w-5 rounded border-gray-500 bg-background-light text-primary-3" />
                  <label className="text-sm text-gray-300">Attended School</label>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={saveNewParent} className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">Save</button>
                <button onClick={cancelNewParent} className="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">Cancel</button>
              </div>
            </div>
          )}

          {formData.parents && formData.parents.length > 0 ? (
            <div className="space-y-4">
              {formData.parents.map((parent, index) => (
                <div key={index} className="border border-gray-600 rounded-lg p-4 bg-background-light relative">
                  {isEditing && (
                    <button onClick={() => deleteParent(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-300" disabled={saving}>
                      <Trash2 size={18} />
                    </button>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    {isEditing ? (
                      <input type="text" value={parent.name} onChange={(e) => handleArrayItemChange("parents", index, "name", e.target.value)} className="flex-1 mr-2 px-3 py-1 border border-gray-500 rounded bg-background-light text-foreground" disabled={saving} />
                    ) : (
                      <h3 className="text-sm font-semibold text-foreground">{parent.name}</h3>
                    )}
                    <span className="text-xs text-gray-300 mt-1 sm:mt-0">({parent.type})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-300">Age</p>
                      {isEditing ? (
                        <input type="text" value={parent.age} onChange={(e) => handleArrayItemChange("parents", index, "age", e.target.value)} className="w-full px-3 py-1 border border-gray-500 rounded bg-background-light text-foreground" disabled={saving} />
                      ) : (
                        <p className="text-foreground">{parent.age}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-300">Relationship to Head</p>
                      {isEditing ? (
                        <input type="text" value={parent.relationshipToHead || ""} onChange={(e) => handleArrayItemChange("parents", index, "relationshipToHead", e.target.value)} className="w-full px-3 py-1 border border-gray-500 rounded bg-background-light text-foreground" disabled={saving} />
                      ) : (
                        <p className="text-foreground">{parent.relationshipToHead || "N/A"}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-300">Highest Education</p>
                      {isEditing ? (
                        <input type="text" value={parent.highestEducationLevel || ""} onChange={(e) => handleArrayItemChange("parents", index, "highestEducationLevel", e.target.value)} className="w-full px-3 py-1 border border-gray-500 rounded bg-background-light text-foreground" disabled={saving} />
                      ) : (
                        <p className="text-foreground">{parent.highestEducationLevel || "N/A"}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-300">Attended School</p>
                      {isEditing ? (
                        <input type="checkbox" checked={parent.hasAttendedSchool || false} onChange={(e) => handleArrayItemChange("parents", index, "hasAttendedSchool", e.target.checked)} className="h-5 w-5 rounded border-gray-500 bg-background-light text-primary-3" disabled={saving} />
                      ) : (
                        <p className="text-foreground">{parent.hasAttendedSchool ? "Yes" : "No"}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No parents/guardians recorded.</p>
          )}
        </div>

        {/* Children (top‑level) - unchanged except using formData.children */}
        <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Children</h2>
            {isEditing && (
              <button onClick={addChild} className="px-3 py-1 bg-primary-3 text-white rounded-lg hover:bg-primary-4 transition-colors text-sm flex items-center gap-1" disabled={saving}>
                <Plus size={16} /> Add Child
              </button>
            )}
          </div>

          {newChild && isEditing && (
            <div className="border border-blue-500 rounded-lg p-4 mb-4 bg-background-light">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="First Name *" value={newChild.firstName} onChange={(e) => setNewChild({ ...newChild, firstName: e.target.value })} className="px-3 py-2 border border-gray-500 rounded bg-background-light text-foreground" />
                <input type="text" placeholder="Last Name *" value={newChild.lastName} onChange={(e) => setNewChild({ ...newChild, lastName: e.target.value })} className="px-3 py-2 border border-gray-500 rounded bg-background-light text-foreground" />
                <input type="text" placeholder="Age" value={newChild.age} onChange={(e) => setNewChild({ ...newChild, age: e.target.value })} className="px-3 py-2 border border-gray-500 rounded bg-background-light text-foreground" />
                <input type="text" placeholder="Gender (Male/Female)" value={newChild.gender} onChange={(e) => setNewChild({ ...newChild, gender: e.target.value })} className="px-3 py-2 border border-gray-500 rounded bg-background-light text-foreground" />
                <input type="text" placeholder="Linked Learner ID" value={newChild.linkedLearnerId} onChange={(e) => setNewChild({ ...newChild, linkedLearnerId: e.target.value })} className="px-3 py-2 border border-gray-500 rounded bg-background-light text-foreground" />
                <input type="text" placeholder="Lives With" value={newChild.livesWith} onChange={(e) => setNewChild({ ...newChild, livesWith: e.target.value })} className="px-3 py-2 border border-gray-500 rounded bg-background-light text-foreground" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={saveNewChild} className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">Save</button>
                <button onClick={cancelNewChild} className="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">Cancel</button>
              </div>
            </div>
          )}

          {formData.children && formData.children.length > 0 ? (
            <div className="space-y-4">
              {formData.children.map((child, index) => (
                <div key={index} className="border border-gray-600 rounded-lg p-4 bg-background-light relative">
                  {isEditing && (
                    <button onClick={() => deleteChild(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-300" disabled={saving}>
                      <Trash2 size={18} />
                    </button>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2 w-full">
                        <input type="text" placeholder="First name" value={child.firstName || ""} onChange={(e) => handleChildItemChange(index, "firstName", e.target.value)} className="flex-1 min-w-[100px] px-3 py-1 border border-gray-500 rounded bg-background-light text-foreground" disabled={saving} />
                        <input type="text" placeholder="Last name" value={child.lastName || ""} onChange={(e) => handleChildItemChange(index, "lastName", e.target.value)} className="flex-1 min-w-[100px] px-3 py-1 border border-gray-500 rounded bg-background-light text-foreground" disabled={saving} />
                      </div>
                    ) : (
                      <h3 className="text-sm font-semibold text-foreground">{child.firstName} {child.lastName}</h3>
                    )}
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      {isEditing ? (
                        <input type="text" value={child.gender || ""} onChange={(e) => handleChildItemChange(index, "gender", e.target.value)} className="px-2 py-1 border border-gray-500 rounded bg-background-light text-foreground text-xs w-24" placeholder="Gender" disabled={saving} />
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded-full ${child.gender === "Female" ? "bg-primary-2/20 text-primary-2" : "bg-primary-3/20 text-primary-3"}`}>{child.gender}</span>
                      )}
                      {isEditing ? (
                        <input type="text" value={child.age || ""} onChange={(e) => handleChildItemChange(index, "age", e.target.value)} className="w-16 px-2 py-1 border border-gray-500 rounded bg-background-light text-foreground text-xs" placeholder="Age" disabled={saving} />
                      ) : (
                        <span className="text-xs text-gray-300">Age: {child.age}</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-300">Linked Learner ID</p>
                      {isEditing ? (
                        <input type="text" value={child.linkedLearnerId || ""} onChange={(e) => handleChildItemChange(index, "linkedLearnerId", e.target.value)} className="w-full px-3 py-1 border border-gray-500 rounded bg-background-light text-foreground" disabled={saving} />
                      ) : (
                        <p className="text-foreground">{child.linkedLearnerId || "N/A"}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-300">Lives With</p>
                      {isEditing ? (
                        <input type="text" value={child.livesWith || ""} onChange={(e) => handleChildItemChange(index, "livesWith", e.target.value)} className="w-full px-3 py-1 border border-gray-500 rounded bg-background-light text-foreground" disabled={saving} />
                      ) : (
                        <p className="text-foreground">{child.livesWith || "N/A"}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No children recorded.</p>
          )}
        </div>

        {/* Parental Engagement */}
        {formData.parentalEngagement && (
          <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Parental Engagement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {renderNestedField("Has School-Age Child", "parentalEngagement", "hasSchoolAgeChild", "checkbox")}
              {renderNestedField("Attends School Meetings", "parentalEngagement", "attendsSchoolMeetings", "checkbox")}
              {renderNestedField("Monitors Attendance", "parentalEngagement", "monitorsAttendance", "checkbox")}
              {renderNestedField("Homework Helper", "parentalEngagement", "homeworkHelper")}
              <div className="md:col-span-2">
                {renderNestedField("Teacher Discussion Frequency", "parentalEngagement", "teacherDiscussionFrequency")}
              </div>
            </div>
          </div>
        )}

        {/* Child Learning Environment */}
        {formData.childLearningEnvironment && (
          <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Child Learning Environment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {renderNestedField("Has Books or Materials", "childLearningEnvironment", "hasBooksOrMaterials", "checkbox")}
              {renderNestedField("Has Quiet Place to Study", "childLearningEnvironment", "hasQuietPlaceToStudy", "checkbox")}
              {renderNestedField("Missed School Last Month", "childLearningEnvironment", "missedSchoolLastMonth", "checkbox")}
              <div className="md:col-span-2">
                {renderNestedField("Reason for Missing School", "childLearningEnvironment", "reasonForMissingSchool")}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}