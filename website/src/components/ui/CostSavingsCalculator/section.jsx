import LayoutEffect from '../../LayoutEffect';
import SectionWrapper from '../../SectionWrapper';
import CostSavingsCalculator from './calculator';

export default function CostSavingsCalculatorSection() {
  return (
    <SectionWrapper id="savings-calculator">
      <div className="custom-screen text-gray-300">
        <LayoutEffect
          className="duration-1000 delay-300"
          isInviewState={{
            trueState: 'opacity-100',
            falseState: 'opacity-0 translate-y-6',
          }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-gray-50 text-3xl font-semibold sm:text-4xl">
              Calculate Your Cost Savings
            </h2>
            <p className="mt-3 text-md">Estimate Your Annual Value With Room Mitra</p>
          </div>
        </LayoutEffect>
        <LayoutEffect
          className="duration-1000 delay-300"
          isInviewState={{
            trueState: 'opacity-100',
            falseState: 'opacity-0 translate-y-6',
          }}
        >
          <div className="pt-8 mx-auto max-w-3xl">
            <CostSavingsCalculator />
          </div>
        </LayoutEffect>
      </div>
    </SectionWrapper>
  );
}
