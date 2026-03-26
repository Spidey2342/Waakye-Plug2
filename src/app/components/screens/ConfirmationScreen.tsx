import { motion } from 'motion/react';
import { MessageCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { OrderItem, formatOrderMessage } from '@/app/types/orderTypes';



interface ConfirmationScreenProps {
  order: OrderItem;
  onDone: () => void;
  onSaveOrder: (order: OrderItem) => void;
}

export function ConfirmationScreen({ order, onDone, onSaveOrder }: ConfirmationScreenProps) {


  const [copied, setCopied] = useState(false);
  const message = formatOrderMessage(order);

  const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(message);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = message;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};
const completeOrder = () => {
  onSaveOrder(order);
  onDone();
};



const handleWhatsApp = () => {
  const phoneNumber = '2335370884801';
  const encodedMessage = encodeURIComponent(message);

  window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');

  setTimeout(completeOrder, 500);
};

  return (
    <div className="min-h-[100dvh] bg-[#fefaf4] flex items-center justify-center px-4 py-6 [webkit-tap-highlight-color:transparent]">
     <div className="max-w-md w-full pb-[env(safe-area-inset-bottom)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 will-change-transform"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-green-600" />
          </motion.div>

          <h1 className="text-2xl font-bold text-center mb-2">
            Almost There! 🎉
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Choose how you'd like to confirm your order
          </p>

          {/* Message Preview */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Your Message</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-sm text-[#7a1d1d] hover:text-[#6a1717]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto [-webkit-overflow-scrolling:touch]">
              {message}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
          

            {/* WhatsApp Option */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWhatsApp}
              className="w-full bg-green-500 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-green-600 transition-colors shadow-md"
            >
              <MessageCircle className="w-6 h-6" />
              <div>
                <div>Confirm via WhatsApp</div>
                <div className="text-xs font-normal">Preferred 👍</div>
              </div>
            </motion.button>
          </div>

          {/* Helper Text */}
          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-sm text-gray-700 text-center">
              💬 We'll reply with pickup/delivery details within minutes!
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600 pb-[env(safe-area-inset-bottom)]">
          <p className="font-bold text-[#7a1d1d]">Waakye Plug</p>
          <p>Thanks for ordering! 🙏</p>
        </div>
      </div>
    </div>
  );
}
