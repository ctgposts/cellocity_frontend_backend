import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all data
    const [products, customers, sales, suppliers, categories] = await Promise.all([
      ctx.db.query("products").collect(),
      ctx.db.query("customers").collect(),
      ctx.db.query("sales").collect(),
      ctx.db.query("suppliers").collect(),
      ctx.db.query("categories").collect(),
    ]);
    
    // Filter today's sales
    const todaySales = sales.filter(sale => 
      sale._creationTime >= today.getTime() && 
      sale._creationTime < tomorrow.getTime()
    );
    
    // Calculate today's metrics
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const todayTransactions = todaySales.length;
    
    // Calculate total revenue and profit
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Calculate profit (selling price - cost price for all sold items)
    let totalProfit = 0;
    let todayProfit = 0;
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p._id === item.productId);
        if (product) {
          const itemProfit = (item.unitPrice - product.costPrice) * item.quantity;
          totalProfit += itemProfit;
          
          // Check if this sale is from today
          if (sale._creationTime >= today.getTime() && sale._creationTime < tomorrow.getTime()) {
            todayProfit += itemProfit;
          }
        }
      });
    });
    
    // Get low stock products (less than or equal to 0 items)
    const lowStockProducts = products.filter(product => product.currentStock <= 0);
    
    // Calculate total investment amount (cost of current stock)
    const totalInvestmentAmount = products.reduce((sum, product) => 
      sum + (product.costPrice * product.currentStock), 0
    );
    
    // Calculate average sale value
    const averageSaleValue = sales.length > 0 ? totalRevenue / sales.length : 0;
    
    // Get recent activity (last 5 sales)
    const recentSales = sales
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5);
    
    // Calculate growth (mock data for now)
    const lastWeekSales = sales.filter(sale => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sale._creationTime >= weekAgo.getTime();
    });
    
    const previousWeekSales = sales.filter(sale => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sale._creationTime >= twoWeeksAgo.getTime() && sale._creationTime < weekAgo.getTime();
    });
    
    const thisWeekRevenue = lastWeekSales.reduce((sum, sale) => sum + sale.total, 0);
    const lastWeekRevenue = previousWeekSales.reduce((sum, sale) => sum + sale.total, 0);
    const growthPercentage = lastWeekRevenue > 0 
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
      : 0;
    
    // Count mobile phones (products in mobile categories)
    const mobileCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes('mobile') || 
      cat.name.toLowerCase().includes('phone') ||
      cat.name.toLowerCase().includes('smartphone')
    );
    const mobileCategoryIds = mobileCategories.map(cat => cat._id);
    const totalMobiles = products.filter(product => 
      mobileCategoryIds.includes(product.categoryId)
    ).length;
    
    // Active suppliers count
    const activeSuppliers = suppliers.filter(supplier => supplier.isActive !== false).length;
    
    return {
      // Today's metrics
      todaySales: todayRevenue,
      todayProfit,
      todayTransactions,
      
      // Overall metrics
      totalProducts: products.length,
      totalMobiles,
      totalCategories: categories.length,
      totalCustomers: customers.length,
      totalSuppliers: activeSuppliers,
      totalRevenue,
      totalInvestmentAmount,
      totalProfit,
      
      // Stock metrics
      lowStockCount: lowStockProducts.length,
      totalStock: products.reduce((sum, product) => sum + product.currentStock, 0),
      
      // Performance metrics
      averageSaleValue,
      growthPercentage: Math.round(growthPercentage * 100) / 100,
      
      // Recent activity
      recentSales,
      lowStockProducts: lowStockProducts.slice(0, 10),
      
      // Payment method breakdown
      paymentMethodBreakdown: sales.reduce((acc, sale) => {
        acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
        return acc;
      }, {} as Record<string, number>),
      
      // Monthly data for charts
      monthlyData: getMonthlyData(sales, products),
    };
  },
});

function getMonthlyData(sales: any[], products: any[]) {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    
    const monthSales = sales.filter(sale => 
      sale._creationTime >= month.getTime() && 
      sale._creationTime < nextMonth.getTime()
    );
    
    const revenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Calculate monthly profit
    let profit = 0;
    monthSales.forEach(sale => {
      sale.items.forEach((item: any) => {
        const product = products.find(p => p._id === item.productId);
        if (product) {
          profit += (item.unitPrice - product.costPrice) * item.quantity;
        }
      });
    });
    
    months.push({
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      revenue,
      profit,
      transactions: monthSales.length,
    });
  }
  
  return months;
}

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const [recentSales, recentCustomers, recentProducts] = await Promise.all([
      ctx.db.query("sales").order("desc").take(10),
      ctx.db.query("customers").order("desc").take(5),
      ctx.db.query("products").order("desc").take(5),
    ]);
    
    return {
      recentSales,
      recentCustomers,
      recentProducts,
    };
  },
});

export const getTopProducts = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const sales = await ctx.db.query("sales").collect();
    const products = await ctx.db.query("products").collect();
    
    // Calculate product sales
    const productSales = new Map<string, { quantity: number; revenue: number; name: string }>();
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productSales.get(item.productId) || { quantity: 0, revenue: 0, name: item.productName };
        existing.quantity += item.quantity;
        existing.revenue += item.totalPrice;
        productSales.set(item.productId, existing);
      });
    });
    
    // Convert to array and sort by quantity
    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        ...data,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    
    return topProducts;
  },
});
