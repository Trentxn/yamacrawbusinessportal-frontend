export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-surface-900 sm:text-4xl">
        About the Yamacraw Initiative
      </h1>
      <p className="mt-2 text-lg text-surface-500">
        Connecting and uplifting local businesses in the Yamacraw community.
      </p>

      {/* Minister section */}
      <div className="mt-10 flex flex-col items-center gap-8 rounded-2xl border border-surface-200 bg-white p-6 shadow-card sm:flex-row sm:items-start sm:p-8">
        <img
          src="/images/zane.jpg"
          alt="Minister Zane Enrico Lightbourne"
          className="h-48 w-48 flex-shrink-0 rounded-xl object-cover shadow-md sm:h-56 sm:w-56"
        />
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-surface-900 sm:text-2xl">
            Minister Zane Enrico Lightbourne
          </h2>
          <p className="mt-1 text-sm font-medium text-primary-600">
            Member of Parliament for Yamacraw
          </p>
          <p className="mt-4 text-surface-600 leading-relaxed">
            The Yamacraw Business Portal is an initiative sponsored by Minister
            Lightbourne's office, born from a sincere desire to give local
            businesses, contractors, and service providers the visibility they
            deserve. By creating a trusted, accessible directory for the
            Yamacraw constituency, we aim to strengthen the economic fabric of
            our community and make it easier for residents and visitors alike to
            discover the talented people and services right in their
            neighbourhood.
          </p>
        </div>
      </div>

      {/* Mission section */}
      <div className="mt-10 space-y-6">
        <h2 className="text-2xl font-bold text-surface-900">Our Mission</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold text-surface-900">
              Visibility
            </h3>
            <p className="mt-2 text-surface-600">
              Many talented businesses and contractors in Yamacraw go unnoticed
              simply because they lack an online presence. This portal gives
              them a professional, public-facing profile at no cost.
            </p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold text-surface-900">
              Connection
            </h3>
            <p className="mt-2 text-surface-600">
              We bridge the gap between residents looking for services and the
              local businesses that provide them — making it simple to find,
              contact, and support businesses in your own community.
            </p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold text-surface-900">
              Access
            </h3>
            <p className="mt-2 text-surface-600">
              Whether you need a plumber, a caterer, or a contractor, the
              portal puts the information you need at your fingertips —
              operating hours, contact details, photos, and more.
            </p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold text-surface-900">
              Community
            </h3>
            <p className="mt-2 text-surface-600">
              When we support local businesses, we invest in our neighbours,
              our families, and the future of Yamacraw. This platform is built
              with community pride at its heart.
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-10 space-y-4">
        <h2 className="text-2xl font-bold text-surface-900">How It Works</h2>
        <div className="space-y-4 text-surface-600">
          <p>
            <span className="font-semibold text-surface-900">For residents:</span>{' '}
            Browse the directory, search by category or keyword, and reach out
            to any business through our secure inquiry form — no account
            required.
          </p>
          <p>
            <span className="font-semibold text-surface-900">For businesses:</span>{' '}
            Register for a free account, create your listing with photos,
            hours, and a description of your services, then submit it for
            review. Once approved, your business is live and discoverable by
            the entire community.
          </p>
          <p>
            All listings are reviewed by our team before going live to ensure
            quality and trust across the platform.
          </p>
        </div>
      </div>
    </div>
  )
}
