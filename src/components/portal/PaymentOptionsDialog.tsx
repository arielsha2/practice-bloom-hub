import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Banknote, ArrowLeft, Gift } from "lucide-react";

interface PaymentOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const paymentOptions = [
  {
    id: "installments",
    icon: CreditCard,
    title: "תשלומים",
    subtitle: "10 695 ₪",
    price: "6950 ₪",
    description: "גמישות מקסימלית",
    url: "https://meshulam.co.il/quick_payment?b=e376c65543a9913786f2ffe0c97a0a18",
    badge: null,
  },
  {
    id: "cash",
    icon: Banknote,
    title: "תשלום אחד",
    subtitle: "תשלום חד-פעמי עם הנחה",
    price: "6450 ₪",
    description: "חיסכון של 500 נוספים₪",
    url: "https://meshulam.co.il/quick_payment?b=deaf4934c9000063786c3e30488b40f4",
    badge: "הנחה 500₪",
  },
];

export function PaymentOptionsDialog({ open, onOpenChange }: PaymentOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <DialogHeader className="text-center pb-2">
            <DialogTitle className="text-2xl font-serif">בחרי את אופן התשלום</DialogTitle>
          </DialogHeader>

          <motion.div className="space-y-4 mt-4" variants={containerVariants} initial="hidden" animate="visible">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <motion.a
                  key={option.id}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  variants={cardVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="flex items-center gap-4 p-5 rounded-xl bg-card border-2 border-border hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-foreground">{option.title}</h3>
                        {option.badge && (
                          <motion.span
                            className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Gift className="w-3 h-3" />
                            {option.badge}
                          </motion.span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">{option.subtitle}</p>
                      <p className="text-xl font-bold text-primary mt-1">{option.price}</p>
                      <p className="text-teal text-xs font-medium">{option.description}</p>
                    </div>

                    <motion.div
                      animate={{ x: [0, -5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-primary"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </motion.div>
                  </div>
                </motion.a>
              );
            })}
          </motion.div>

          <motion.p
            className="text-center text-muted-foreground text-sm mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            לחצי על האפשרות המועדפת עלייך
          </motion.p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
