import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInPage } from "./components/SignInPage";
import { Dashboard } from "./components/Dashboard";
import { Inventory } from "./components/Inventory";
import { EnhancedPOS } from "./components/EnhancedPOS";
import { Sales } from "./components/Sales";
import { Customers } from "./components/Customers";
import { Reports } from "./components/Reports";
import { Settings } from "./components/Settings";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = useQuery(api.auth.loggedInUser);
  const currentUser = useQuery(api.users.getCurrentUser);
  const ensureProfile = useMutation(api.users.ensureUserProfile);
  const ensureRole = useMutation(api.users.ensureUserRole);

  // Ensure user has profile and role when authenticated
  useEffect(() => {
    if (user) {
      ensureProfile().catch(console.error);
      ensureRole().catch(console.error);
    }
  }, [user, ensureProfile, ensureRole]);

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: "🏠" },
    { id: "pos", name: "Point of Sale", icon: "🛒" },
    { id: "inventory", name: "Inventory", icon: "📦" },
    { id: "sales", name: "Sales", icon: "💰" },
    { id: "customers", name: "Customers", icon: "👥" },
    { id: "reports", name: "Reports", icon: "📊" },
    { id: "settings", name: "Settings", icon: "⚙️" },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveSection} />;
      case "pos":
        return <EnhancedPOS />;
      case "inventory":
        return <Inventory />;
      case "sales":
        return <Sales />;
      case "customers":
        return <Customers />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onNavigate={setActiveSection} />;
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
      <Authenticated>
        <div className="min-h-screen bg-gray-50">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Desktop Layout */}
          <div className="hidden lg:flex min-h-screen">
            {/* Desktop Sidebar */}
            <div className="w-72 bg-white shadow-xl flex flex-col border-r border-gray-200">
              {/* Enhanced Logo Section */}
              <div className="flex items-center justify-center h-20 px-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-red-600 font-bold text-lg">CC</span>
                  </div>
                  <div className="text-white">
                    <h1 className="font-bold text-xl tracking-wide">CELLO CITY</h1>
                    <p className="text-red-100 text-xs">Mobile Shop Management</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-4 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeSection === item.id
                        ? "bg-red-50 text-red-700 border-l-4 border-red-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </nav>

              {/* Enhanced User Info */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg font-bold">
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || "user@example.com"}
                    </p>
                    <p className="text-xs text-red-600 font-medium">Administrator</p>
                  </div>
                </div>
                <SignOutButton />
              </div>
            </div>

            {/* Desktop Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-1 overflow-auto">
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                  {renderContent()}
                </div>
              </main>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden min-h-screen flex flex-col">
            {/* Mobile Sidebar */}
            <div className={`
              fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
              <div className="flex flex-col h-full">
                {/* Enhanced Mobile Logo */}
                <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-red-600 font-bold">CC</span>
                    </div>
                    <div className="text-white">
                      <h1 className="font-bold text-lg">CELLO CITY</h1>
                      <p className="text-red-100 text-xs">Mobile Shop</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg text-white hover:bg-red-700 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                  {navigation.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center space-x-4 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        activeSection === item.id
                          ? "bg-red-50 text-red-700 border-l-4 border-red-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </nav>

                {/* User Info */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-bold">
                        {user?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || "user@example.com"}
                      </p>
                      <p className="text-xs text-red-600 font-medium">Administrator</p>
                    </div>
                  </div>
                  <SignOutButton />
                </div>
              </div>
            </div>

            {/* Enhanced Mobile Top Bar */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
              <div className="flex items-center justify-between h-16 px-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-sm">CC</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-lg">CELLO CITY</span>
                    <p className="text-xs text-gray-500 -mt-1">Mobile Shop</p>
                  </div>
                </div>
                <div className="w-10"></div>
              </div>
            </header>

            {/* Mobile Main Content */}
            <main className="flex-1 overflow-auto pb-20">
              <div className="p-4 sm:p-6 max-w-7xl mx-auto">
                {renderContent()}
              </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav 
              activeSection={activeSection}
              onNavigate={setActiveSection}
            />
          </div>
        </div>
      </Authenticated>
    </>
  );
}

export default App;
