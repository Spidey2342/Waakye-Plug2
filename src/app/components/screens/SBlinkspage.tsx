  import { motion } from 'motion/react';
  import { ChevronLeft, Plus, Minus, Check } from 'lucide-react';
  import {  BREAKFAST_EXTRAS, calculateBreakfastTotal } from '@/app/types/orderTypes';
  import { RadioGroup } from '@/app/components/ui/radio-group';
  import { Checkbox } from '@/app/components/ui/checkbox';
import { Breakfast, Sbreakfast } from '../../types/orderTypes';
import { S_Breakfast } from '@/app/types/orderTypes';
 interface SBlinkspageProps {
  order: Breakfast;
  onUpdateOrder: (order: Breakfast) => void;
  onBack: () => void;
  onContinue: () => void;
}

  export function SBlinkspage({ order, onUpdateOrder, onBack, onContinue }: SBlinkspageProps) {
   const updateDrink = (drink: Sbreakfast) => {
  onUpdateOrder({ ...order, drink });
};
   

    const toggleExtra = (extraId: string) => {
      const newExtras = order.extras.includes(extraId)
        ? order.extras.filter(id => id !== extraId)
        : [...order.extras, extraId];
      
      onUpdateOrder({ ...order, extras: newExtras });
    };

   const total = calculateBreakfastTotal(order);

    return (
       <div className="min-h-[100dvh] bg-[#fefaf4] flex flex-col [webkit-tap-highlight-color:transparent]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg">Build Your Breakfast</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-40  [-webkit-overflow-scrolling:touch]">
          <div className="max-w-2xl mx-auto p-4 space-y-8">
 <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
<div className="grid grid-cols-3 gap-3">
  {(Object.keys(S_Breakfast) as Sbreakfast[]).map((drink) => {
    const drinkData = S_Breakfast[drink];
    const isSelected = order.drink === drink;

    return (
        <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
               key={drink}
            >
      <button
       
       onClick={() => updateDrink(drink)}
        className={`relative p-4 rounded-xl border-2 transition-all ${
          isSelected
            ? 'border-[#7a1d1d] bg-[#7a1d1d]/5'
            : 'border-gray-200 bg-white'
        }`}
      >
        <div className="text-3xl mb-2">
          {drink === 'tea' && '🍵'}
          {drink === 'lipton' && '🍋'}
          {drink === 'coffee' && '☕'}
        </div>

        <div className="font-bold text-sm">{drinkData.name}</div>
        <div className="text-[#7a1d1d] font-bold">
          GH₵{drinkData.price}
        </div>
      </button>
  </motion.section>

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
                {BREAKFAST_EXTRAS.map((extra) => {
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
  {extra.id === 'breadandvegitableeggs' && '🍞🥚'}
  {extra.id === 'breadandeggs' && '🍞🥚'}
  {extra.id === 'sausage' && '🌭'}
  {extra.id === 'boiledegg' && '🥚'}
  {extra.id === 'bakedbeans' && '🥫'}
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
