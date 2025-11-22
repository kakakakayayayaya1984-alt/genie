import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getAllPostSlugs, getPostBySlug } from '@/src/lib/blog';
import ContactUsForm from '@/src/components/ContactUsForm';
import { absoluteUrl } from '@/src/lib/urls';
import LayoutEffect from '@/src/components/LayoutEffect';
import GradientWrapper from '@/src/components/GradientWrapper';

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) return { title: 'Post not found' };

  const img = post.hero ? `/${post.hero.replace(/^\//, '')}` : '/room-mitra-logo.png';

  return {
    title: post.title,
    description: post.description || `${post.title} by ${post.author}`,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords:
      'hotel automation, in-room assistant, hospitality tech, voice assistant, Room Mitra, hotel guest experience',
    authors: [{ name: post.author }],
    robots: 'index, follow',
    openGraph: {
      title: post.title,
      description: post.description || undefined,
      url: `/blog/${post.slug}`,
      siteName: 'Room Mitra',
      images: [img],
      type: 'article',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@RoomMitra',
      creator: '@RoomMitra',
      title: post.title,
      description: post.description || undefined,
      images: [img],
    },
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostBySlug(slug);
  } catch {
    notFound();
  }

  // Build JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.hero ? absoluteUrl(post.hero) : absoluteUrl('/room-mitra-logo.png'),
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Room Mitra',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/room-mitra-logo.png'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${post.slug}`),
    },
  };

  return (
    <div className="custom-screen pt-12 pb-8">
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
            <div className="mx-auto max-w-3xl px-4 text-white">
              {/* JSON-LD script */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
              />
              <article>
                <header className="mb-6">
                  <h1 className="text-3xl font-bold">{post.title}</h1>
                  <p className="text-sm text-gray-400 mt-2">
                    By {post.author} on {new Date(post.date).toLocaleDateString()}
                  </p>
                </header>

                {post.hero && (
                  <div className="mb-8">
                    <Image
                      src={post.hero}
                      alt={post.title}
                      width={1200}
                      height={630}
                      className="w-full h-auto rounded-xl"
                      priority
                    />
                  </div>
                )}

                <div
                  className="prose-p:text-white prose-strong:text-white prose-a:text-indigo-400 prose-h2:text-white prose prose-lg prose-slate max-w-none
             prose-ol:list-decimal prose-li:my-2 prose-li:leading-relaxed
             marker:font-semibold"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                />
              </article>
            </div>

            <hr className="border-gray-300 max-w-3xl mx-auto my-20" />
            <ContactUsForm />
          </GradientWrapper>
        </div>
      </LayoutEffect>
    </div>
  );
}
