import FeedbackPage from './FeedbackPage';
import GradientWrapper from '@/src/components/GradientWrapper';
import LayoutEffect from '@/src/components/LayoutEffect';

export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const hotel = typeof sp?.h === 'string' ? sp.h : '';

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
              className="mt-8 sm:mt-10"
              wrapperclassname="max-w-3xl h-[250px] top-12 inset-0 sm:h-[300px] lg:h-[300px]"
            >
              <FeedbackPage hotel={hotel} />;
            </GradientWrapper>
          </div>
        </LayoutEffect>
      </div>
    </>
  );
}
