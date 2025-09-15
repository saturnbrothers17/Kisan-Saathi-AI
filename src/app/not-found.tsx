import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-green-600">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800">पृष्ठ नहीं मिला | Page Not Found</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            खुशी है कि आप यहाँ हैं! लेकिन यह पृष्ठ उपलब्ध नहीं है।
            <br />
            We're glad you're here! But this page doesn't exist.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            🏠 होम पर जाएं | Go Home
          </Link>
          <Link 
            href="/weather"
            className="px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
          >
            🌦️ मौसम देखें | Check Weather
          </Link>
        </div>
        
        <div className="text-sm text-gray-500 mt-8">
          <p>🌱 Kisan Saathi AI - आपका कृषि साथी</p>
        </div>
      </div>
    </div>
  )
}
