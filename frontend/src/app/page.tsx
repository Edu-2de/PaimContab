// ...existing code...
import Header from '@/components/header';
import Hero1 from '@/components/hero1';
import Features from '@/components/features';
import Footer1 from '@/components/footer1';
import BriefExamples from '@/components/briefExamples';
import Plans from '@/components/plans';
import About from '@/components/about';
// Remova imports e funções de alternância desnecessárias

function App() {
  return (
    <div>
      <Header />
      <Hero1 />
      <About />
      <Features />
      <BriefExamples />
      <Plans />
      <Footer1 />
    </div>
  );
}

export default App;
// ...existing code...