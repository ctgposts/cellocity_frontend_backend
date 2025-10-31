import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface DashboardProps {
  onNavigate: (section: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  
  const dashboardData = useQuery(api.dashboard.getOverview);
  const recentSales = useQuery(api.sales.list, { limit: 5 });
  const lowStockProducts = useQuery(api.products.getLowStock);

  if (!dashboardData || !recentSales || !lowStockProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const quickActions = [
    {
      id: "new-sale",
      title: "New Sale",
      description: "Start a new transaction",
      icon: "🛒",
      color: "bg-gradient-to-r from-green-600 to-green-700",
      action: () => onNavigate("pos")
    },
    {
      id: "add-product",
      title: "Add Mobile",
      description: "Add new mobile phone",
      icon: "📱",
      color: "bg-gradient-to-r from-blue-600 to-blue-700",
      action: () => onNavigate("inventory")
    },
    {
      id: "add-customer",
      title: "Add Customer",
      description: "Register new customer",
      icon: "👤",
      color: "bg-gradient-to-r from-purple-600 to-purple-700",
      action: () => onNavigate("customers")
    },
    {
      id: "view-reports",
      title: "View Reports",
      description: "Check sales analytics",
      icon: "📊",
      color: "bg-gradient-to-r from-orange-600 to-orange-700",
      action: () => onNavigate("reports")
    }
  ];

  const stats = [
    {
      title: "Today's Sales",
      value: `৳${dashboardData.todaySales.toLocaleString('en-BD')}`,
      change: `Profit: ৳${dashboardData.todayProfit.toLocaleString('en-BD')}`,
      changeType: "positive",
      icon: "💰"
    },
    {
      title: "Total Mobiles",
      value: dashboardData.totalMobiles.toString(),
      change: `${dashboardData.totalProducts} total products`,
      changeType: "neutral",
      icon: "📱"
    },
    {
      title: "Low Stock Items",
      value: lowStockProducts.length.toString(),
      change: lowStockProducts.length > 5 ? "High Alert" : "Normal",
      changeType: lowStockProducts.length > 5 ? "negative" : "positive",
      icon: "⚠️"
    },
    {
      title: "Categories",
      value: dashboardData.totalCategories.toString(),
      change: `${dashboardData.totalCustomers} customers`,
      changeType: "neutral",
      icon: "📂"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 animate-slide-up">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-600">Welcome back! Here's what's happening with your mobile shop.</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">⚡</span>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`${action.color} rounded-lg p-4 text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200 group`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base">{action.title}</h4>
                  <p className="text-xs opacity-90 hidden sm:block">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📈</span>
          Overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200 card-hover">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="text-xl sm:text-2xl opacity-75">{stat.icon}</div>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center text-xs font-medium ${
                  stat.changeType === 'positive' 
                    ? 'text-green-600' 
                    : stat.changeType === 'negative' 
                    ? 'text-red-600' 
                    : 'text-gray-600'
                }`}>
                  {stat.changeType === 'positive' && '✅'}
                  {stat.changeType === 'negative' && '⚠️'}
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-fade-in">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <span className="mr-2">🛍️</span>
              Recent Sales
            </h3>
            <button
              onClick={() => onNavigate("sales")}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentSales.slice(0, 5).map((sale) => (
              <div key={sale._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{sale.saleNumber}</p>
                  <p className="text-xs text-gray-500">
                    {sale.customerName || "Walk-in Customer"} • {sale.items.length} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">৳{sale.total.toLocaleString('en-BD')}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(sale._creationTime).toLocaleDateString('en-BD')}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {recentSales.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2 opacity-50">🛍️</div>
              <p className="text-gray-500 text-sm">No recent sales</p>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <span className="mr-2">⚠️</span>
              Low Stock Alert
            </h3>
            <button
              onClick={() => onNavigate("inventory")}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Manage Stock
            </button>
          </div>
          <div className="space-y-3">
            {lowStockProducts.slice(0, 5).map((product) => (
              <div key={product._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.brand} {product.model}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.currentStock === 0 
                      ? "bg-red-100 text-red-800" 
                      : product.currentStock <= 5 
                      ? "bg-orange-100 text-orange-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {product.currentStock} left
                  </span>
                </div>
              </div>
            ))}
          </div>
          {lowStockProducts.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2 opacity-50">✅</div>
              <p className="text-gray-500 text-sm">All products well stocked</p>
            </div>
          )}
        </div>
      </div>

      {/* Business Summary Bar */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-4 sm:p-6 text-white animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs sm:text-sm opacity-90">Today's Revenue</p>
            <p className="text-lg sm:text-xl font-bold">৳{dashboardData.todaySales.toLocaleString('en-BD')}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm opacity-90">Today's Profit</p>
            <p className="text-lg sm:text-xl font-bold">৳{dashboardData.todayProfit.toLocaleString('en-BD')}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm opacity-90">Total Stock</p>
            <p className="text-lg sm:text-xl font-bold">{dashboardData.totalStock}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm opacity-90">Growth</p>
            <p className="text-lg sm:text-xl font-bold">
              {dashboardData.growthPercentage > 0 ? '+' : ''}{dashboardData.growthPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
