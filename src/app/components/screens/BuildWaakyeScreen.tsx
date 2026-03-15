  import { motion } from 'motion/react';
  import { ChevronLeft, Plus, Minus, Check } from 'lucide-react';
  import { BowlSize, OrderItem, BOWL_SIZES, PROTEINS, EXTRAS, calculateOrderTotal } from '@/app/types/orderTypes';
  import { RadioGroup } from '@/app/components/ui/radio-group';
  import { Checkbox } from '@/app/components/ui/checkbox';

  interface BuildWaakyeScreenProps {
    order: OrderItem;
    onUpdateOrder: (order: OrderItem) => void;
    onBack: () => void;
    onContinue: () => void;
  }

  export function BuildWaakyeScreen({ order, onUpdateOrder, onBack, onContinue }: BuildWaakyeScreenProps) {
    const updateSize = (size: BowlSize) => {
      onUpdateOrder({ ...order, size });
    };

    const updateProtein = (proteinId: string, delta: number) => {
      const currentQty = order.proteins[proteinId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      const newProteins = { ...order.proteins };
      if (newQty === 0) {
        delete newProteins[proteinId];
      } else {
        newProteins[proteinId] = newQty;
      }
      
      onUpdateOrder({ ...order, proteins: newProteins });
    };

    const toggleExtra = (extraId: string) => {
      const newExtras = order.extras.includes(extraId)
        ? order.extras.filter(id => id !== extraId)
        : [...order.extras, extraId];
      
      onUpdateOrder({ ...order, extras: newExtras });
    };

    const total = calculateOrderTotal(order);

    return (
      <div className="min-h-[100dvh] bg-[#fefaf4] flex flex-col [webkit-tap-highlight-color:transparent]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg">Build Your Waakye</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-40  [-webkit-overflow-scrolling:touch]">
          <div className="max-w-2xl mx-auto p-4 space-y-8">
            
            {/* Bowl Size Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-bold text-xl mb-4">Choose Your Size</h2>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(BOWL_SIZES) as BowlSize[]).map((size) => {
                  const sizeData = BOWL_SIZES[size];
                  const isSelected = order.size === size;
                  
                  return (
                    <button
                      key={size}
                      onClick={() => updateSize(size)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-[#7a1d1d] bg-[#7a1d1d]/5'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-[#7a1d1d] rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      
                      {/* Bowl Icon */}
                      <div className={`text-3xl mb-2 transition-transform ${isSelected ? 'scale-110' : ''}`}>
                        🍚
                      </div>
                      
                      <div className="font-bold text-sm">{sizeData.name}</div>
                      <div className="text-[#7a1d1d] font-bold mt-1">GH₵{sizeData.price}</div>
                      <div className="text-xs text-gray-500 mt-1">{sizeData.description}</div>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            {/* Proteins Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-bold text-xl mb-4">Add Proteins</h2>
              <div className="space-y-3">
                {PROTEINS.map((protein) => {
                  const quantity = order.proteins[protein.id] || 0;
                  const isActive = quantity > 0;
                  
                  return (
                    <div
                      key={protein.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        !protein.available
                          ? 'bg-gray-50 border-gray-200 opacity-50'
                          : isActive
                          ? 'border-[#7a1d1d] bg-[#7a1d1d]/5'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {protein.id === 'egg' && '🥚'}
                          {protein.id === 'meat' && '🥩'}
                          {protein.id === 'sausage' && '🌭'}
                          {protein.id === 'fish' && '🐟'}
                        </div>
                        <div>
                          <div className="font-bold">{protein.name}</div>
                          <div className="text-sm text-gray-600">
                            {protein.available ? `GH₵${protein.price} each` : 'Sold Out'}
                          </div>
                        </div>
                      </div>
                      
                      {protein.available && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateProtein(protein.id, -1)}
                            disabled={quantity === 0}
                            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="w-8 text-center font-bold">{quantity}</div>
                          <button
                            onClick={() => updateProtein(protein.id, 1)}
                            className="w-10 h-10 rounded-full bg-[#7a1d1d] text-white flex items-center justify-center hover:bg-[#6a1717]"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.section>

            {/* Extras Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="font-bold text-xl mb-4">Extras</h2>
              <div className="space-y-2">
                {EXTRAS.map((extra) => {
                  const isChecked = order.extras.includes(extra.id);
                  
                  return (
                    <label
                      key={extra.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#4ade80] bg-green-50'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleExtra(extra.id)}
                        />
                        <div>
                          <div className="font-bold">{extra.name}</div>
                          <div className="text-sm text-gray-600">+GH₵{extra.price}</div>
                        </div>
                      </div>
                      
                      <div className="text-xl">
                        {extra.id === 'gari' && '🌾'}
                        {extra.id === 'salad' && '🥗'}
                        {extra.id === 'shito' && '🌶️'}
                        {extra.id === 'wele' && '🥓'}
                        {extra.id === 'drink' && '🥤'}
                      </div>
                    </label>
                  );
                })}
              </div>
            </motion.section>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-lg">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-bold text-[#7a1d1d]">GH₵{total}</span>
            </div>
            <button
              onClick={onContinue}
              className="w-full bg-[#7a1d1d] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#6a1717] transition-colors"
            >
              Review Order
            </button>
          </div>
        </div>
      </div>
    );
  }
