'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { ChevronLeft, Minus, Plus, Trash2, Package, Truck } from 'lucide-react';
import { MenuItemThumbnail } from '@/app/components/MenuItemThumbnail';
import { useCart, CartLine, lineUnitPrice } from '@/app/context/CartContext';
import { DELIVERY_FEE, SERVICE_FEE } from '@/app/types/orderTypes';

interface OrderSummaryScreenProps {
  onBack: () => void;
  onConfirm: () => void;
}

export function OrderSummaryScreen({ onBack, onConfirm }: OrderSummaryScreenProps) {
  const {
    lines, updateQuantity, removeLine,
    deliveryMode, toggleDeliveryMode,
    customerPhone, setCustomerPhone,
    customerLocation, setCustomerLocation,
    itemsSubtotal, totalPrice,
  } = useCart();

  const [locating, setLocating] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported on this device');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomerLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        setLocating(false);
      },
      () => {
        alert('Unable to fetch location. Please enter manually.');
        setLocating(false);
      }
    );
  };

  const formatTo233 = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '').trim();
    if (cleaned.startsWith('0')) return '233' + cleaned.slice(1);
    if (cleaned.startsWith('233')) return cleaned;
    return cleaned;
  };

  const baseItem = (line: CartLine) => line.items.find((i) => i.category === 'base' || i.category === 'combo');
  const otherItems = (line: CartLine) => line.items.filter((i) => i.category !== 'base' && i.category !== 'combo');

  const isEmpty = lines.length === 0;

  return (
    <div className="min-h-[100dvh] bg-[#fefaf4] flex flex-col [webkit-tap-highlight-color:transparent]">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={onBack} className="p-3 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">Order Summary</h1>
          <div className="w-10" />
        </div>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <button onClick={onBack} className="bg-[#7a1d1d] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#6a1717] transition-colors">
            Back to Menu
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto pb-40 [-webkit-overflow-scrolling:touch]">
            <div className="max-w-2xl mx-auto p-4 space-y-3">

              {/* ── Cart lines ── */}
              <div className="space-y-2.5">
                {lines.map((line, i) => (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MenuItemThumbnail imageUrl={baseItem(line)?.imageUrl} category={baseItem(line)?.category ?? 'base'} size="md" />
                        <div>
                          <div className="font-bold text-sm">{baseItem(line)?.name ?? 'Item'}</div>
                          <div className="text-xs text-gray-500">GH₵{lineUnitPrice(line)} each</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => (line.quantity === 1 ? removeLine(line.id) : updateQuantity(line.id, -1))}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                        >
                          {line.quantity === 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <div className="w-6 text-center font-bold text-sm">{line.quantity}</div>
                        <button
                          onClick={() => updateQuantity(line.id, 1)}
                          className="w-8 h-8 rounded-full bg-[#7a1d1d] text-white flex items-center justify-center hover:bg-[#6a1717]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {otherItems(line).length > 0 && (
                      <div className="pt-2 border-t border-gray-100 space-y-1">
                        {otherItems(line).map((item) => (
                          <div key={item.id} className="flex justify-between text-xs text-gray-500">
                            <span>{item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}</span>
                            <span>GH₵{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-bold">
                      <span>Line total</span>
                      <span className="text-[#7a1d1d]">GH₵{lineUnitPrice(line) * line.quantity}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={onBack}
                className="w-full py-3 rounded-2xl border border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:bg-white transition-colors"
              >
                + Add another item
              </button>

              {/* ── Delivery mode ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
              >
                <div className="font-bold text-sm mb-3">Delivery Mode</div>
                <div className="grid grid-cols-2 gap-3">
                  <button disabled className="p-4 rounded-xl border border-gray-200 bg-gray-50 cursor-not-allowed opacity-60">
                    <Package className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <div className="font-bold text-sm">Pickup</div>
                    <div className="text-xs text-gray-500 mt-1">Coming soon</div>
                  </button>

                  <button
                    onClick={toggleDeliveryMode}
                    className={`p-4 rounded-xl border transition-all ${
                      deliveryMode === 'delivery' ? 'border-[#7a1d1d] bg-[#7a1d1d]/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Truck className={`w-6 h-6 mx-auto mb-2 ${deliveryMode === 'delivery' ? 'text-[#7a1d1d]' : 'text-gray-400'}`} />
                    <div className="font-bold text-sm">Delivery</div>
                    <div className="text-xs text-gray-500 mt-1">+GH₵{DELIVERY_FEE}</div>
                  </button>
                </div>
              </motion.div>

              {/* ── Contact + delivery details merged into one card ── */}
              {deliveryMode === 'delivery' && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="e.g. 024XXXXXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(formatTo233(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl p-3 focus:border-[#7a1d1d] outline-none text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Delivery Location</label>
                      <button onClick={detectLocation} disabled={locating} className="text-xs font-bold text-[#7a1d1d] hover:underline disabled:opacity-50">
                        {locating ? 'Locating…' : 'Auto-detect'}
                      </button>
                    </div>
                    <textarea
                      placeholder="Describe your location or use auto-detect"
                      value={customerLocation}
                      onChange={(e) => setCustomerLocation(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 focus:border-[#7a1d1d] outline-none text-sm"
                      rows={3}
                    />
                  </div>
                </motion.div>
              )}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-gray-400 text-center px-2"
              >
                📝 Your order will be confirmed via WhatsApp — we'll send pickup/delivery details there.
              </motion.p>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-lg">
            <div className="max-w-2xl mx-auto">
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-700">GH₵{itemsSubtotal}</span>
                </div>
                {deliveryMode === 'delivery' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="text-gray-700">GH₵{DELIVERY_FEE}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Service Fee</span>
                  <span className="text-gray-700">GH₵{SERVICE_FEE}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-[#7a1d1d]">GH₵{totalPrice}</span>
                </div>
              </div>
              <button
                onClick={onConfirm}
                disabled={deliveryMode === 'delivery' && (!customerPhone || !customerLocation)}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors ${
                  deliveryMode === 'delivery' && (!customerPhone || !customerLocation)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#7a1d1d] text-white hover:bg-[#6a1717]'
                }`}
              >
                Confirm Order
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}