'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  code: string; // short abbreviation
  color: string; // Tailwind color class
  industry: 'healthcare' | 'banking' | 'education' | 'government' | 'enterprise' | 'police' | 'insurance' | 'manufacturing' | 'legal';
}

interface WorkspaceContextType {
  activeWorkspace: Workspace;
  setActiveWorkspace: (workspace: Workspace) => void;
  workspaces: Workspace[];
}

const workspaces: Workspace[] = [
  {
    id: 'healthcare',
    name: 'MediCore Clinical EHR',
    description: 'HIPAA-compliant patient health records and diagnostics audit trails',
    code: 'MC',
    color: 'bg-teal-500',
    industry: 'healthcare',
  },
  {
    id: 'banking',
    name: 'FinTrust Banking Core',
    description: 'SWIFT wire transfers, client KYC dossiers, and AML ledger checks',
    code: 'FT',
    color: 'bg-emerald-500',
    industry: 'banking',
  },
  {
    id: 'education',
    name: 'EduTrack Student SIS',
    description: 'FERPA-compliant student transcripts, tuition fee receipts, and faculty grades ledger',
    code: 'ET',
    color: 'bg-blue-500',
    industry: 'education',
  },
  {
    id: 'government',
    name: 'GovCore Vital Registry',
    description: 'Civil land registry deeds, security clearances, and public procurement logs',
    code: 'GC',
    color: 'bg-indigo-500',
    industry: 'government',
  },
  {
    id: 'enterprise',
    name: 'Nexus Corp ERP Audits',
    description: 'Corporate SOX compliance, ERP invoices, and equity ledger records',
    code: 'NC',
    color: 'bg-purple-500',
    industry: 'enterprise',
  },
  {
    id: 'police',
    name: 'MetroPolice Case Logs',
    description: 'CJIS-compliant incident reports, evidence chain-of-custody, and warrants',
    code: 'MP',
    color: 'bg-rose-500',
    industry: 'police',
  },
  {
    id: 'insurance',
    name: 'Solvency Claims Ledger',
    description: 'Claim adjustment logs, underwriting guidelines, and policy declaration hashes',
    code: 'SL',
    color: 'bg-amber-500',
    industry: 'insurance',
  },
  {
    id: 'manufacturing',
    name: 'Apex MFG Quality Audit',
    description: 'ISO-9001 quality inspections, supply chain manifests, and CNC calibration logs',
    code: 'AM',
    color: 'bg-orange-500',
    industry: 'manufacturing',
  },
  {
    id: 'legal',
    name: 'LexTrust Legal Ledger',
    description: 'NDA registry, litigation filing hashes, and trust ledger audits',
    code: 'LT',
    color: 'bg-slate-500',
    industry: 'legal',
  },
];

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace>(workspaces[0]);

  // Load from localStorage on client-side mount
  useEffect(() => {
    const saved = localStorage.getItem('sentinel_active_workspace');
    if (saved) {
      const parsed = workspaces.find((w) => w.id === saved);
      if (parsed) {
        setActiveWorkspaceState(parsed);
      }
    }
  }, []);

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    localStorage.setItem('sentinel_active_workspace', workspace.id);
    
    // Invalidate queries or refresh window so Next.js API re-evaluates the active industry context
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <WorkspaceContext.Provider value={{ activeWorkspace, setActiveWorkspace, workspaces }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
  }
  return context;
}
