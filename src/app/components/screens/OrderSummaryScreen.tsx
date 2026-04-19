import { motion } from 'motion/react';
import { useState } from 'react';
import { ChevronLeft, Edit2, Package, Truck } from 'lucide-react';
import { OrderItem, Breakfast,BOWL_SIZES, PROTEINS, EXTRAS, calculateOrderTotal,calculateBreakfastTotal , DELIVERY_FEE, SERVICE_FEE, BREAKFAST_EXTRAS, S_Breakfast } from '@/app/types/orderTypes';



interface OrderSummaryScreenProps {
  order: OrderItem | Breakfast;
  orderType: 'waakye' | 'breakfast';
  onBack: () => void;
  onConfirm: () => void;
  onUpdateOrder: (order: any) => void;
}


export function OrderSummaryScreen({ order, orderType, onUpdateOrder, onBack, onConfirm }: OrderSummaryScreenProps) {
const isWaakye = orderType === 'waakye';

   const [locating, setLocating] = useState(false);

const detectLocation = () => {
  if (!navigator.geolocation) {
    alert('Geolocation not supported on this device');
    return;
  }

  setLocating(true);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = `${position.coords.latitude}, ${position.coords.longitude}`;

      onUpdateOrder({
        ...order,
        customerLocation: coords,
      });

      setLocating(false);
    },
    () => {
      alert('Unable to fetch location. Please enter manually.');
      setLocating(false);
    }
  );
};

const total =
  orderType === 'waakye'
    ? calculateOrderTotal(order as OrderItem)
    : calculateBreakfastTotal(order as Breakfast);
const basePrice = isWaakye
  ? BOWL_SIZES[(order as OrderItem).size].price
  : S_Breakfast[(order as Breakfast).drink].price;

  const proteinItems = Object.entries(order.proteins || {})
    .map(([id, qty]) => {
      const protein = PROTEINS.find(p => p.id === id);
      return protein ? { ...protein, quantity: qty } : null;
    })
    .filter(Boolean);

const extraItems = order.extras.map(id =>
  (orderType === 'waakye'
    ? EXTRAS.find(e => e.id === id)
    : BREAKFAST_EXTRAS.find(e => e.id === id)
  )
).filter(Boolean);

  const toggleDeliveryMode = () => {
    onUpdateOrder({
      ...order,
      deliveryMode: order.deliveryMode === 'pickup' ? 'delivery' : 'pickup',
    });
  };

  const formatTo233 = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '').trim(); // remove spaces & symbols

  if (cleaned.startsWith('0')) {
    return '233' + cleaned.slice(1);
  }

  if (cleaned.startsWith('233')) {
    return cleaned;
  }

  return cleaned;
};


  return (
    <div className="min-h-[100dvh] bg-[#fefaf4] flex flex-col [webkit-tap-highlight-color:transparent]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={onBack} className="p-3 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">Order Summary</h1>
          <button onClick={onBack} className="p-3 hover:bg-gray-100 rounded-lg">
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
     <div className="flex-1 overflow-y-auto pb-40  [-webkit-overflow-scrolling:touch]">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          
          {/* Bowl Size */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 border-2 border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">
  {isWaakye ? '🍚' : '🍚'}
</div>
                
<div>
  {isWaakye ? (
    <div className="font-bold">
      {BOWL_SIZES[(order as OrderItem).size].name} Waakye
    </div>
  ) : (
    <div className="font-bold">
      {S_Breakfast[(order as Breakfast).drink].name}
    </div>
  )}
  <div className="text-sm text-gray-600">
    {isWaakye ? 'Base' : 'Jollof'}
  </div>

                  <div className="text-sm text-gray-600">Base</div>
                </div>
              </div>
              <div className="font-bold text-[#7a1d1d]">GH₵{basePrice}</div>
            </div>
          </motion.div>

          {/* Proteins */}
          {proteinItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-4 border-2 border-gray-200"
            >
              <div className="font-bold mb-3">Proteins</div>
              <div className="space-y-2">
                {proteinItems.map((protein) => (
                  <div key={protein!.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-xl">
                        {protein!.id === 'egg' && '🥚'}
                        {protein!.id === 'meat' && '🥩'}
                        {protein!.id === 'sausage' && '🌭'}
                        {protein!.id === 'fish' && '🐟'}
                      </div>
                      <span className="text-gray-700">
                        {protein!.quantity}x {protein!.name}
                      </span>
                    </div>
                    <div className="text-gray-700">
                      GH₵{protein!.price * protein!.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Extras */}
          {extraItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-4 border-2 border-gray-200"
            >
              <div className="font-bold mb-3">Extras</div>
              <div className="space-y-2">
                {extraItems.map((extra) => (
                  <div key={extra!.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-xl">
                          {extra!.id === 'gari' && '🌾'}
                        {extra!.id === 'salad' && '🥗'}
                        {extra!.id === 'plantain' && '🍌'}
                        {extra!.id === 'wele' && '🥓'}
                      </div>
                      <span className="text-gray-700">{extra!.name}</span>
                    </div>
                    <div className="text-gray-700">GH₵{extra!.price}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Delivery Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 border-2 border-gray-200"
          >
            <div className="font-bold mb-3">Delivery Mode</div>
            <div className="grid grid-cols-2 gap-3">
              <button
  disabled
  className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
>
  <Package className="w-6 h-6 mx-auto mb-2 text-gray-400" />
  <div className="font-bold text-sm">Pickup</div>
  <div className="text-xs text-gray-600 mt-1">COMING SOON</div>
</button>

              
              <button
                onClick={toggleDeliveryMode}
                className={`p-4 rounded-xl border-2 transition-all ${
                  order.deliveryMode === 'delivery'
                    ? 'border-[#7a1d1d] bg-[#7a1d1d]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Truck className={`w-6 h-6 mx-auto mb-2 ${
                  order.deliveryMode === 'delivery' ? 'text-[#7a1d1d]' : 'text-gray-400'
                }`} />
                <div className="font-bold text-sm">Delivery</div>
                <div className="text-xs text-gray-600 mt-1">+GH₵{DELIVERY_FEE}</div>
              </button>
            </div>
          </motion.div>

                   {order.deliveryMode === 'delivery' && (
  <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32 }}
      className="bg-white rounded-2xl p-4 border-2 border-gray-200 space-y-4"
    >
      <div className="font-bold">Contact Details</div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="e.g. 024XXXXXXX"
          value={order.customerPhone || ''}
          onChange={(e) =>
            onUpdateOrder({
              ...order,
              customerPhone: formatTo233(e.target.value),
            })
          }
          className="w-full border-2 border-gray-200 rounded-xl p-3 resize-none focus:border-[#7a1d1d] outline-none"
        />
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white rounded-2xl p-4 border-2 border-gray-200 will-change-transform space-y-4"
    >
      <div className="font-bold">Delivery Details</div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Location
        </label>
        <textarea
          placeholder="Describe your location or use auto-detect"
          value={order.customerLocation || ''}
          onChange={(e) =>
            onUpdateOrder({
              ...order,
              customerLocation: e.target.value,
            })
          }
          className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-[#7a1d1d] outline-none"
          rows={3}
        />
      </div>
    </motion.div>
  </>
)}


          {/* Order Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-200"
          >
            <p className="text-sm text-gray-700">
              📝 Your order will be confirmed via {order.deliveryMode === 'delivery' ? 'Snapchat or WhatsApp' : 'Snapchat or WhatsApp'}. 
              We'll send you pickup/delivery details!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Sticky Footer */}
     <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-lg">  
        <div className="max-w-2xl mx-auto">
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-700">GH₵{total - (order.deliveryMode === 'delivery' ? DELIVERY_FEE : 0) - (SERVICE_FEE)}</span>
            </div>
            {order.deliveryMode === 'delivery' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="text-gray-700">GH₵{DELIVERY_FEE}</span>
              </div>
            )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Service Fee</span>
                <span className="text-gray-700">GH₵{SERVICE_FEE}</span>
              </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-bold text-[#7a1d1d]">GH₵{total}</span>
            </div>
          </div>
          <button
  onClick={onConfirm}
  disabled={
    order.deliveryMode === 'delivery' &&
    (!order.customerPhone || !order.customerLocation)
  }
  className={`w-full py-5  rounded-2xl font-bold text-lg transition-colors ${
    order.deliveryMode === 'delivery' &&
    (!order.customerPhone || !order.customerLocation)
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-[#7a1d1d] text-white hover:bg-[#6a1717]'
  }`}
>
  Confirm Order
</button>
        </div>
      </div>
    </div>
  );
}
