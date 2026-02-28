import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import heroFarm from '../assets/hero_farm.png'
import labSamples from '../assets/lab_samples.png'
import bacteriaAbstract from '../assets/bacteria_abstract.png'
import livestock from '../assets/livestock.png'
import dashboardMockup from '../assets/dashboard_mockup.png'

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [activeSection, setActiveSection] = useState('hero')
  const [showScrollLine, setShowScrollLine] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    const observerOptions = {
      root: containerRef.current,
      threshold: 0.5,
    }

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
          entry.target.classList.add('reveal-visible');
        }
      });
    }, observerOptions);

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.snap-section').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    return () => {
      sectionObserver.disconnect();
      revealObserver.disconnect();
    };
  }, []);

  // Trigger line animation when section changes
  useEffect(() => {
    setShowScrollLine(true);
    const timer = setTimeout(() => setShowScrollLine(false), 1000);
    return () => clearTimeout(timer);
  }, [activeSection]);

  const sections = [
    { id: 'hero', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'process', label: 'Process' },
    { id: 'advantages', label: 'Advantages' },
    { id: 'testimonials', label: 'Testimonials' }
  ];

  const isDarkTheme = true; // All sections are now part of the "Arctic Dark" theme

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setMobileMenuOpen(false)
  }

  return (
    <div className="bg-[#14171a] font-sans text-slate-900 selection:bg-teal-accent/20 selection:text-teal-accent overflow-hidden h-screen">
      {/* Section Transition Line */}
      {showScrollLine && (
        <div className="fixed top-0 left-0 h-[3px] bg-teal-accent z-[100] animate-line-sweep pointer-events-none shadow-[0_0_15px_rgba(0,192,150,0.6)]" />
      )}

      {/* Side Navigation (CR7 Inspired Line Cut Style) */}
      <div className="fixed left-24 top-1/2 -translate-y-1/2 z-[60] hidden lg:flex flex-col h-[75vh] justify-between">
        {/* Continuous Background Line (The "Cut") */}
        <div className={`absolute left-0 top-0 bottom-0 w-[1px] transition-colors duration-500 ${isDarkTheme ? 'bg-white/20' : 'bg-slate-900/10'}`} />

        {/* Sliding Active Highlight Indicator */}
        <div
          className="absolute left-[-1px] w-[3px] bg-teal-accent transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_20px_rgba(0,192,150,0.5)] z-20"
          style={{
            height: `${100 / sections.length}%`,
            top: `${(sections.findIndex(s => s.id === activeSection) * (100 / sections.length))}%`,
          }}
        />

        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className="group relative flex items-center h-full outline-none"
          >
            {/* Split Text Layout for perfect "Cut" - Gap matches tracking-[0.35em] */}
            <div className={`relative flex items-center h-full text-[13px] font-black uppercase tracking-[0.35em] transition-all duration-500 ${activeSection === section.id
              ? 'text-teal-accent scale-105'
              : `${isDarkTheme ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-teal-accent'}`
              }`}>
              {/* First Letter (To the left of the center line) */}
              <span className="absolute right-[0.175em] whitespace-nowrap">
                {section.label[0]}
              </span>

              {/* The Rest (To the right of the center line) */}
              <span className="absolute left-[0.175em] whitespace-nowrap">
                {section.label.slice(1)}
              </span>
            </div>

            {/* Index Number - positioned for balance */}
            <span className={`absolute -bottom-1 left-4 text-[9px] font-bold transition-all duration-500 ${activeSection === section.id ? 'text-primary-400 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`}>
              0{index + 1}
            </span>
          </button>
        ))}
      </div>

      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex lg:flex-1 items-center gap-2">
            <div className="w-10 h-10 bg-teal-accent rounded-none flex items-center justify-center shadow-lg shadow-teal-accent/20">
              <span className="text-white font-bold text-2xl tracking-tighter">A</span>
            </div>
            <Link to="/" className="-m-1.5 p-1.5 ring-offset-4 focus:outline-none focus:ring-2 focus:ring-teal-accent rounded transition-all hover:opacity-80">
              <span className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${isDarkTheme ? 'text-teal-accent' : 'text-slate-900'}`}>
                agri<span className="text-white">Audit</span>
              </span>
              <p className={`text-[9px] -mt-1 uppercase tracking-[0.3em] font-black opacity-80 transition-colors duration-300 ${isDarkTheme ? 'text-slate-300' : 'text-slate-500'}`}>
                Monitoring & Compliance
              </p>
            </Link>
          </div>

          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={`-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 transition-colors duration-300 ${isDarkTheme ? 'text-white' : 'text-slate-700'}`}
            >
              <span className="sr-only">Open main menu</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="hidden lg:flex lg:gap-x-10">
            {sections.slice(1).map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`text-sm font-semibold transition-colors duration-300 ${isDarkTheme ? 'text-slate-200 hover:text-white' : 'text-slate-700 hover:text-primary-600'}`}
              >
                {section.label}
              </button>
            ))}
            <a href="#contact" className={`text-sm font-semibold transition-colors duration-300 ${isDarkTheme ? 'text-slate-200 hover:text-white' : 'text-slate-700 hover:text-primary-600'}`}>Contact</a>
          </div>

          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-6">
            {user ? (
              <div className="flex items-center gap-x-4">
                <span className={`text-sm font-medium transition-colors duration-300 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>Welcome, {user.name}</span>
                <button onClick={handleLogout} className={`text-sm font-semibold transition-colors duration-300 ${isDarkTheme ? 'text-teal-accent hover:text-white' : 'text-slate-900 hover:text-teal-accent'}`}>Log out</button>
              </div>
            ) : (
              <Link to="/login" className={`text-sm font-semibold transition-colors duration-300 ${isDarkTheme ? 'text-teal-accent hover:text-white' : 'text-slate-900 hover:text-teal-accent'}`}>Log in</Link>
            )}
            <Link
              to={user ? "/dashboard" : "/register"}
              className="rounded-none bg-teal-accent px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-accent transition-all transform hover:scale-105"
            >
              Request a Demo
            </Link>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50">
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-[#14171a] p-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-accent rounded flex items-center justify-center text-white font-bold">A</div>
                  <span className="text-xl font-bold tracking-tight text-white">agri<span className="text-teal-accent">Audit</span></span>
                </div>
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="-m-2.5 rounded-md p-2.5 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="space-y-2 py-6">
                  {sections.slice(1).map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        scrollToSection(section.id);
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-base font-semibold text-slate-200 hover:bg-white/5 rounded-none"
                    >
                      {section.label}
                    </button>
                  ))}
                  <a href="#contact" className="block px-3 py-2 text-base font-semibold text-slate-200 hover:bg-white/5 rounded-none">Contact</a>
                </div>
                <div className="py-6 sm:hidden border-t border-white/5">
                  {user ? (
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-base font-semibold text-slate-200 hover:bg-white/5 rounded-none">Log out</button>
                  ) : (
                    <>
                      <Link to="/login" className="block px-3 py-2 text-base font-semibold text-slate-200 hover:bg-white/5 rounded-none">Log in</Link>
                      <Link to="/register" className="block px-3 py-2 text-base font-semibold text-white bg-teal-accent mt-4 rounded-none text-center">Get started</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="snap-container" ref={containerRef}>
        {/* Hero Section */}
        <section id="hero" className="snap-section relative min-h-screen flex flex-col lg:flex-row overflow-hidden">
          <div className="lg:w-1/2 bg-[#14171a] flex flex-col justify-center px-8 lg:pl-72 lg:pr-20 pt-48 pb-24 z-10 reveal">
            <div className="max-w-xl">
              <h1 className="text-4xl lg:text-[4rem] font-extrabold text-white leading-[1.1] mb-8 tracking-tighter">
                OPTIMIZING STEWARDSHIP, <br />
                <span className="text-teal-accent">ENSURING COMPLIANCE.</span>
              </h1>
              <p className="text-base lg:text-lg text-slate-300 mb-10 leading-relaxed">
                Precision Monitoring for Responsible Antimicrobial Use in Livestock.
                Our specialized software enables veterinarians and producers to effortlessly track, analyze, and report antimicrobial usage across all species.
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                <Link to="/register" className="bg-teal-accent text-[#14171a] px-8 py-4 rounded-none font-bold hover:bg-teal-accent/80 transition-all shadow-lg shadow-teal-accent/25 hover:shadow-teal-accent/40 transform hover:-translate-y-1">Request a Demo</Link>
                <Link to="/learn-more" className="bg-white/5 backdrop-blur-md text-white px-8 py-4 rounded-none font-bold border border-white/10 hover:bg-white/10 transition-all transform hover:-translate-y-1">Learn More</Link>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 relative h-[400px] lg:h-auto">
            <img
              src={heroFarm}
              alt="Veterinarian using software on farm"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#14171a] to-transparent lg:block hidden"></div>
          </div>
        </section>

        {/* Key Features Section */}
        <section id="features" className="snap-section py-32 bg-[#1c2025] relative overflow-hidden flex items-center">
          {/* Background pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:pl-72 lg:pr-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="reveal">
                <h2 className="text-base font-bold text-teal-accent tracking-wider uppercase mb-4">Key Features</h2>
                <div className="space-y-12">
                  <div className="flex gap-6 items-start group reveal" style={{ transitionDelay: '300ms' }}>
                    <div className="w-14 h-14 shrink-0 rounded-none bg-[#1c2025] border border-white/5 shadow-md flex items-center justify-center group-hover:bg-teal-accent group-hover:scale-110 transition-all duration-500">
                      <svg className="w-8 h-8 text-teal-accent group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M14 6L18 10M18 10L14 14M18 10H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-teal-accent">Multispecies Support</h3>
                      <p className="text-slate-400">Monitor usage across poultry, swine, cattle, and aquaculture with specialized tools for each sector.</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start group reveal" style={{ transitionDelay: '400ms' }}>
                    <div className="w-14 h-14 shrink-0 rounded-none bg-[#1c2025] border border-white/5 shadow-md flex items-center justify-center group-hover:bg-primary-600 group-hover:scale-110 transition-all duration-500">
                      <svg className="w-8 h-8 text-primary-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-teal-accent">Easy Data Capture</h3>
                      <p className="text-slate-400">Streamlined interface for quick recording of antimicrobial administrations directly on the field.</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start group reveal" style={{ transitionDelay: '500ms' }} >
                    <div className="w-14 h-14 shrink-0 rounded-none bg-[#1c2025] border border-white/5 shadow-md flex items-center justify-center group-hover:bg-teal-accent group-hover:scale-110 transition-all duration-500">
                      <svg className="w-8 h-8 text-teal-accent group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-teal-accent">Real-time Reporting & Dashboards</h3>
                      <p className="text-slate-400">Gain instant insights into usage trends and patterns with our robust analytical engine.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative reveal" style={{ transitionDelay: '200ms' }}>
                <div className="bg-[#1c2025] p-4 rounded-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/5 overflow-hidden transform hover:scale-[1.01] transition-all duration-700">
                  <header className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <span className="w-3 h-3 bg-teal-accent rounded-full"></span>
                      Dashboard
                    </h4>
                    <div className="flex gap-2">
                      <div className="w-8 h-2 bg-slate-100 rounded-none"></div>
                      <div className="w-4 h-2 bg-slate-100 rounded-none"></div>
                    </div>
                  </header>
                  <img src={dashboardMockup} alt="Software Dashboard Mockup" className="rounded-none" />
                </div>
                {/* Decorative blobs */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-200/50 rounded-full blur-3xl -z-10"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-200/50 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works / Process Flow */}
        <section id="process" className="snap-section py-32 bg-[#14171a] text-white reveal flex items-center">
          <div className="max-w-7xl mx-auto px-6 lg:pl-32 lg:pr-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-teal-accent">How it Works</h2>
              <p className="text-slate-400 text-lg font-medium">Earn insights between the laboratory data and antimicrobial use cases.</p>
            </div>

            <div className="relative">
              {/* Connector Line */}
              <div className="hidden lg:block absolute top-[60px] left-[15%] right-[15%] h-0.5 border-t-2 border-slate-100 border-dashed -z-10"></div>

              <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
                <div className="text-center">
                  <div className="w-28 h-28 mx-auto bg-[#1c2025] rounded-none border-2 border-white/5 p-2 mb-6 group hover:border-teal-accent transition-all duration-300">
                    <img src={labSamples} alt="Lab Insights" className="w-full h-full object-cover rounded-none opacity-80 group-hover:opacity-100" />
                  </div>
                  <h4 className="text-xl font-bold mb-2 text-teal-accent">Lab Insights</h4>
                  <p className="text-slate-400 text-sm">Analyze diagnostic data to understand resistance patterns.</p>
                </div>

                <div className="text-center">
                  <div className="w-28 h-28 mx-auto bg-[#1c2025] rounded-none border-2 border-white/5 flex items-center justify-center mb-6 group hover:border-teal-accent transition-all duration-300">
                    <svg className="w-12 h-12 text-teal-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold mb-2 text-teal-accent">Integrated Database</h4>
                  <p className="text-slate-400 text-sm">Centralize farm and treatment data in a secure cloud repository.</p>
                </div>

                <div className="text-center">
                  <div className="w-28 h-28 mx-auto bg-[#1c2025] rounded-none border-2 border-white/5 flex items-center justify-center mb-6 group hover:border-teal-accent transition-all duration-300 overflow-hidden">
                    <svg className="w-12 h-12 text-teal-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold mb-2 text-teal-accent">Field Implementation</h4>
                  <p className="text-slate-400 text-sm">Apply precise stewardship protocols based on data-driven evidence.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Advantages Section */}
        <section id="advantages" className="snap-section py-32 bg-[#14171a] relative overflow-hidden flex items-center">
          <div className="max-w-7xl mx-auto px-6 lg:pl-72 lg:pr-8 grid lg:grid-cols-2 gap-16 items-center relative z-10 reveal">
            <div>
              <h2 className="text-3xl font-bold mb-10 text-teal-accent uppercase tracking-tight">Advantages</h2>
              <ul className="space-y-6">
                {[
                  "Ensure Regulatory Compliance",
                  "Optimize Treatment Protocols",
                  "Enhance Animal Health Outcomes",
                  "Identify Areas for Improvement"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-slate-300 font-medium text-lg lg:text-xl">
                    <span className="w-8 h-8 rounded-full bg-teal-accent/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-teal-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-[400px]">
              <div className="absolute inset-0 bg-[#1c2025] rounded-none overflow-hidden shadow-xl border border-white/5">
                <img src={bacteriaAbstract} alt="Bacterial structures" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#14171a]/90 to-transparent"></div>
              </div>
              {/* Scientific Root Badge */}
              <div className="absolute -bottom-6 -right-6 bg-[#1c2025] p-6 rounded-none shadow-xl max-w-[200px] border border-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-teal-accent mb-2">Quality Assurance</p>
                <p className="text-[10px] text-slate-400">Born from Veterinary Science & Molecular Diagnostics.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="snap-section py-32 bg-[#14171a] text-white overflow-hidden relative flex items-center">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-teal-900/10 -skew-x-12 translate-x-20"></div>
          <div className="max-w-7xl mx-auto px-6 lg:pl-72 lg:pr-8 relative z-10 reveal">
            <h2 className="text-center text-teal-accent font-bold uppercase tracking-widest mb-16 underline decoration-teal-600 underline-offset-8">Testimonials</h2>
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-[#1c2025] p-10 rounded-none border border-slate-800 shadow-xl">
                <p className="text-slate-300 italic mb-10 text-lg leading-relaxed">
                  "The AMU Monitoring System transformed our clinical oversight. We can now visualize resistance trends across our entire client base in real-time, allowing for much more precise stewardship."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-none bg-slate-700 overflow-hidden ring-2 ring-teal-500/30">
                    <img src="https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=150&h=150" alt="Dr. Evelyn Reed" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="font-bold text-teal-accent">Dr. Sarah Johnson</h5>
                    <p className="text-teal-accent text-xs font-semibold uppercase">Senior Veterinarian, Swine Ops</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1c2025] p-10 rounded-none border border-slate-800 shadow-xl">
                <p className="text-slate-300 italic mb-10 text-lg leading-relaxed">
                  "Compliance reporting used to take us days. Now it's a matter of minutes. The platform has significantly reduced our manual data entry errors and improved our audit readiness."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-none bg-slate-700 overflow-hidden ring-2 ring-teal-500/30">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150" alt="Ben Carter" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="font-bold text-teal-accent">Liam O'Sullivan</h5>
                    <p className="text-teal-accent text-xs font-semibold uppercase">Commercial Farm Director</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer (as part of testimonials or separate) */}
        <section className="snap-section flex items-center bg-[#14171a] border-t border-white/5">
          <footer className="w-full py-12 lg:py-20">
            <div className="max-w-7xl mx-auto px-6 lg:pl-72 lg:pr-8">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                <div className="col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 bg-teal-accent rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-teal-accent/20">A</div>
                    <span className="text-xl font-bold tracking-tight text-white">agri<span className="text-teal-accent">Audit</span></span>
                  </div>
                  <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
                    Precision tools for responsible antimicrobial stewardship in the global livestock industry.
                  </p>
                  <div className="flex items-center gap-2 text-teal-accent font-bold text-sm bg-teal-accent/10 w-fit px-3 py-1 rounded-none border border-teal-accent/20">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Security Guaranteed
                  </div>
                </div>
                <div>
                  <h6 className="font-bold text-teal-accent mb-6 uppercase text-xs tracking-widest">Company</h6>
                  <ul className="space-y-4 text-sm text-slate-600">
                    <li><a href="#" className="hover:text-teal-accent transition-colors">About Us</a></li>
                    <li><a href="#" className="hover:text-teal-accent transition-colors">Career</a></li>
                    <li><a href="#" className="hover:text-teal-accent transition-colors">Blog</a></li>
                  </ul>
                </div>
                <div>
                  <h6 className="font-bold text-teal-accent mb-6 uppercase text-xs tracking-widest">Tools</h6>
                  <ul className="space-y-4 text-sm text-slate-600">
                    <li><a href="#" className="hover:text-teal-accent transition-colors">Features</a></li>
                    <li><a href="#" className="hover:text-teal-accent transition-colors">Pricing</a></li>
                    <li><a href="#" className="hover:text-teal-accent transition-colors">Demo</a></li>
                  </ul>
                </div>
                <div>
                  <h6 className="font-bold text-teal-accent mb-6 uppercase text-xs tracking-widest">Legal</h6>
                  <ul className="space-y-4 text-sm text-slate-600">
                    <li><a href="#" className="hover:text-teal-accent transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-teal-accent transition-colors">Terms of Service</a></li>
                    <li><a href="#" className="hover:text-teal-accent transition-colors">Contact</a></li>
                  </ul>
                </div>
              </div>
              <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-slate-400 text-xs">© 2026 agriAudit. All rights reserved.</p>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Powered by AgriTech Solutions</p>
              </div>
            </div>
          </footer>
        </section>
      </main>
    </div>
  )
}

export default Landing
