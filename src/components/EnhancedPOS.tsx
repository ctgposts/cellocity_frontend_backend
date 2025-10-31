import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface CartItem {
  productId: Id<"products">;
  productName: string;
  price: number;
  quantity: number;
  imei?: string;
  brand?: string;
  model?: string;
  category?: string;
}

export function EnhancedPOS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [discount, setDiscount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [imeiInputs, setImeiInputs] = useState<Record<string, string>>({});

  const products = useQuery(api.products.list, {}) || [];
  const categories = useQuery(api.categories.list) || [];
  const customers = useQuery(api.customers.list, {}) || [];
  
  const createSale = useMutation(api.sales.create);
  const updateProductStock = useMutation(api.products.updateStock);

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory && (product.currentStock || 0) > 0;
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal - discountAmount;
  const change = parseFloat(amountPaid) - total;

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product._id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product._id,
        productName: product.name,
        price: product.sellingPrice,
        quantity: 1,
        brand: product.brand,
        model: product.model,
        category: product.categoryId
      }]);
    }
  };

  const updateCartItemQuantity = (productId: Id<"products">, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
      // Remove IMEI input when item is removed
      const newImeiInputs = { ...imeiInputs };
      delete newImeiInputs[productId];
      setImeiInputs(newImeiInputs);
    } else {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const updateCartItemIMEI = (productId: Id<"products">, imei: string) => {
    setImeiInputs(prev => ({
      ...prev,
      [productId]: imei
    }));
    
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, imei }
        : item
    ));
  };

  const removeFromCart = (productId: Id<"products">) => {
    setCart(cart.filter(item => item.productId !== productId));
    // Remove IMEI input when item is removed
    const newImeiInputs = { ...imeiInputs };
    delete newImeiInputs[productId];
    setImeiInputs(newImeiInputs);
  };

  const clearCart = () => {
    setCart([]);
    setImeiInputs({});
    setCustomerInfo({ name: "", phone: "", email: "" });
    setAmountPaid("");
    setDiscount("");
    setPaymentMethod("cash");
  };

  const processSale = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    if (paymentMethod === "cash" && parseFloat(amountPaid) < total) {
      alert("Insufficient payment amount!");
      return;
    }

    setIsProcessing(true);

    try {
      // Create sale record
      const saleData = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          imei: item.imei || undefined,
        })),
        discount: discountAmount,
        paymentMethod,
        customerName: customerInfo.name || undefined,
        paymentDetails: customerInfo.phone ? {
          phoneNumber: customerInfo.phone
        } : undefined,
      };

      await createSale(saleData);

      // Update stock for each item
      for (const item of cart) {
        const product = products.find(p => p._id === item.productId);
        if (product) {
          await updateProductStock({
            id: item.productId,
            type: "out",
            quantity: item.quantity,
            reason: "Sale",
          });
        }
      }

      alert("Sale completed successfully!");
      clearCart();
    } catch (error) {
      console.error("Sale processing failed:", error);
      alert("Failed to process sale. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectCustomer = (customer: any) => {
    setCustomerInfo({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || ""
    });
    setShowCustomerForm(false);
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600 text-sm">Select products to add to cart</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products by name, brand, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredProducts.map(product => {
              // Get category name
              const category = categories?.find(cat => cat._id === product.categoryId);
              const categoryName = category?.name || 'Uncategorized';
              
              return (
              <div
                key={product._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => addToCart(product)}
              >
                  {/* Mobile Model Name */}
                  <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  
                  {/* Category */}
                  <p className="text-xs text-gray-500 mb-2 truncate">
                    {categoryName}
                  </p>
                  
                  {/* Sell Price */}
                  <div className="text-center">
                    <span className="text-lg font-bold text-red-600 block">
                      ৳{product.sellingPrice?.toLocaleString('en-BD')}
                    </span>
                    <button className="text-red-600 hover:text-red-800 text-xs font-medium mt-1">
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory
                  ? "Try adjusting your search or filter criteria."
                  : "No products available in stock."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-full lg:w-96 bg-white shadow-lg border-l border-gray-200 flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {cart.length} items
            </span>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.productId} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {item.productName}
                  </h4>
                  {(item.brand || item.model) && (
                    <p className="text-xs text-gray-500">
                      {item.brand} {item.model}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ✕
                </button>
              </div>

              {/* IMEI Input */}
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Enter IMEI (optional)"
                  value={imeiInputs[item.productId] || ""}
                  onChange={(e) => updateCartItemIMEI(item.productId, e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ৳{(item.price * item.quantity).toLocaleString('en-BD')}
                </span>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">🛒</div>
              <p className="text-gray-500 text-sm">Cart is empty</p>
            </div>
          )}
        </div>

        {/* Cart Summary and Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Customer Info */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Customer</label>
                <button
                  onClick={() => setShowCustomerForm(!showCustomerForm)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  {showCustomerForm ? "Hide" : "Select/Add"}
                </button>
              </div>
              
              {showCustomerForm && (
                <div className="space-y-2 mb-3">
                  {/* Existing Customers */}
                  {customers.length > 0 && (
                    <div>
                      <label className="text-xs text-gray-600">Select existing customer:</label>
                      <select
                        onChange={(e) => {
                          const customer = customers.find(c => c._id === e.target.value);
                          if (customer) selectCustomer(customer);
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      >
                        <option value="">Choose customer...</option>
                        {customers.map(customer => (
                          <option key={customer._id} value={customer._id}>
                            {customer.name} - {customer.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Manual Entry */}
                  <div>
                    <label className="text-xs text-gray-600">Or enter manually:</label>
                    <input
                      type="text"
                      placeholder="Customer name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-1"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                </div>
              )}
              
              {customerInfo.name && (
                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  {customerInfo.name} {customerInfo.phone && `- ${customerInfo.phone}`}
                </div>
              )}
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (৳)
              </label>
              <input
                type="number"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Payment</option>
              </select>
            </div>

            {/* Amount Paid (for cash) */}
            {paymentMethod === "cash" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Paid (৳)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>৳{subtotal.toLocaleString('en-BD')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span>-৳{discountAmount.toLocaleString('en-BD')}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>৳{total.toLocaleString('en-BD')}</span>
              </div>
              {paymentMethod === "cash" && parseFloat(amountPaid) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Change:</span>
                  <span>৳{Math.max(0, change).toLocaleString('en-BD')}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={clearCart}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={processSale}
                disabled={isProcessing || (paymentMethod === "cash" && parseFloat(amountPaid) < total)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
