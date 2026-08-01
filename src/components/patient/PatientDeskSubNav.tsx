import React from 'react';
import {
  Users,
  ListOrdered,
  UserPlus,
  Ticket,
  Stethoscope,
  LayoutGrid,
  CalendarPlus,
  AlertCircle
} from 'lucide-react';
import { User } from '../../types';

export type PatientDeskSubTab =
  | 'queue'
  | 'register'
  | 'token_issue'
  | 'book'
  | 'patient_visit'
  | 'grid_view'
  | 'status';

interface PatientDeskSubNavProps {
  activeSubTab: PatientDeskSubTab;
  setActiveSubTab: (tab: PatientDeskSubTab) => void;
  canAccessQueue: boolean;
  canAccessRegister: boolean;
  canAccessTokenIssue: boolean;
  canAccessPatientVisit: boolean;
  canAccessGridView: boolean;
  canAccessAppointments: boolean;
  canAccessLargeScreen: boolean;
  currentUser?: User;
}

export default function PatientDeskSubNav({
  activeSubTab,
  setActiveSubTab,
  canAccessQueue,
  canAccessRegister,
  canAccessTokenIssue,
  canAccessPatientVisit,
  canAccessGridView,
  canAccessAppointments,
  canAccessLargeScreen,
  currentUser
}: PatientDeskSubNavProps) {
  const isAllRestricted =
    !canAccessQueue &&
    !canAccessRegister &&
    !canAccessTokenIssue &&
    !canAccessPatientVisit &&
    !canAccessGridView &&
    !canAccessAppointments &&
    !canAccessLargeScreen;

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-2 border-b border-slate-200/80 pb-2">
        {/* Sub Navigation */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-200/60 p-1 rounded-lg border border-slate-200 print:hidden shrink-0">
          {canAccessQueue && (
            <button
              onClick={() => setActiveSubTab('queue')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'queue' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Waiting Queue</span>
            </button>
          )}

          {canAccessRegister && (
            <button
              onClick={() => setActiveSubTab('register')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'register' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registration Form</span>
            </button>
          )}

          {canAccessTokenIssue && (
            <button
              onClick={() => setActiveSubTab('token_issue')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'token_issue' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-600" />
              <span>Token Issue</span>
            </button>
          )}

          {canAccessPatientVisit && (
            <button
              onClick={() => setActiveSubTab('patient_visit')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'patient_visit' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
              <span>Patient Visit</span>
            </button>
          )}

          {canAccessGridView && (
            <button
              onClick={() => setActiveSubTab('grid_view')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'grid_view' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              <span>Grid-View</span>
            </button>
          )}

          {canAccessAppointments && (
            <button
              onClick={() => setActiveSubTab('book')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'book' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          )}

          {canAccessLargeScreen && (
            <button
              onClick={() => setActiveSubTab('status')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'status' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Large Screen Display</span>
            </button>
          )}
        </div>
      </div>

      {isAllRestricted && (
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-rose-900 text-center space-y-3 my-6 animate-fadeIn">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <div>
            <h3 className="text-base font-extrabold text-rose-950">Sub-Desk Access Restricted</h3>
            <p className="text-xs text-rose-800 mt-1 max-w-md mx-auto">
              Your account <strong>({currentUser?.FullName || currentUser?.LoginName})</strong> does not have permission to access any sub-modules inside Patient Desk.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
