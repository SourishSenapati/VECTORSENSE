import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, Power } from 'lucide-react';

const MitigationControl = () => {
  const [activating, setActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleIsolate = async () => {
    setActivating(true);
    try {
      // In production, calling the FastAPI endpoint that commands OPC-UA
      // await axios.post('http://localhost:8001/actuate', { valve_id: '104A', state: 'CLOSED' });
      await new Promise(r => setTimeout(r, 1500)); // Simulation delay
      setIsSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="absolute top-24 right-8 z-50 pointer-events-auto">
      <div className={`p-8 bg-black/60 backdrop-blur-xl border ${isSuccess ? 'border-green-500/50' : 'border-red-500/30'} rounded-sm shadow-[0_0_50px_rgba(255,0,0,0.1)] w-80`}>
        
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-10 w-10 flex items-center justify-center rounded-full bg-zinc-900 ${isSuccess ? 'text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'text-red-500'}`}>
            {isSuccess ? <CheckCircle size={20}/> : <ShieldAlert size={20}/>}
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
               SYSTEM_PROTOCOL
            </div>
            <div className={`text-lg font-black tracking-tight ${isSuccess ? 'text-green-400' : 'text-white'}`}>
              {isSuccess ? 'SECTOR_ISOLATED' : 'LEAK_ACTIVE_104A'}
            </div>
          </div>
        </div>

        <div className="text-[11px] text-zinc-400 font-sans mb-6 leading-relaxed">
           Physical isolation valve state: <span className={`font-black uppercase ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
             {isSuccess ? 'CLOSED' : 'FLOWING'}
           </span>. <br/>
           VectorSense ID 104A detected a high volume breach. Immediate upstream actuation is recommended.
        </div>

        {!isSuccess && (
          <button 
            onClick={handleIsolate}
            disabled={activating}
            className={`w-full py-4 text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 group transition-all
              ${activating ? 'bg-zinc-800 text-zinc-500' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.3)]'}
            `}
          >
            {activating ? (
              <span className="flex items-center gap-2">
                <Power size={14} className="animate-spin" /> COMM_SEQUENCING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Power size={14} className="group-hover:scale-125 transition-transform" /> AUTONOMOUS ISOLATE
              </span>
            )}
          </button>
        )}

        {isSuccess && (
          <div className="text-center py-2 px-4 bg-green-500/10 border border-green-500/30 text-[10px] text-green-500 font-mono tracking-widest uppercase">
             OPC_UA_CONFIRMATION: VALVE_104A_LOCKED
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] text-zinc-500">
             <span>DCS_HANDSHAKE:</span> <span className="text-green-600 font-bold">STABLE</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-zinc-500">
             <span>AES_GATEWAY:</span> <span className="text-blue-600 font-bold">ENCRYPTED</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MitigationControl;
