import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  ClipboardDocumentCheckIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
  CurrencyDollarIcon,
  GlobeAmericasIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'AMU Logging',
    description: 'Effortlessly record every antimicrobial treatment with digital logbooks designed for speed and accuracy.',
    icon: ClipboardDocumentCheckIcon,
  },
  {
    name: 'Withdrawal Trackers',
    description: 'Automated alerts and tracking for withdrawal periods to ensure product safety and regulatory compliance.',
    icon: ChartBarIcon,
  },
  {
    name: 'Vet Assignment',
    description: 'Seamlessly connect with qualified veterinarians for oversight, prescriptions, and health consultations.',
    icon: UserGroupIcon,
  },
]

const steps = [
  {
    id: 1,
    title: 'Farm Signup',
    description: 'Create your farm profile and register your livestock inventory in minutes.',
  },
  {
    id: 2,
    title: 'Treatment Logging',
    description: 'Log treatments as they happen. The system automatically tracks dosage and withdrawal times.',
  },
  {
    id: 3,
    title: 'Compliance Reports',
    description: 'Generate detailed compliance reports for audits and health inspections with one click.',
  },
]

const stats = [
  { id: 1, name: 'Reduction in AMR', value: '30%' },
  { id: 2, name: 'Compliance Rate', value: '100%' },
  { id: 3, name: 'Farms Onboarded', value: '500+' },
]

export default function LearnMore() {
  // Intersection Observer for fade-in animations
  const [visibleSections, setVisibleSections] = useState({})
  const sectionRefs = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }))
          }
        })
      },
      { threshold: 0.1 }
    )

    const sections = sectionRefs.current
    sections.forEach((section) => {
      if (section) observer.observe(section)
    })

    return () => {
      sections.forEach((section) => {
        if (section) observer.unobserve(section)
      })
    }
  }, [])

  const addToRefs = (el) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el)
    }
  }

  const getAnimationClass = (id) => {
    return visibleSections[id]
      ? 'opacity-100 translate-y-0 transition-all duration-1000 ease-out'
      : 'opacity-0 translate-y-8 transition-all duration-1000 ease-out'
  }

  return (
    <div className="bg-white text-gray-900 font-sans">
      {/* Navigation / Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link to="/" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors">
          <span aria-hidden="true">←</span> Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative isolate overflow-hidden pt-14 pb-16 sm:pb-20">
         <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-200 to-primary-100 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl lg:max-w-lg">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Master AMU Compliance <span className="text-primary-600">Effortlessly</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Streamline antimicrobial usage tracking, ensure regulatory compliance, and contribute to global AMR reduction—all in one powerful platform.
              </p>
              <div className="mt-8 flex items-center gap-x-6">
                <Link
                  to="/register"
                  className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
                >
                  Get started
                </Link>
                <a href="#how-it-works" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors">
                  Learn how it works <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 lg:ml-10">
               {/* Placeholder for Video/Infographic */}
               <div className="relative rounded-2xl bg-gray-50 border border-gray-100 shadow-xl overflow-hidden aspect-video flex items-center justify-center group cursor-pointer hover:shadow-2xl transition-all duration-300">
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
                  <PlayCircleIcon className="relative z-10 h-20 w-20 text-primary-600/90 group-hover:text-primary-600 group-hover:scale-110 transition-transform duration-300" />
                  <span className="sr-only">Watch explainer video</span>
               </div>
               <p className="mt-4 text-center text-sm text-gray-500 italic">Watch how our platform simplifies compliance</p>
            </div>
          </div>
        </div>
      </div>

      {/* AMR Section (New) */}
      <div id="amr-info" className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div 
            id="amr-header" 
            ref={addToRefs} 
            className={`mx-auto max-w-2xl text-center mb-16 ${getAnimationClass('amr-header')}`}
          >
            <h2 className="text-base font-semibold leading-7 text-primary-600">The Silent Threat</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Antimicrobial Resistance (AMR)
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              AMR occurs when bacteria, viruses, fungi, and parasites change over time and no longer respond to medicines. This makes infections harder to treat and increases the risk of disease spread, severe illness, and death.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div 
                id="amr-1" 
                ref={addToRefs} 
                className={`flex flex-col bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-primary-200 transition-colors ${getAnimationClass('amr-1')}`}
                style={{ transitionDelay: '100ms' }}
              >
                <dt className="flex items-center gap-x-3 text-base font-bold leading-7 text-gray-900">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <GlobeAmericasIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                  </div>
                  Global Health Crisis
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">AMR is one of the top 10 global public health threats facing humanity. Without action, it could cause 10 million deaths annually by 2050.</p>
                </dd>
              </div>
              <div 
                id="amr-2" 
                ref={addToRefs} 
                className={`flex flex-col bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-primary-200 transition-colors ${getAnimationClass('amr-2')}`}
                style={{ transitionDelay: '200ms' }}
              >
                <dt className="flex items-center gap-x-3 text-base font-bold leading-7 text-gray-900">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <CurrencyDollarIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                  </div>
                  Economic Impact
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">AMR has significant economic costs. In addition to death and disability, prolonged illness results in longer hospital stays, the need for more expensive medicines, and financial challenges.</p>
                </dd>
              </div>
              <div 
                id="amr-3" 
                ref={addToRefs} 
                className={`flex flex-col bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-primary-200 transition-colors ${getAnimationClass('amr-3')}`}
                style={{ transitionDelay: '300ms' }}
              >
                <dt className="flex items-center gap-x-3 text-base font-bold leading-7 text-gray-900">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <ShieldExclamationIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                  </div>
                  Food Security
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Antimicrobials are essential for animal health. Resistance in food-producing animals can affect the food chain and threaten food security and rural livelihoods.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Features Grid - Dark Theme to match Landing */}
      <div id="features" className="py-24 sm:py-32 bg-primary-600">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div 
            id="features-header" 
            ref={addToRefs} 
            className={`mx-auto max-w-2xl text-center ${getAnimationClass('features-header')}`}
          >
            <h2 className="text-base font-semibold leading-7 text-primary-200">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Tools designed for modern farming
            </p>
            <p className="mt-6 text-lg leading-8 text-primary-100">
              Comprehensive features to help you manage livestock health and medication records efficiently.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, index) => (
                <div 
                  key={feature.name} 
                  id={`feature-${index}`} 
                  ref={addToRefs} 
                  className={`flex flex-col items-start ${getAnimationClass(`feature-${index}`)}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`rounded-xl p-3 bg-white mb-5`}>
                    <feature.icon className={`h-6 w-6 text-primary-600`} aria-hidden="true" />
                  </div>
                  <dt className="flex items-center gap-x-3 text-lg font-bold leading-7 text-white">
                    {feature.name}
                  </dt>
                  <dd className="mt-2 flex flex-auto flex-col text-base leading-7 text-primary-100">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="py-24 sm:py-32 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(#0284c7 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div 
            id="how-header" 
            ref={addToRefs}
            className={`mx-auto max-w-2xl text-center mb-16 ${getAnimationClass('how-header')}`}
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">Simple steps to compliance and better health management.</p>
          </div>
          
          <div className="relative">
            {/* Timeline Line (Desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  id={`step-${step.id}`} 
                  ref={addToRefs}
                  className={`bg-white border border-gray-100 rounded-2xl p-8 flex flex-col items-center text-center shadow-lg shadow-gray-200/50 ${getAnimationClass(`step-${step.id}`)}`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <div className={`flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 text-white font-bold text-xl mb-6 shadow-lg`}>
                    {step.id}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials / Stats */}
      <div className="relative bg-primary-600 py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div 
              id="testimonials-left" 
              ref={addToRefs} 
              className={getAnimationClass('testimonials-left')}
            >
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                Proven Results
              </h2>
              <p className="text-lg text-primary-100 mb-8">
                Farmers using our platform have seen significant improvements in herd health and regulatory compliance scores.
              </p>
              <figure className="border-l-4 border-white pl-6 py-4 bg-primary-800/30 rounded-r-2xl backdrop-blur-sm">
                <blockquote className="text-xl font-medium leading-8 text-white italic">
                  &quot;This platform transformed our record-keeping. We reduced our antimicrobial usage by 30% in the first year just by having better data.&quot;
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-x-4">
                  <div className="text-sm font-semibold text-white">John Doe</div>
                  <div className="text-sm text-primary-200">Dairy Farmer, Wisconsin</div>
                </figcaption>
              </figure>
            </div>

            <div 
              id="stats-right" 
              ref={addToRefs} 
              className={`grid grid-cols-1 gap-8 sm:grid-cols-2 ${getAnimationClass('stats-right')}`}
            >
              {stats.map((stat) => (
                <div key={stat.id} className="flex flex-col bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md hover:bg-white/20 transition-all duration-300">
                  <dt className="text-sm font-medium leading-6 text-primary-100">{stat.name}</dt>
                  <dd className="order-first text-3xl font-bold tracking-tight text-white">{stat.value}</dd>
                </div>
              ))}
              <div className="flex flex-col bg-white p-6 rounded-2xl border border-white shadow-xl shadow-primary-900/20 transform hover:-translate-y-1 transition-transform duration-300">
                 <p className="text-primary-600 font-bold text-lg mb-2">Join the movement</p>
                 <p className="text-gray-600 text-sm mb-4">Towards responsible and sustainable farming.</p>
                 <CheckCircleIcon className="w-10 h-10 text-primary-600 mt-auto self-end" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="relative isolate overflow-hidden bg-white px-6 py-24 shadow-sm sm:px-24 xl:py-32 border-t border-gray-100">
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Ready to get started?
          <br />
          Join hundreds of farmers today.
        </h2>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/register"
            className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-200 hover:bg-primary-500 hover:shadow-primary-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all duration-200"
          >
            Get started
          </Link>
          <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors">
            Log in <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
