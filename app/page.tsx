export default function HeroPage() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
      
  
        {/* Hero Section */}
        <main className="container mx-auto px-6 py-20 flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 max-w-2xl leading-tight">
            Take Control of Your <span className="text-indigo-600">Money</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl">
            The simplest way to track expenses, save money, and reach your financial goals.
          </p>
          
          <div className="flex gap-4">
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium">
              Get Started
            </button>
            <button className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition font-medium">
              How It Works
            </button>
          </div>
  
          {/* App Mockup Placeholder */}
          <div className="mt-16 bg-white p-8 rounded-2xl shadow-xl w-full max-w-3xl">
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">📱 App Preview</p>
            </div>
          </div>
        </main>
      </div>
    );
  }