"use client"
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getCurrentUser } from "@/lib/services/user";

export function CTASection() {
  const t = useTranslations('CTA');
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuthenticated(Boolean(getCurrentUser()));
  }, []);

  if (isAuthenticated !== false) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-overlay filter blur-3xl"></div>
          </div>

          <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm text-white">{t('badge')}</span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl text-white mb-6">
              {t('headingLine1')}
              <span className="block mt-2">{t('headingLine2')}</span>
            </h2>

            <p className="text-xl text-orange-100 max-w-2xl mx-auto mb-10">
              {t('description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => router.push('/es/login?tab=register')}
                className="bg-white text-orange-600 hover:bg-orange-200 px-8 py-6 text-lg h-auto rounded-xl shadow-lg"
              >
                {t('buttonStart')}
              </Button>
              <Button
                onClick={() => router.push('/es/Explorar')}
                className="bg-white text-orange-600 hover:bg-orange-200 px-8 py-6 text-lg h-auto rounded-xl shadow-lg"
              >
                {t('buttonExplore')}
              </Button>
            </div>

            <p className="text-sm text-orange-100 mt-6">
              {t('footnote')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}