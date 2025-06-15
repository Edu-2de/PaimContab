"use client";
import Header from '@/components/header';
import Hero1 from '@/components/hero1';
import Features from '@/components/features';
import Footer1 from '@/components/footer1';
import BriefExamples from '@/components/briefExamples';
import Plans from '@/components/plans';
import About from '@/components/about';
import { useRef } from 'react';

export default function App() {
  const plansRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <Header />
      <Hero1 plansRef={plansRef}/>
      <About />
      <Features />
      <BriefExamples />
      <Plans plansRef={plansRef} />
      <Footer1 />
    </div>
  );
}