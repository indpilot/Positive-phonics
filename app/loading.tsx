export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-teal-100">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-8 w-48 bg-emerald-200 rounded-full"></div>
        <div className="h-64 w-full max-w-2xl bg-emerald-100 rounded-lg"></div>
        <div className="h-8 w-64 bg-emerald-200 rounded-full"></div>
      </div>
    </div>
  )
}
