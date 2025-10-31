import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface CartItem {
  productId: Id<"products">;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  stock: number;
  imei?: string;
}

export function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | undefined>();
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
  });
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: "",
    phoneNumber: "",
    reference: "",
  });
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: "",
    phone: "",
    charges: 0,
  });

  const products = useQuery(api.products.list, { 
    categoryId: selectedCategory,
    searchTerm: searchTerm || undefined 
  });
  const categories = useQuery(api.categories.list);
  const createSale = useMutation(api.sales.create);

  const paymentMethods = [
    { id: "cash", name: "Cash", icon: "💵", color: "from-green-500 to-green-600" },
    { id: "bkash", name: "bKash", icon: "📱", color: "from-pink-500 to-pink-600" },
    { id: "nagad", name: "Nagad", icon: "📱", color: "from-orange-500 to-orange-600" },
    { id: "rocket", name: "Rocket", icon: "🚀", color: "from-purple-500 to-purple-600" },
    { id: "upay", name: "Upay", icon: "💳", color: "from-blue-500 to-blue-600" },
    { id: "card", name: "Card", icon: "💳", color: "from-gray-500 to-gray-600" },
    { id: "cod", name: "COD", icon: "📦", color: "from-yellow-500 to-yellow-600" },
  ];

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product._id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.currentStock) {
        toast.error("Not enough stock available");
        return;
      }
      setCart(cart.map(item =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.currentStock <= 0) {
        toast.error("Product out of stock");
        return;
      }
      setCart([...cart, {
        productId: product._id,
        name: product.name,
        brand: product.brand,
        price: product.sellingPrice,
        quantity: 1,
        stock: product.currentStock,
      }]);
    }
  };

  const updateQuantity = (productId: Id<"products">, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }

    const item = cart.find(item => item.productId === productId);
    if (item && quantity > item.stock) {
      toast.error("Not enough stock available");
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId: Id<"products">) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% VAT
  const deliveryCharges = deliveryType === "delivery" ? deliveryInfo.charges : 0;
  const total = subtotal + tax - discount + deliveryCharges;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!customerInfo.phone) {
      toast.error("Customer phone number is required");
      return;
    }

    if (["bkash", "nagad", "rocket", "upay"].includes(paymentMethod) && !paymentDetails.transactionId) {
      toast.error("Transaction ID is required for mobile banking");
      return;
    }

    try {
      await createSale({
        customerName: customerInfo.name || undefined,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        discount,
        paymentMethod,
        paymentDetails: ["bkash", "nagad", "rocket", "upay"].includes(paymentMethod) ? {
          transactionId: paymentDetails.transactionId,
          phoneNumber: paymentDetails.phoneNumber,
          reference: paymentDetails.reference,
          status: "completed",
        } : undefined,
        deliveryInfo: {
          type: deliveryType,
          address: deliveryType === "delivery" ? deliveryInfo.address : undefined,
          phone: deliveryType === "delivery" ? deliveryInfo.phone : undefined,
          charges: deliveryCharges,
        },
      });

      // Reset form
      setCart([]);
      setCustomerInfo({ name: "", phone: "" });
      setDiscount(0);
      setPaymentDetails({ transactionId: "", phoneNumber: "", reference: "" });
      setDeliveryInfo({ address: "", phone: "", charges: 0 });
      toast.success("Sale completed successfully!");
    } catch (error) {
      toast.error("Failed to complete sale: " + (error as Error).message);
    }
  };

  if (!products || !categories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
      {/* Products Section */}
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Point of Sale
              </h2>
              <p className="text-gray-600 mt-1">Select products to add to cart</p>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search phones by name, brand, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value as Id<"categories"> || undefined)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              onClick={() => addToCart(product)}
              className="bg-white rounded-2xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
            >
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center">
                <span className="text-4xl">📱</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 truncate">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.brand} • {product.model}</p>
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold text-blue-600">
                  ৳{product.sellingPrice.toLocaleString('en-BD')}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  product.currentStock > product.minStockLevel
                    ? "bg-green-100 text-green-800"
                    : product.currentStock > 0
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {product.currentStock} {product.unit}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                SKU: {product.sku}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 h-fit">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Shopping Cart</h3>
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
            <span className="text-white text-lg">🛒</span>
          </div>
        </div>
        
        {/* Customer Info */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
            <input
              type="text"
              placeholder="Enter customer name"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-600">{item.brand} • ৳{item.price.toLocaleString('en-BD')}</p>
              </div>
              <div className="flex items-center space-x-2 ml-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 text-sm font-bold"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 text-sm font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="ml-2 text-red-500 hover:text-red-700 text-lg"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <p className="text-gray-500">Cart is empty</p>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                  paymentMethod === method.id
                    ? `border-blue-500 bg-gradient-to-r ${method.color} text-white shadow-lg`
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-lg">{method.icon}</span>
                  <span className="text-xs font-medium">{method.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Banking Details */}
        {["bkash", "nagad", "rocket", "upay"].includes(paymentMethod) && (
          <div className="space-y-3 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
              <input
                type="text"
                placeholder="Enter transaction ID"
                value={paymentDetails.transactionId}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sender Number</label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={paymentDetails.phoneNumber}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}

        {/* Delivery Options */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Delivery Option</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "pickup", name: "Pickup", icon: "🏪" },
              { id: "delivery", name: "Delivery", icon: "🚚" },
              { id: "cod", name: "COD", icon: "📦" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setDeliveryType(option.id)}
                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                  deliveryType === option.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-xs font-medium">{option.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Details */}
        {deliveryType === "delivery" && (
          <div className="space-y-3 mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
              <textarea
                placeholder="Enter delivery address"
                value={deliveryInfo.address}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charges (৳)</label>
              <input
                type="number"
                min="0"
                value={deliveryInfo.charges}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, charges: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}

        {/* Discount */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Discount (৳)</label>
          <input
            type="number"
            min="0"
            max={subtotal}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Totals */}
        <div className="space-y-2 mb-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>৳{subtotal.toLocaleString('en-BD')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>VAT (5%):</span>
            <span>৳{tax.toLocaleString('en-BD')}</span>
          </div>
          {deliveryCharges > 0 && (
            <div className="flex justify-between text-sm">
              <span>Delivery:</span>
              <span>৳{deliveryCharges.toLocaleString('en-BD')}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Discount:</span>
            <span>-৳{discount.toLocaleString('en-BD')}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span>Total:</span>
            <span className="text-blue-600">৳{total.toLocaleString('en-BD')}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || !customerInfo.phone}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Complete Sale • ৳{total.toLocaleString('en-BD')}
        </button>
      </div>
    </div>
  );
}
