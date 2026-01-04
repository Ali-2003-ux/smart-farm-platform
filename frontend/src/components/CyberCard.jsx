import React from 'react';
import { motion } from 'framer-motion';

export const CyberCard = ({ children, className = '', title, icon }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative group ${className}`}
        >
            {/* Holographic Border Container */}
            <div className="absolute inset-0 bg-farm-card/90 backdrop-blur-xl rounded-xl clip-path-cyber border border-white/5 shadow-2xl overflow-hidden">
                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-[linear_gradient(transparent_50%,rgba(16,185,129,0.02)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

                {/* Glowing Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 boundary-corner border-t-2 border-l-2 border-farm-green opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 boundary-corner border-b-2 border-r-2 border-farm-green opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* Content Content - Z-indexed above background */}
            <div className="relative z-10 p-6 h-full flex flex-col">
                {(title || icon) && (
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                        <h3 className="text-farm-green font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                            {icon && <span className="text-farm-accent">{icon}</span>}
                            {title}
                        </h3>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-farm-green rounded-full animate-ping"></div>
                            <div className="w-1 h-1 bg-farm-green rounded-full"></div>
                        </div>
                    </div>
                )}
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </motion.div>
    );
};
