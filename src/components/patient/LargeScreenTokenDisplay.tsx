import React from 'react';
import { Users } from 'lucide-react';
import { Token, Patient } from '../../types';

interface LargeScreenTokenDisplayProps {
  tokens: Token[];
  patients: Patient[];
  fullscreenShift: 'both' | 'morning' | 'evening';
  setFullscreenShift: (shift: 'both' | 'morning' | 'evening') => void;
  isFullScreenMode: boolean;
  setIsFullScreenMode: (val: boolean) => void;
}

export default function LargeScreenTokenDisplay({
  tokens,
  patients,
  fullscreenShift,
  setFullscreenShift,
  isFullScreenMode,
  setIsFullScreenMode
}: LargeScreenTokenDisplayProps) {
  const getPatientName = (patientId: string): string => {
    if (!patientId) return 'Unknown Patient';
    const match = patients.find((p) => p.PatientID === patientId);
    return match ? match.PatientName : `Patient (${patientId})`;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Quick controls panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">LCD Shift Filter:</span>
            <div className="inline-flex rounded-lg border border-slate-800 p-0.5 bg-slate-950">
              <button
                type="button"
                onClick={() => setFullscreenShift('both')}
                className={`px-3 py-1 text-xxs font-extrabold uppercase rounded transition cursor-pointer ${
                  fullscreenShift === 'both' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Both Shifts
              </button>
              <button
                type="button"
                onClick={() => setFullscreenShift('morning')}
                className={`px-3 py-1 text-xxs font-extrabold uppercase rounded transition cursor-pointer ${
                  fullscreenShift === 'morning' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Morning Only
              </button>
              <button
                type="button"
                onClick={() => setFullscreenShift('evening')}
                className={`px-3 py-1 text-xxs font-extrabold uppercase rounded transition cursor-pointer ${
                  fullscreenShift === 'evening' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Evening Only
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsFullScreenMode(true);
              const container = document.getElementById('patients-large-screen-container');
              if (container && container.requestFullscreen) {
                container.requestFullscreen().catch(() => {});
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-lg flex items-center justify-center shadow-lg transition cursor-pointer"
          >
            <Users className="w-4 h-4 mr-2" />
            Go Full LCD Screen Mode
          </button>
        </div>

        <div className="bg-slate-950 text-white p-8 rounded-2xl border-4 border-slate-800 shadow-2xl space-y-6 animate-fadeIn" id="patients-large-screen-container">
          {/* Header for TV screen */}
          <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-emerald-400 font-sans uppercase animate-pulse">PCMS OPD Live Queue Display</h1>
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase mt-1">Please watch the screen for your Token number. Kindly keep your receipts ready.</p>
            </div>
            <div className="text-right">
              <span className="text-sm md:text-lg font-mono font-bold bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-emerald-400">
                Live Server Clock: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Shift Grid */}
          <div className="grid grid-cols-1 gap-8" style={{
            gridTemplateColumns: fullscreenShift === 'both' ? 'repeat(2, minmax(0, 1fr))' : '1fr'
          }}>
            {/* Morning Shift Column */}
            {(fullscreenShift === 'both' || fullscreenShift === 'morning') && (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-base font-black tracking-wide text-amber-500 uppercase">Morning Shift (08:30 - 12:30)</span>
                  <span className="text-xxs bg-slate-800 text-slate-300 font-bold px-2.5 py-1 rounded">
                    {tokens.filter(t => t.Shift === 1 && t.Status === 1).length} Patients Remaining
                  </span>
                </div>

                {/* Currently Consulting */}
                <div className="bg-slate-950 p-5 rounded-xl border-2 border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bg-emerald-500 text-slate-950 font-black text-[9px] tracking-widest px-3 py-1 uppercase">CURRENTLY IN ASSESSMENT</div>
                  {tokens.filter(t => t.Shift === 1 && t.Status === 2).length === 0 ? (
                    <div className="py-6">
                      <span className="text-2xl font-black text-slate-600 font-mono">-- NONE --</span>
                      <p className="text-xxs text-slate-500 font-semibold mt-1">Doctor ready for next token...</p>
                    </div>
                  ) : (
                    <div className="py-4 space-y-1">
                      <span className="text-5xl font-black text-emerald-400 font-mono tracking-wider animate-bounce block">
                        #{tokens.filter(t => t.Shift === 1 && t.Status === 2).map(t => t.TokenNo).pop()}
                      </span>
                      <span className="text-sm font-extrabold text-slate-200 uppercase block">
                        {getPatientName(tokens.filter(t => t.Shift === 1 && t.Status === 2).map(t => t.PatientID).pop() || '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Waiting Pool */}
                <div className="space-y-3">
                  <span className="text-xxs font-black tracking-widest text-slate-400 uppercase">WAITING QUEUE (NEXT UP)</span>
                  {tokens.filter(t => t.Shift === 1 && t.Status === 1).length === 0 ? (
                    <p className="text-xs text-slate-500 font-semibold text-center py-6">No patients in Morning waitlist.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2.5">
                      {tokens.filter(t => t.Shift === 1 && t.Status === 1).map((tok, idx) => (
                        <div key={`tok-w1-${tok.TokenNo}-${idx}`} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center font-mono">
                          <span className="text-lg font-black text-blue-400">#{tok.TokenNo}</span>
                          <p className="text-[8px] text-slate-500 font-sans truncate font-bold mt-1 uppercase">{getPatientName(tok.PatientID)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Evening Shift Column */}
            {(fullscreenShift === 'both' || fullscreenShift === 'evening') && (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-base font-black tracking-wide text-indigo-400 uppercase">Evening Shift (17:00 - 21:00)</span>
                  <span className="text-xxs bg-slate-800 text-slate-300 font-bold px-2.5 py-1 rounded">
                    {tokens.filter(t => t.Shift === 2 && t.Status === 1).length} Patients Remaining
                  </span>
                </div>

                {/* Currently Consulting */}
                <div className="bg-slate-950 p-5 rounded-xl border-2 border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bg-emerald-500 text-slate-950 font-black text-[9px] tracking-widest px-3 py-1 uppercase">CURRENTLY IN ASSESSMENT</div>
                  {tokens.filter(t => t.Shift === 2 && t.Status === 2).length === 0 ? (
                    <div className="py-6">
                      <span className="text-2xl font-black text-slate-600 font-mono">-- NONE --</span>
                      <p className="text-xxs text-slate-500 font-semibold mt-1">Doctor ready for next token...</p>
                    </div>
                  ) : (
                    <div className="py-4 space-y-1">
                      <span className="text-5xl font-black text-emerald-400 font-mono tracking-wider animate-bounce block">
                        #{tokens.filter(t => t.Shift === 2 && t.Status === 2).map(t => t.TokenNo).pop()}
                      </span>
                      <span className="text-sm font-extrabold text-slate-200 uppercase block">
                        {getPatientName(tokens.filter(t => t.Shift === 2 && t.Status === 2).map(t => t.PatientID).pop() || '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Waiting Pool */}
                <div className="space-y-3">
                  <span className="text-xxs font-black tracking-widest text-slate-400 uppercase">WAITING QUEUE (NEXT UP)</span>
                  {tokens.filter(t => t.Shift === 2 && t.Status === 1).length === 0 ? (
                    <p className="text-xs text-slate-500 font-semibold text-center py-6">No patients in Evening waitlist.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2.5">
                      {tokens.filter(t => t.Shift === 2 && t.Status === 1).map((tok, idx) => (
                        <div key={`tok-w2-${tok.TokenNo}-${idx}`} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center font-mono">
                          <span className="text-lg font-black text-indigo-400">#{tok.TokenNo}</span>
                          <p className="text-[8px] text-slate-500 font-sans truncate font-bold mt-1 uppercase">{getPatientName(tok.PatientID)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full LCD Screen Overlay Modal */}
      {isFullScreenMode && (
        <div className="fixed inset-0 bg-slate-950 text-white p-12 z-[99999] flex flex-col justify-between overflow-y-auto font-sans" id="full-lcd-screen">
          <div className="absolute top-4 right-4 flex items-center space-x-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-2xl z-[100000]">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shift Filter:</span>
            <select
              value={fullscreenShift}
              onChange={(e) => setFullscreenShift(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xxs font-bold text-emerald-400 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="both">Both Shifts</option>
              <option value="morning">Morning Shift Only</option>
              <option value="evening">Evening Shift Only</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setIsFullScreenMode(false);
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="bg-red-900/80 hover:bg-red-800 border border-red-700 text-red-100 text-xxs font-black px-3.5 py-1.5 rounded-lg transition uppercase tracking-wider cursor-pointer"
            >
              Close Fullscreen
            </button>
          </div>

          <div className="border-b-2 border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-emerald-400 font-sans uppercase animate-pulse">PCMS OPD Live Queue Display</h1>
              <p className="text-xs md:text-sm font-bold tracking-wide text-slate-400 uppercase mt-2">Please watch the screen for your Token number. Kindly keep your receipts ready.</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg md:text-2xl font-mono font-bold bg-slate-900 border border-slate-800 px-6 py-3 rounded-xl text-emerald-400">
                Live Server Clock: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="my-8 flex-1 grid grid-cols-1 gap-12" style={{
            gridTemplateColumns: fullscreenShift === 'both' ? 'repeat(2, minmax(0, 1fr))' : '1fr'
          }}>
            {(fullscreenShift === 'both' || fullscreenShift === 'morning') && (
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="text-xl font-black tracking-wide text-amber-500 uppercase">Morning Shift (08:30 - 12:30)</span>
                  <span className="text-xs bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded">
                    {tokens.filter(t => t.Shift === 1 && t.Status === 1).length} Patients Remaining
                  </span>
                </div>

                <div className="bg-slate-950 p-10 rounded-2xl border-4 border-emerald-500/50 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden flex-1 min-h-[200px]">
                  <div className="absolute top-0 left-0 bg-emerald-500 text-slate-950 font-black text-xs tracking-widest px-6 py-2 uppercase">CURRENTLY IN ASSESSMENT</div>
                  {tokens.filter(t => t.Shift === 1 && t.Status === 2).length === 0 ? (
                    <div className="py-12">
                      <span className="text-4xl font-black text-slate-600 font-mono">-- NONE --</span>
                      <p className="text-sm text-slate-500 font-semibold mt-2">Doctor ready for next token...</p>
                    </div>
                  ) : (
                    <div className="py-8 space-y-3">
                      <span className="text-7xl md:text-8xl font-black text-emerald-400 font-mono tracking-wider animate-bounce block">
                        #{tokens.filter(t => t.Shift === 1 && t.Status === 2).map(t => t.TokenNo).pop()}
                      </span>
                      <span className="text-2xl md:text-3xl font-extrabold text-slate-200 uppercase block tracking-wider truncate max-w-full">
                        {getPatientName(tokens.filter(t => t.Shift === 1 && t.Status === 2).map(t => t.PatientID).pop() || '')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase block">WAITING QUEUE (NEXT UP)</span>
                  {tokens.filter(t => t.Shift === 1 && t.Status === 1).length === 0 ? (
                    <p className="text-sm text-slate-500 font-semibold text-center py-6">No patients in Morning waitlist.</p>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {tokens.filter(t => t.Shift === 1 && t.Status === 1).slice(0, 18).map((tok, idx) => (
                        <div key={`tok-fs1-${tok.TokenNo}-${idx}`} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-center font-mono">
                          <span className="text-xl md:text-2xl font-black text-blue-400 block">#{tok.TokenNo}</span>
                          <p className="text-[9px] text-slate-400 font-sans truncate font-bold mt-1.5 uppercase">{getPatientName(tok.PatientID)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(fullscreenShift === 'both' || fullscreenShift === 'evening') && (
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="text-xl font-black tracking-wide text-indigo-400 uppercase">Evening Shift (17:00 - 21:00)</span>
                  <span className="text-xs bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded">
                    {tokens.filter(t => t.Shift === 2 && t.Status === 1).length} Patients Remaining
                  </span>
                </div>

                <div className="bg-slate-950 p-10 rounded-2xl border-4 border-emerald-500/50 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden flex-1 min-h-[200px]">
                  <div className="absolute top-0 left-0 bg-emerald-500 text-slate-950 font-black text-xs tracking-widest px-6 py-2 uppercase">CURRENTLY IN ASSESSMENT</div>
                  {tokens.filter(t => t.Shift === 2 && t.Status === 2).length === 0 ? (
                    <div className="py-12">
                      <span className="text-4xl font-black text-slate-600 font-mono">-- NONE --</span>
                      <p className="text-sm text-slate-500 font-semibold mt-2">Doctor ready for next token...</p>
                    </div>
                  ) : (
                    <div className="py-8 space-y-3">
                      <span className="text-7xl md:text-8xl font-black text-emerald-400 font-mono tracking-wider animate-bounce block">
                        #{tokens.filter(t => t.Shift === 2 && t.Status === 2).map(t => t.TokenNo).pop()}
                      </span>
                      <span className="text-2xl md:text-3xl font-extrabold text-slate-200 uppercase block tracking-wider truncate max-w-full">
                        {getPatientName(tokens.filter(t => t.Shift === 2 && t.Status === 2).map(t => t.PatientID).pop() || '')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase block">WAITING QUEUE (NEXT UP)</span>
                  {tokens.filter(t => t.Shift === 2 && t.Status === 1).length === 0 ? (
                    <p className="text-sm text-slate-500 font-semibold text-center py-6">No patients in Evening waitlist.</p>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {tokens.filter(t => t.Shift === 2 && t.Status === 1).slice(0, 18).map((tok, idx) => (
                        <div key={`tok-fs2-${tok.TokenNo}-${idx}`} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-center font-mono">
                          <span className="text-xl md:text-2xl font-black text-indigo-400 block">#{tok.TokenNo}</span>
                          <p className="text-[9px] text-slate-400 font-sans truncate font-bold mt-1.5 uppercase">{getPatientName(tok.PatientID)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-slate-600 text-xxs font-bold tracking-widest border-t border-slate-900 pt-4 uppercase shrink-0">
            PHC Health Clinic CMS • Powered by AI Studio Build • Press Close to exit full LCD view
          </div>
        </div>
      )}
    </>
  );
}
