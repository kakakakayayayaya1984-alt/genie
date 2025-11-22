import LayoutEffect from '@/src/components/LayoutEffect';
import SectionWrapper from '@/src/components/SectionWrapper';
import {
  BellAlertIcon,
  ChartBarIcon,
  ClockIcon,
  LinkSlashIcon,
  PhoneIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import GradientWrapper from '../../GradientWrapper';

const Features = () => {
  const featuresList = [
    {
      icon: <PhoneIcon className="h-6 w-6" />,
      title: 'Stop missing phone calls and bookings',
      desc: 'Room Mitra answers instantly during peak hours or staff shortages, ensuring no enquiry or booking is lost.',
    },
    {
      icon: <ChartBarIcon className="h-6 w-6" />,
      title: 'Increase onsite revenue through smart upsells',
      desc: 'Promote spa, dining, upgrades, activities and services at the right moment, boosting guest spend without staff involvement.',
    },
    {
      icon: <LinkSlashIcon className="h-6 w-6" />,
      title: 'Reduce dependency on WhatsApp and fragmented workflows',
      desc: 'Unify calls, requests, and messages into one system instead of juggling WhatsApp chats, phone calls and manual notes.',
    },
    {
      icon: <UsersIcon className="h-6 w-6" />,
      title: 'Short-staffed teams can run efficiently',
      desc: 'The AI assistant handles repetitive queries, logs requests, routes tasks, and frees staff for high-touch guest service.',
    },
    {
      icon: <BellAlertIcon className="h-6 w-6" />,
      title: 'Centralized request tracking improves service speed',
      desc: 'Every request — housekeeping, F&B, maintenance or concierge — is assigned, timestamped, and tracked end-to-end.',
    },
    {
      icon: <ClockIcon className="h-6 w-6" />,
      title: '24/7 consistent guest experience',
      desc: 'AI never takes breaks or misses calls. Guests receive accurate, instant support day and night.',
    },
  ];

  return (
    <SectionWrapper id="why">
      <div className="custom-screen text-gray-300">
        <GradientWrapper
          className="mt-16 sm:mt-28"
          wrapperclassname="max-w-3xl h-[250px] top-12 inset-0 sm:h-[300px] lg:h-[300px]"
        >
          <LayoutEffect
            className="duration-1000 delay-300"
            isInviewState={{
              trueState: 'opacity-100',
              falseState: 'opacity-0 translate-y-6',
            }}
          >
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-gray-50 text-3xl font-semibold sm:text-4xl">
                Why Hotels Need This Now
              </h2>
              <p className="mt-3 text-md">Hospitality Is Changing. Your Operations Should Too.</p>
            </div>
          </LayoutEffect>
          <LayoutEffect
            className="duration-1000 delay-500"
            isInviewState={{
              trueState: 'opacity-100',
              falseState: 'opacity-0',
            }}
          >
            <div className="relative mt-12">
              <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featuresList.map((item, idx) => (
                  <li
                    key={idx}
                    className="space-y-3 p-4 rounded-xl shadow"
                    style={{
                      background:
                        'radial-gradient(157.73% 157.73% at 50% -29.9%, rgba(22, 16, 50, 0.9) 0%, hsla(213, 27%, 84%, 0.00) 100%)',
                    }}
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-700 rounded-lg text-gray-50">
                      {item.icon}
                    </div>
                    <h3 className="text-lg text-gray-50 font-semibold">{item.title}</h3>
                    <p className="text-sm">{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </LayoutEffect>
        </GradientWrapper>
      </div>
    </SectionWrapper>
  );
};

export default Features;
