import Link from "next/link";
import { Heart, Upload, Stethoscope, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-700">HridLink</h1>
        </div>
        <p className="text-slate-500 text-sm mb-8 ml-1">
          Rural Cardiac Telemedicine · IntelliForge Digital Services
        </p>

        <div className="card p-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Quick Access</h2>

          <Link
            href="/register"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center group-hover:bg-brand-200 transition-colors">
              <Heart className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Register Patient</p>
              <p className="text-xs text-slate-500">Add a new patient record</p>
            </div>
          </Link>

          <Link
            href="/ecg-upload"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center group-hover:bg-brand-200 transition-colors">
              <Upload className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Upload ECG</p>
              <p className="text-xs text-slate-500">Submit ECG for cardiologist review</p>
            </div>
          </Link>

          <Link
            href="/cardiologist"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Stethoscope className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Cardiologist Dashboard</p>
              <p className="text-xs text-slate-500">Review pending ECGs</p>
            </div>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Admin Dashboard</p>
              <p className="text-xs text-slate-500">Stats and reports</p>
            </div>
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          BuildwithAiGiri · gen.girish@gmail.com
        </p>
      </div>
    </main>
  );
}
