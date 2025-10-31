import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    searchTerm: v.optional(v.string()),
    brand: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let products = await ctx.db.query("products").collect();
    
    // Filter by category
    if (args.categoryId) {
      products = products.filter(p => p.categoryId === args.categoryId);
    }
    
    // Filter by brand
    if (args.brand) {
      products = products.filter(p => p.brand === args.brand);
    }
    
    // Filter by active status
    if (args.isActive !== undefined) {
      products = products.filter(p => p.isActive === args.isActive);
    }
    
    // Search filter
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.brand.toLowerCase().includes(searchLower) ||
        (p.model && p.model.toLowerCase().includes(searchLower)) ||
        p.sku.toLowerCase().includes(searchLower) ||
        (p.imei && p.imei.toLowerCase().includes(searchLower)) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchLower))
      );
    }
    
    return products.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getMultiple = query({
  args: { productIds: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    const products = await Promise.all(
      args.productIds.map(id => ctx.db.get(id))
    );
    return products.filter(Boolean);
  },
});

export const getBySku = query({
  args: { sku: v.string() },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .first();
  },
});

export const getByImei = query({
  args: { imei: v.string() },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db
      .query("products")
      .withIndex("by_imei", (q) => q.eq("imei", args.imei))
      .first();
  },
});

export const getByBarcode = query({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db
      .query("products")
      .withIndex("by_barcode", (q) => q.eq("barcode", args.barcode))
      .first();
  },
});

export const getBrands = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    const products = await ctx.db.query("products").collect();
    const brands = [...new Set(products.map(p => p.brand))];
    return brands.sort();
  },
});

export const getLowStock = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    const products = await ctx.db.query("products").collect();
    return products.filter(p => p.currentStock <= p.minStockLevel);
  },
});

export const getOutOfStock = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    const products = await ctx.db.query("products").collect();
    return products.filter(p => p.currentStock === 0);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    brand: v.string(),
    model: v.optional(v.string()),
    description: v.optional(v.string()),
    sku: v.string(),
    barcode: v.optional(v.string()),
    imei: v.optional(v.string()),
    categoryId: v.id("categories"),
    costPrice: v.number(),
    sellingPrice: v.number(),
    minStockLevel: v.number(),
    currentStock: v.number(),
    unit: v.string(),
    supplierName: v.optional(v.string()),
    supplierMobile: v.optional(v.string()),
    supplierNid: v.optional(v.string()),
    specifications: v.optional(v.object({
      display: v.optional(v.object({
        size: v.optional(v.string()),
        resolution: v.optional(v.string()),
        type: v.optional(v.string()),
      })),
      processor: v.optional(v.object({
        chipset: v.optional(v.string()),
        cpu: v.optional(v.string()),
        gpu: v.optional(v.string()),
      })),
      memory: v.optional(v.object({
        ram: v.optional(v.string()),
        storage: v.optional(v.string()),
        expandable: v.optional(v.boolean()),
      })),
      camera: v.optional(v.object({
        rear: v.optional(v.string()),
        front: v.optional(v.string()),
        features: v.optional(v.array(v.string())),
      })),
      battery: v.optional(v.object({
        capacity: v.optional(v.string()),
        charging: v.optional(v.string()),
        wireless: v.optional(v.boolean()),
      })),
      connectivity: v.optional(v.object({
        network: v.optional(v.string()),
        wifi: v.optional(v.string()),
        bluetooth: v.optional(v.string()),
        nfc: v.optional(v.boolean()),
      })),
      physical: v.optional(v.object({
        dimensions: v.optional(v.string()),
        weight: v.optional(v.string()),
        colors: v.optional(v.array(v.string())),
        waterproof: v.optional(v.string()),
      })),
      os: v.optional(v.object({
        name: v.optional(v.string()),
        version: v.optional(v.string()),
      })),
    })),
    warranty: v.optional(v.object({
      duration: v.optional(v.string()),
      type: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check if SKU already exists
    const existingSku = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .first();
    
    if (existingSku) {
      throw new Error("A product with this SKU already exists");
    }
    
    // Check if IMEI already exists (if provided)
    if (args.imei) {
      const existingImei = await ctx.db
        .query("products")
        .withIndex("by_imei", (q) => q.eq("imei", args.imei))
        .first();
      
      if (existingImei) {
        throw new Error("A product with this IMEI already exists");
      }
    }
    
    // Check if barcode already exists (if provided)
    if (args.barcode) {
      const existingBarcode = await ctx.db
        .query("products")
        .withIndex("by_barcode", (q) => q.eq("barcode", args.barcode))
        .first();
      
      if (existingBarcode) {
        throw new Error("A product with this barcode already exists");
      }
    }
    
    const productId = await ctx.db.insert("products", {
      ...args,
      minStockLevel: 0, // Always set to 0
      isActive: true,
    });
    
    // Record initial stock movement if stock > 0
    if (args.currentStock > 0) {
      const user = await ctx.db.get(userId);
      await ctx.db.insert("stockMovements", {
        productId,
        productName: args.name,
        imei: args.imei,
        type: "in",
        quantity: args.currentStock,
        reason: "Initial Stock",
        userId,
        userName: user?.name || user?.email || "Unknown",
        previousStock: 0,
        newStock: args.currentStock,
        reference: "INITIAL",
      });
    }
    
    return productId;
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    brand: v.string(),
    model: v.optional(v.string()),
    description: v.optional(v.string()),
    sku: v.string(),
    barcode: v.optional(v.string()),
    imei: v.optional(v.string()),
    categoryId: v.id("categories"),
    costPrice: v.number(),
    sellingPrice: v.number(),
    minStockLevel: v.number(),
    currentStock: v.number(),
    unit: v.string(),
    isActive: v.boolean(),
    supplierName: v.optional(v.string()),
    supplierMobile: v.optional(v.string()),
    supplierNid: v.optional(v.string()),
    specifications: v.optional(v.object({
      display: v.optional(v.object({
        size: v.optional(v.string()),
        resolution: v.optional(v.string()),
        type: v.optional(v.string()),
      })),
      processor: v.optional(v.object({
        chipset: v.optional(v.string()),
        cpu: v.optional(v.string()),
        gpu: v.optional(v.string()),
      })),
      memory: v.optional(v.object({
        ram: v.optional(v.string()),
        storage: v.optional(v.string()),
        expandable: v.optional(v.boolean()),
      })),
      camera: v.optional(v.object({
        rear: v.optional(v.string()),
        front: v.optional(v.string()),
        features: v.optional(v.array(v.string())),
      })),
      battery: v.optional(v.object({
        capacity: v.optional(v.string()),
        charging: v.optional(v.string()),
        wireless: v.optional(v.boolean()),
      })),
      connectivity: v.optional(v.object({
        network: v.optional(v.string()),
        wifi: v.optional(v.string()),
        bluetooth: v.optional(v.string()),
        nfc: v.optional(v.boolean()),
      })),
      physical: v.optional(v.object({
        dimensions: v.optional(v.string()),
        weight: v.optional(v.string()),
        colors: v.optional(v.array(v.string())),
        waterproof: v.optional(v.string()),
      })),
      os: v.optional(v.object({
        name: v.optional(v.string()),
        version: v.optional(v.string()),
      })),
    })),
    warranty: v.optional(v.object({
      duration: v.optional(v.string()),
      type: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const { id, ...updates } = args;
    const existingProduct = await ctx.db.get(id);
    if (!existingProduct) throw new Error("Product not found");
    
    // Check if SKU already exists (excluding current product)
    const existingSku = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .first();
    
    if (existingSku && existingSku._id !== id) {
      throw new Error("A product with this SKU already exists");
    }
    
    // Check if IMEI already exists (if provided, excluding current product)
    if (args.imei) {
      const existingImei = await ctx.db
        .query("products")
        .withIndex("by_imei", (q) => q.eq("imei", args.imei))
        .first();
      
      if (existingImei && existingImei._id !== id) {
        throw new Error("A product with this IMEI already exists");
      }
    }
    
    // Check if barcode already exists (if provided, excluding current product)
    if (args.barcode) {
      const existingBarcode = await ctx.db
        .query("products")
        .withIndex("by_barcode", (q) => q.eq("barcode", args.barcode))
        .first();
      
      if (existingBarcode && existingBarcode._id !== id) {
        throw new Error("A product with this barcode already exists");
      }
    }
    
    // Record stock movement if stock changed
    if (existingProduct.currentStock !== args.currentStock) {
      const user = await ctx.db.get(userId);
      const difference = args.currentStock - existingProduct.currentStock;
      
      await ctx.db.insert("stockMovements", {
        productId: id,
        productName: args.name,
        imei: args.imei,
        type: difference > 0 ? "in" : "out",
        quantity: Math.abs(difference),
        reason: "Stock Adjustment",
        userId,
        userName: user?.name || user?.email || "Unknown",
        previousStock: existingProduct.currentStock,
        newStock: args.currentStock,
        reference: "ADJUSTMENT",
      });
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const updateStock = mutation({
  args: {
    id: v.id("products"),
    quantity: v.number(),
    type: v.union(v.literal("in"), v.literal("out")),
    reason: v.string(),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    
    const newStock = args.type === "in" 
      ? product.currentStock + args.quantity
      : product.currentStock - args.quantity;
    
    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }
    
    await ctx.db.patch(args.id, { currentStock: newStock });
    
    // Record stock movement
    const user = await ctx.db.get(userId);
    await ctx.db.insert("stockMovements", {
      productId: args.id,
      productName: product.name,
      imei: product.imei,
      type: args.type,
      quantity: args.quantity,
      reason: args.reason,
      reference: args.reference,
      userId,
      userName: user?.name || user?.email || "Unknown",
      previousStock: product.currentStock,
      newStock,
    });
    
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    // Check if product is used in any sales
    const sales = await ctx.db.query("sales").collect();
    const isUsedInSales = sales.some(sale => 
      sale.items.some(item => item.productId === args.id)
    );
    
    if (isUsedInSales) {
      throw new Error("Cannot delete product that has been sold. Consider deactivating it instead.");
    }
    
    // Check if product is used in any purchases
    const purchases = await ctx.db.query("purchases").collect();
    const isUsedInPurchases = purchases.some(purchase => 
      purchase.items.some(item => item.productId === args.id)
    );
    
    if (isUsedInPurchases) {
      throw new Error("Cannot delete product that has purchase history. Consider deactivating it instead.");
    }
    
    // Delete related stock movements
    const stockMovements = await ctx.db
      .query("stockMovements")
      .withIndex("by_product", (q) => q.eq("productId", args.id))
      .collect();
    
    for (const movement of stockMovements) {
      await ctx.db.delete(movement._id);
    }
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const toggleActive = mutation({
  args: { 
    id: v.id("products"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    await ctx.db.patch(args.id, { isActive: args.isActive });
    return args.id;
  },
});

export const getStockMovements = query({
  args: { 
    productId: v.optional(v.id("products")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let movements;
    if (args.productId) {
      movements = await ctx.db
        .query("stockMovements")
        .withIndex("by_product", (q) => q.eq("productId", args.productId!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      movements = await ctx.db
        .query("stockMovements")
        .order("desc")
        .take(args.limit || 50);
    }
    
    return movements;
  },
});

export const getInventoryValue = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const products = await ctx.db.query("products").collect();
    
    const totalCostValue = products.reduce((sum, product) => 
      sum + (product.currentStock * product.costPrice), 0
    );
    
    const totalSellingValue = products.reduce((sum, product) => 
      sum + (product.currentStock * product.sellingPrice), 0
    );
    
    const totalItems = products.reduce((sum, product) => 
      sum + product.currentStock, 0
    );
    
    return {
      totalCostValue,
      totalSellingValue,
      totalItems,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      lowStockProducts: products.filter(p => p.currentStock <= p.minStockLevel).length,
      outOfStockProducts: products.filter(p => p.currentStock === 0).length,
    };
  },
});
