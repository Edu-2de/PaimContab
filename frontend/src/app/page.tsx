"use client";
import Header from '@/components/Header1';
import Hero1 from '@/components/Hero';
import Features from '@/components/Features1';
import Footer1 from '@/components/Footer';
import BriefExamples from '@/components/BriefExamples1';
import Plans from '@/components/Plans12';
import About from '@/components/About1';
import { useRef } from 'react';

export default function App() {
  const plansRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef<HTMLDivElement>(null);

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