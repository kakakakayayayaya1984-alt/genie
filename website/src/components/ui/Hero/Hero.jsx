import GradientWrapper from '@/src/components/GradientWrapper';
import HeroImg from '@/public/images/active-requests.png';
import LayoutEffect from '@/src/components/LayoutEffect';
import EnlargeableImage from '../EnlargeableImage';
import { TryVoiceAgent } from '../TryVoiceAgent/entry';

const Hero = () => (
  <section>
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
            <div className="space-y-5 max-w-3xl mx-auto text-center">
              <h1 className="text-4xl text-white bg-clip-text text-transparent bg-gradient-to-r font-extrabold mx-auto sm:text-5xl">
                Hotel&apos;s AI Voice Agent
              </h1>
              <h2 className="text-4xl text-white bg-clip-text text-transparent bg-gradient-to-r font-extrabold mx-auto sm:text-5xl">
                Available 24/7
              </h2>
              <p className="max-w-xl mx-auto text-gray-200 text-lg">
                Handle phone bookings, guest queries, and in-room service requests with a single
                intelligent voice agent. No hold times, no missed calls, no operational chaos.
              </p>
              <TryVoiceAgent />
            </div>

            <LayoutEffect
              className="duration-1000 delay-300"
              isInviewState={{
                trueState: 'opacity-100',
                falseState: 'opacity-0 translate-y-6',
              }}
            >
              <div className="pt-6">
                <EnlargeableImage
                  alt="active-requests"
                  src={HeroImg}
                  loading={'lazy'}
                  className="rounded-lg border border-0 shadow-lg"
                />
              </div>
            </LayoutEffect>
          </GradientWrapper>
        </div>
      </LayoutEffect>
    </div>
    <hr className="w-[75%] mx-auto border-gray-700 mt-10" />
  </section>
);

export default Hero;
