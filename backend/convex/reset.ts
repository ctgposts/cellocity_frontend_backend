import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Clear all application data
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get current user to check if they're admin
    const currentUser = await ctx.db.get(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Check if user has admin role
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "admin") {
      throw new Error("Only administrators can reset application data");
    }

    // Clear all tables except users and auth-related tables
    const tablesToClear = [
      "products",
      "categories", 
      "customers",
      "suppliers",
      "sales",
      "purchases",
      "stockMovements",
      "userProfiles",
      "userRoles"
    ];

    const results = [];
    
    for (const tableName of tablesToClear) {
      try {
        const records = await ctx.db.query(tableName as any).collect();
        for (const record of records) {
          await ctx.db.delete(record._id);
        }
        results.push({ table: tableName, cleared: records.length });
      } catch (error) {
        console.error(`Error clearing ${tableName}:`, error);
        results.push({ table: tableName, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return {
      success: true,
      message: "Application data has been reset successfully",
      results
    };
  },
});

// Restore data from backup
export const restoreFromBackup = mutation({
  args: {
    backupData: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has admin role
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "admin") {
      throw new Error("Only administrators can restore data");
    }

    try {
      const backup = typeof args.backupData === 'string' 
        ? JSON.parse(args.backupData) 
        : args.backupData;

      if (!backup.data) {
        throw new Error("Invalid backup format: missing data section");
      }

      const results = [];

      // Restore each table's data
      for (const [tableName, records] of Object.entries(backup.data)) {
        if (!Array.isArray(records)) continue;
        
        try {
          let insertedCount = 0;
          
          for (const record of records as any[]) {
            // Remove system fields that shouldn't be restored
            const { _id, _creationTime, ...cleanRecord } = record;
            
            // Skip if record is empty or invalid
            if (!cleanRecord || Object.keys(cleanRecord).length === 0) continue;
            
            try {
              await ctx.db.insert(tableName as any, cleanRecord);
              insertedCount++;
            } catch (insertError) {
              console.error(`Error inserting record in ${tableName}:`, insertError);
            }
          }
          
          results.push({ 
            table: tableName, 
            restored: insertedCount,
            total: records.length 
          });
        } catch (error) {
          console.error(`Error restoring ${tableName}:`, error);
          results.push({ 
            table: tableName, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return {
        success: true,
        message: "Data restored successfully from backup",
        results,
        metadata: backup.metadata || {}
      };
    } catch (error) {
      throw new Error(`Restore failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Get restore statistics
export const getRestoreStats = mutation({
  args: {
    backupData: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    try {
      const backup = typeof args.backupData === 'string' 
        ? JSON.parse(args.backupData) 
        : args.backupData;

      if (!backup.data) {
        throw new Error("Invalid backup format");
      }

      const stats = {
        metadata: backup.metadata || {},
        statistics: backup.statistics || {},
        tables: {} as Record<string, number>
      };

      // Count records in each table
      for (const [tableName, records] of Object.entries(backup.data)) {
        if (Array.isArray(records)) {
          stats.tables[tableName] = records.length;
        }
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to analyze backup: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Clear specific table
export const clearTable = mutation({
  args: {
    tableName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has admin role
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "admin") {
      throw new Error("Only administrators can clear tables");
    }

    // Prevent clearing critical tables
    const protectedTables = ["users", "authSessions", "authAccounts", "authVerificationCodes"];
    if (protectedTables.includes(args.tableName)) {
      throw new Error("Cannot clear protected system tables");
    }

    try {
      const records = await ctx.db.query(args.tableName as any).collect();
      let deletedCount = 0;
      
      for (const record of records) {
        await ctx.db.delete(record._id);
        deletedCount++;
      }

      return {
        success: true,
        message: `Cleared ${deletedCount} records from ${args.tableName}`,
        deletedCount
      };
    } catch (error) {
      throw new Error(`Failed to clear table ${args.tableName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
