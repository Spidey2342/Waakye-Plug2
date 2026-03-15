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

const handleSnapchat = () => {
  window.open(
    'https://www.snapchat.com/add/tripledspxxidey?share_id=sfujXW5rNMM&locale=en-GB',
    '_blank'
  );

  setTimeout(completeOrder, 500);
};

const handleWhatsApp = () => {
  const phoneNumber = '233xxxxxxxxx';
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
            {/* Snapchat Option */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleSnapchat}
              className="w-full bg-yellow-400 text-gray-900 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-yellow-500 transition-colors shadow-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838 0 .149-.06.42-.585.719-.585.319-1.34.483-2.198.483-.12 0-.24-.008-.359-.016-.254-.022-.494-.045-.734-.045-.27 0-.411.03-.465.046-.09.03-.135.091-.135.15 0 .045.015.09.045.119l.015.015c.12.135 1.064.824 1.544 1.244.494.42 1.006.959 1.424 1.589.405.614.645 1.244.645 1.694 0 .359-.135.629-.359.749-.09.045-.226.075-.359.075-.254 0-.569-.135-1.064-.569-.449-.404-.884-.959-1.289-1.634-.314-.539-.584-1.096-.734-1.514-.074-.21-.164-.344-.284-.449a.546.546 0 0 0-.345-.12c-.12 0-.226.045-.329.135-.21.18-.359.525-.359 1.109 0 .584.105 1.259.21 1.873.09.495.18 1.006.18 1.424 0 .314-.045.584-.149.779-.135.24-.359.359-.644.359-.195 0-.389-.06-.584-.12-.494-.149-.989-.524-1.469-1.079-.404-.464-.734-1.019-1.006-1.514-.21-.359-.345-.644-.449-.824-.045-.074-.074-.119-.09-.149a.289.289 0 0 0-.195-.089c-.09 0-.18.029-.27.089-.12.074-.21.21-.27.42-.074.254-.119.614-.119 1.079 0 .584.105 1.259.21 1.873.09.495.18 1.006.18 1.424 0 .314-.045.584-.149.779-.135.24-.359.359-.644.359-.195 0-.389-.06-.584-.12-.494-.149-.989-.524-1.469-1.079-.404-.464-.734-1.019-1.006-1.514-.21-.359-.345-.644-.449-.824-.045-.074-.074-.119-.09-.149a.289.289 0 0 0-.195-.089c-.09 0-.18.029-.27.089-.12.074-.21.21-.27.42-.074.254-.119.614-.119 1.079 0 .584.105 1.259.21 1.873.09.495.18 1.006.18 1.424 0 .314-.045.584-.149.779-.135.24-.359.359-.644.359-.195 0-.389-.06-.584-.12-.494-.149-.989-.524-1.469-1.079-.404-.464-.734-1.019-1.006-1.514-.21-.359-.345-.644-.449-.824-.045-.074-.074-.119-.09-.149a.289.289 0 0 0-.195-.089c-.09 0-.18.029-.27.089-.12.074-.21.21-.27.42-.074.254-.119.614-.119 1.079 0 .584.105 1.259.21 1.873.09.495.18 1.006.18 1.424 0 .314-.045.584-.149.779-.135.24-.359.359-.644.359-.195 0-.389-.06-.584-.12-.494-.149-.989-.524-1.469-1.079-.404-.464-.734-1.019-1.006-1.514-.21-.359-.345-.644-.449-.824l-.09-.149a.289.289 0 0 0-.195-.089c-.09 0-.18.029-.27.089-.12.074-.21.21-.27.42-.074.254-.119.614-.119 1.079 0 .584.105 1.259.21 1.873.09.495.18 1.006.18 1.424 0 .314-.045.584-.149.779-.135.24-.359.359-.644.359-.195 0-.389-.06-.584-.12-.494-.149-.989-.524-1.469-1.079-.404-.464-.734-1.019-1.006-1.514-.21-.359-.345-.644-.449-.824-.045-.074-.074-.119-.09-.149a.289.289 0 0 0-.195-.089c-.09 0-.18.029-.27.089-.12.074-.21.21-.27.42-.074.254-.119.614-.119 1.079 0 .584.105 1.259.21 1.873.09.495.18 1.006.18 1.424 0 .584-.225 1.006-.584 1.214-.254.135-.569.21-.899.21-1.199 0-2.477-.584-3.506-1.634-.899-.914-1.544-2.063-1.544-3.177 0-.914.374-1.694.989-2.198.554-.464 1.244-.719 1.964-.719.195 0 .389.015.584.045.554.074 1.006.254 1.394.509.135.09.254.195.359.314l.105.105c.074.074.119.119.18.164.015 0 .029.015.045.015.045 0 .074-.029.104-.074.03-.06.045-.149.045-.27 0-.195-.029-.494-.074-.884-.045-.404-.09-.899-.09-1.469 0-.855.12-1.679.344-2.402.449-1.469 1.379-2.447 2.611-2.789.539-.164 1.139-.254 1.769-.254z"/>
              </svg>
              <div>
                <div>Confirm via Snapchat</div>
                <div className="text-xs font-normal">Fastest reply ⚡</div>
              </div>
            </motion.button>

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
