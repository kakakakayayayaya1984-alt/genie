import FrontDesk from '@/src/components/ui/FrontDesk';
import Features from '@/src/components/ui/Features';
import Hero from '@/src/components/ui/Hero';
import Pricing from '@/src/components/ui/Pricing';
import UseCases from '@/src/components/ui/UseCases';
import BookADemo from '@/src/components/ui/BookADemo/bookADemo';
import CostSavingsCalculatorSection from '../components/ui/CostSavingsCalculator/section';

export default function Page() {
  return (
    <>
      <Hero />
      <UseCases />
      <FrontDesk />
      <CostSavingsCalculatorSection />
      <Features />
      <Pricing />
      <BookADemo />
    </>
  );
}
