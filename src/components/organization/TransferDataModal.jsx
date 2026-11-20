"use client";

import { useEffect, useState } from "react";
import { useDataTransfer } from "@/hooks/useDataTransfer";

const STEPS = {
  CONFIRM_SANDBOX: "confirm-sandbox",
  SELECT_TYPE: "select-type",
  SELECT_ITEM: "select-item",
  CONFIRM: "confirm",
  RESULT: "result",
};

export default function TransferDataModal({ open, onClose, sourceOrg }) {
  const { loading, error, progress, verifySandbox, fetchProjects, fetchSchools, fetchStudents, transferData } =
    useDataTransfer();

  const [step, setStep] = useState(STEPS.CONFIRM_SANDBOX);
  const [sandbox, setSandbox] = useState(null);
  const [sandboxError, setSandboxError] = useState(null);
  const [dataType, setDataType] = useState("project");
  const [projects, setProjects] = useState([]);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [result, setResult] = useState(null);

  const resetState = () => {
    setStep(STEPS.CONFIRM_SANDBOX);
    setSandbox(null);
    setSandboxError(null);
    setDataType("project");
    setProjects([]);
    setSchools([]);
    setStudents([]);
    setSelectedProjectId("");
    setSelectedSchoolId("");
    setSelectedStudentId("");
    setResult(null);
  };

  // Reset whenever the modal is (re)opened for a (possibly different) org
  useEffect(() => {
    if (open) resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sourceOrg?.id]);

  useEffect(() => {
    if (!open || !sourceOrg?.sandboxId) return;
    verifySandbox(sourceOrg.sandboxId)
      .then(setSandbox)
      .catch((err) => setSandboxError(err.message));
  }, [open, sourceOrg?.sandboxId, verifySandbox]);

  useEffect(() => {
    if (step !== STEPS.SELECT_ITEM || !sourceOrg?.id) return;
    fetchProjects(sourceOrg.id)
      .then(setProjects)
      .catch((err) => setSandboxError(err.message));
  }, [step, sourceOrg?.id, fetchProjects]);

  useEffect(() => {
    if (!selectedProjectId || dataType === "project") {
      setSchools([]);
      return;
    }
    fetchSchools(sourceOrg.id, selectedProjectId).then(setSchools).catch(() => {});
  }, [selectedProjectId, dataType, sourceOrg?.id, fetchSchools]);

  useEffect(() => {
    if (!selectedSchoolId || dataType !== "student") {
      setStudents([]);
      return;
    }
    fetchStudents(sourceOrg.id, selectedProjectId, selectedSchoolId).then(setStudents).catch(() => {});
  }, [selectedSchoolId, dataType, sourceOrg?.id, selectedProjectId, fetchStudents]);

  if (!open) return null;

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleTransfer = async () => {
    try {
      await transferData({
        sourceOrgId: sourceOrg.id,
        sandboxId: sandbox.id,
        dataType,
        projectId: selectedProjectId,
        schoolId: selectedSchoolId || null,
        studentId: selectedStudentId || null,
      });
      setResult({ ok: true });
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setStep(STEPS.RESULT);
    }
  };

  const canProceedToConfirm =
    dataType === "project"
      ? !!selectedProjectId
      : dataType === "school"
      ? !!selectedProjectId && !!selectedSchoolId
      : !!selectedProjectId && !!selectedSchoolId && !!selectedStudentId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full max-w-lg bg-background-light rounded-3xl p-6 shadow-2xl border border-background-lighter">
        <h2 className="text-base font-bold text-foreground mb-5">Transfer Data to Sandbox</h2>

        {step === STEPS.CONFIRM_SANDBOX && (
          <div>
            {sandboxError && <p className="text-sm text-red-400 mb-4">{sandboxError}</p>}
            {!sandboxError && !sandbox && (
              <p className="text-sm text-gray-400">Looking up linked sandbox...</p>
            )}
            {sandbox && (
              <>
                <p className="text-sm text-gray-300 mb-6">
                  This will copy data from{" "}
                  <span className="font-semibold text-foreground">{sourceOrg.name}</span> into its
                  sandbox <span className="font-semibold text-foreground">{sandbox.name}</span>.
                  Please confirm this is correct.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-foreground hover:bg-background-lighter transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep(STEPS.SELECT_TYPE)}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary-3 text-primary-1 hover:bg-yellow-400 transition-all"
                  >
                    Yes, that's the right sandbox
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === STEPS.SELECT_TYPE && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-3">What do you want to transfer?</p>
            <div className="space-y-2 mb-6">
              {[
                ["project", "Entire Project", "Copies the project and every school and student inside it."],
                ["school", "A School", "Copies one school and its students."],
                ["student", "A Student", "Copies a single student."],
              ].map(([value, label, desc]) => (
                <label
                  key={value}
                  className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                    dataType === value
                      ? "border-primary-3 bg-primary-3/10"
                      : "border-gray-600 bg-background-lighter"
                  }`}
                >
                  <input
                    type="radio"
                    name="dataType"
                    value={value}
                    checked={dataType === value}
                    onChange={() => setDataType(value)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <p className="text-xs text-gray-400 mt-1 ml-5">{desc}</p>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-foreground hover:bg-background-lighter transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(STEPS.SELECT_ITEM)}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary-3 text-primary-1 hover:bg-yellow-400 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === STEPS.SELECT_ITEM && (
          <div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-400 mb-2">Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedSchoolId("");
                  setSelectedStudentId("");
                }}
                className="w-full px-4 py-3 bg-background-lighter border border-gray-600 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3"
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.id}
                  </option>
                ))}
              </select>
              {selectedProjectId && projects.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No projects found for this organization.</p>
              )}
            </div>

            {dataType !== "project" && selectedProjectId && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 mb-2">School</label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => {
                    setSelectedSchoolId(e.target.value);
                    setSelectedStudentId("");
                  }}
                  className="w-full px-4 py-3 bg-background-lighter border border-gray-600 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3"
                >
                  <option value="">Select a school</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {dataType === "student" && selectedSchoolId && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 mb-2">Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-3 bg-background-lighter border border-gray-600 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3"
                >
                  <option value="">Select a student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setStep(STEPS.SELECT_TYPE)}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-foreground hover:bg-background-lighter transition-colors"
              >
                Back
              </button>
              <button
                disabled={!canProceedToConfirm}
                onClick={() => setStep(STEPS.CONFIRM)}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary-3 text-primary-1 hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === STEPS.CONFIRM && (
          <div>
            <p className="text-sm text-gray-300 mb-6">
              You're about to copy the selected {dataType} from{" "}
              <span className="font-semibold text-foreground">{sourceOrg.name}</span> into{" "}
              <span className="font-semibold text-foreground">{sandbox.name}</span>. Existing data at
              the destination with the same IDs will be overwritten.
            </p>
            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
            {loading && <p className="text-sm text-gray-400 mb-4">{progress}</p>}
            <div className="flex justify-end gap-3">
              <button
                disabled={loading}
                onClick={() => setStep(STEPS.SELECT_ITEM)}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-foreground hover:bg-background-lighter transition-colors disabled:opacity-40"
              >
                Back
              </button>
              <button
                disabled={loading}
                onClick={handleTransfer}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary-3 text-primary-1 hover:bg-yellow-400 transition-all disabled:opacity-40"
              >
                {loading ? "Transferring..." : "Transfer"}
              </button>
            </div>
          </div>
        )}

        {step === STEPS.RESULT && (
          <div>
            <p className={`text-sm mb-6 ${result?.ok ? "text-green-400" : "text-red-400"}`}>
              {result?.ok ? "Transfer completed successfully." : `Transfer failed: ${result?.message}`}
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary-3 text-primary-1 hover:bg-yellow-400 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}