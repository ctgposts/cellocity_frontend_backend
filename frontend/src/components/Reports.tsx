import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Reports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const dailySummary = useQuery(api.sales.getDailySummary, {
    date: new Date(selectedDate).getTime()
  });
  
  const stats = useQuery(api.dashboard.getOverview);

  if (!dailySummary || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm w-full sm:w-auto"
        />
      </div>

      {/* Daily Summary - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Daily Summary - {new Date(selectedDate).toLocaleDateString('en-BD')}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{dailySummary.totalSales}</p>
            <p className="text-sm text-gray-500 mt-1">Total Sales</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">৳{dailySummary.totalRevenue.toLocaleString('en-BD')}</p>
            <p className="text-sm text-gray-500 mt-1">Revenue</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{dailySummary.totalItems}</p>
            <p className="text-sm text-gray-500 mt-1">Items Sold</p>
          </div>
        </div>
      </div>

      {/* Overall Statistics - Mobile Grid */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.totalProducts}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Total Products</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.totalSuppliers}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Suppliers</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.totalCustomers}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Customers</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.lowStockCount}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Low Stock Items</p>
          </div>
        </div>
      </div>

      {/* Inventory Value - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Inventory Analysis</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600">৳{stats.totalInvestmentAmount.toLocaleString('en-BD')}</p>
            <p className="text-sm text-gray-500 mt-1">Total Investment Amount</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">
              ৳{stats.averageSaleValue.toLocaleString('en-BD')}
            </p>
            <p className="text-sm text-gray-500 mt-1">Average Sale Value</p>
          </div>
        </div>
      </div>

      {/* Low Stock Alert - Mobile Cards */}
      {stats.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⚠️</span>
            Low Stock Alert
          </h3>
          
          <div className="space-y-3">
            {stats.lowStockProducts.map((product: any) => (
              <div key={product._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-gray-100 rounded-lg bg-red-50 space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">SKU: {product.sku}</p>
                </div>
                <div className="flex justify-between sm:block sm:text-right">
                  <div>
                    <p className="font-medium text-red-600 text-sm">{product.currentStock} {product.unit}</p>
                    <p className="text-xs text-gray-500">Min: {product.minStockLevel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
