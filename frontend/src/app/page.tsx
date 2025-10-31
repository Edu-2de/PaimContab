'use client';
import Header from '@/components/Header';
import Hero1 from '@/components/Hero';
import Features from '@/components/Features';
import Footer1 from '@/components/Footer';
import BriefExamples from '@/components/BriefExamples';
import Plans from '@/components/Plans';
import About from '@/components/About';
import { useRef, useEffect } from 'react';

export default function App() {
  const plansRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef<HTMLDivElement>(null);

  // Scroll automático para seção de planos se houver #plans na URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#plans' && plansRef.current) {
        // Pequeno delay para garantir que a página carregou
        setTimeout(() => {
          plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, []);

  return (
    <div>
      <Header />
      <Hero1 plansRef={plansRef} briefRef={briefRef} />
      <About />
      <Features />
      <BriefExamples briefRef={briefRef} />
      <Plans plansRef={plansRef} />
      <Footer1 />
    </div>
  );
}
