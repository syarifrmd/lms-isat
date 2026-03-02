import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SlideInProps {
    children: ReactNode;
    /** Direction the element slides in FROM */
    direction?: 'left' | 'right' | 'up';
    /** Delay in seconds before animation starts */
    delay?: number;
    className?: string;
}

const slideVariants = {
    left:  { hidden: { opacity: 0, x: -56 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 56 },  visible: { opacity: 1, x: 0 } },
    up:    { hidden: { opacity: 0, y: 32 },   visible: { opacity: 1, y: 0 } },
};

const ease = [0.22, 1, 0.36, 1] as const; // expo-out — feels snappy & smooth

export function SlideIn({
    children,
    direction = 'left',
    delay = 0,
    className,
}: SlideInProps) {
    const v = slideVariants[direction];
    return (
        <motion.div
            className={className}
            initial={v.hidden}
            animate={v.visible}
            transition={{ duration: 0.55, ease, delay }}
        >
            {children}
        </motion.div>
    );
}

export function FadeIn({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay }}
        >
            {children}
        </motion.div>
    );
}
