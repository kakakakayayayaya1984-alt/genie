import GradientWrapper from '@/src/components/GradientWrapper';
import LayoutEffect from '@/src/components/LayoutEffect';
import ContactUsForm from '@/src/components/ContactUsForm';

export default async function Page({ searchParams }) {
  const n = (s) => (typeof s === 'string' ? s : '');

  const sp = await searchParams;
  const plan = n(sp?.plan);
  const monthlySalary = n(sp?.monthlySalary);
  const staffCount = n(sp?.staffCount);
  const automationPercent = n(sp?.automationPercent);
  const dailyRoomRevenue = n(sp?.dailyRoomRevenue);
  const upsellPercent = n(sp?.upsellPercent);
  const market = n(sp?.market);

  return (
    <>
      <div className="custom-screen pt-28 pb-8">
        <LayoutEffect
          className="duration-1000 delay-300"
          isInviewState={{
            trueState: 'opacity-100',
            falseState: 'opacity-0',
          }}
        >
          <div>
            <GradientWrapper
              className="mt-16 sm:mt-28"
              wrapperclassname="max-w-3xl h-[250px] top-12 inset-0 sm:h-[300px] lg:h-[300px]"
            >
              <ContactUsForm
                plan={plan}
                monthlySalary={monthlySalary}
                staffCount={staffCount}
                automationPercent={automationPercent}
                dailyRoomRevenue={dailyRoomRevenue}
                upsellPercent={upsellPercent}
                market={market}
              />
            </GradientWrapper>
          </div>
        </LayoutEffect>
      </div>
    </>
  );
}
