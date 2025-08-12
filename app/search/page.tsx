import { SearchInterface } from "@/components/search-interface"

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Search PSAs</h1>
          <a href="/" className="text-sm text-blue-600 hover:text-blue-800">
            Back to Home
          </a>
        </div>
      </header>

      <main className="px-4 py-6">
        <SearchInterface />
      </main>
    </div>
  )
}
