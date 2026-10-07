"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Portal from "@/components/ui/Portal";

export default function AssignmentMenu({ triggerRef, orgs, onUnassign, onClose }) {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setStyle({ top: rect.bottom + 4, left: rect.left, width: 260 });
    }
  }, [triggerRef]);

  return (
    <Portal>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div className="fixed z-[9999] bg-background-light border border-gray-600 rounded-xl shadow-lg p-2" style={style}>
        <p className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1">Assigned to</p>
        {orgs.map((o) => (
          <div key={o.orgId} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-background-lighter">
            <span className="text-sm text-foreground truncate">{o.orgName}</span>
            <button onClick={() => { onUnassign(o.orgId, o.orgName); onClose(); }} className="text-amber-400 hover:text-amber-300" title={`Unassign from ${o.orgName}`}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Portal>
  );
}