import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, TrendingUp, Users, ChevronRight, BookOpen, Trophy, Zap, Target, Languages } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Head, router } from '@inertiajs/react';
import { register } from '@/routes';

// Definisi type bahasa
type Language = 'id' | 'en';

// Kamus terjemahan
const translations = {
  id: {
    nav: {
      subtitle: 'Sistem Manajemen Pembelajaran',
      getStarted: 'Mulai Sekarang',
    },
    hero: {
      badge: 'Circle Java Learning Hub',
      titleLine1: 'Empowering People,',
      titleLine2: 'Driving Excellence',
      description: 'Platform pembelajaran resmi Circle Java untuk mendukung pengembangan kompetensi, leadership dan performa kerja secara berkelanjutan.',
      ctaPrimary: 'Mulai Belajar',
      stats: [
        { value: '500+', label: 'Pelajar Aktif' },
        { value: '50+', label: 'Modul Pelatihan' },
        { value: '95%', label: 'Tingkat Penyelesaian' },
        { value: '4.8/5', label: 'Rata-rata Rating' },
      ]
    },
    floating: {
      badgeTitle: 'Lencana Baru!',
      badgeDesc: 'Juara Penjualan',
      progressTitle: 'Progres',
      progressDesc: '85% Selesai'
    },
    features: {
      title: 'Mengapa Memilih Indosat LMS?',
      subtitle: 'Belajar lebih mudah, berkembang lebih cepat, dan bertumbuh bersama dalam satu ekosistem pembelajaran digital.',
      items: [
        {
          title: 'Pembelajaran Komprehensif',
          description: 'Akses materi dan program pembelajaran terstruktur untuk mendukung pengembangan kompetensi dan kinerja profesional.',
        },
        {
          title: 'Gamifikasi & Hadiah',
          description: 'Raih sertifikasi dan apresiasi sebagai bentuk pengakuan atas perkembangan kemampuan dan pembelajaran Anda.',
        },
        {
          title: 'Pelatihan Interaktif',
          description: 'Materi pembelajaran berbasis video, kuis, dan simulasi praktik untuk mendukung pengembangan kompetensi secara optimal.',
        },
        {
          title: 'Pantau Progres Anda',
          description: 'Pantau perkembangan pembelajaran Anda melalui analitik dan insight yang komprehensif.',
        },
      ]
    },
    howItWorks: {
      title: 'Cara Kerja',
      subtitle: 'Mulai perjalanan belajar Anda dalam tiga langkah sederhana',
      steps: [
        {
          title: 'Daftar & Mulai Belajar',
          description: 'Buat akun Anda dan jelajahi berbagai program pembelajaran yang dirancang untuk mendukung pengembangan kompetensi profesional.',
        },
        {
          title: 'Belajar & Berlatih',
          description: 'Tonton video tutorial, selesaikan modul interaktif, dan ikuti kuis untuk memperkuat pengetahuan Anda.',
        },
        {
          title: 'Raih & Capai',
          description: 'Dapatkan sertifikasi, raih lencana, bersaing di papan peringkat, dan majukan karir Anda dengan keterampilan terbukti.',
        },
      ]
    },
    cta: {
      title: 'Siap Mengembangkan Potensi Anda??',
      subtitle: 'Bergabunglah dalam platform pembelajaran Indosat Ooredoo Hutchison untuk meningkatkan kompetensi, memperluas wawasan, dan mendukung performa terbaik Anda.',
    },
    footer: {
      about: 'Tentang',
      resources: 'Sumber Daya',
      legal: 'Hukum',
      connect: 'Hubungan',
      rights: 'Hak cipta dilindungi undang-undang.'
    }
  },
  en: {
    nav: {
      subtitle: 'Learning Management System',
      getStarted: 'Get Started',
    },
    hero: {
      badge: 'Empowering Direct Sales Excellence',
      titleLine1: 'Master Your Skills,',
      titleLine2: 'Elevate Your Career',
      description: 'Join Indosat Ooredoo Hutchison\'s comprehensive learning platform designed exclusively for Direct Sales Executives. Learn at your own pace, earn certifications, and become a sales champion.',
      ctaPrimary: 'Start Learning Now',
      stats: [
        { value: '500+', label: 'Active Learners' },
        { value: '50+', label: 'Training Modules' },
        { value: '95%', label: 'Completion Rate' },
        { value: '4.8/5', label: 'Average Rating' },
      ]
    },
    floating: {
      badgeTitle: 'New Badge!',
      badgeDesc: 'Sales Champion',
      progressTitle: 'Progress',
      progressDesc: '85% Complete'
    },
    features: {
      title: 'Why Choose Indosat LMS?',
      subtitle: 'Everything you need to excel as a Direct Sales Executive, all in one platform',
      items: [
        {
          title: 'Comprehensive Learning',
          description: 'Access to structured courses designed specifically for Direct Sales Executives',
        },
        {
          title: 'Gamification & Rewards',
          description: 'Earn badges, climb leaderboards, and get certified as you progress',
        },
        {
          title: 'Interactive Training',
          description: 'Video tutorials, quizzes, and hands-on exercises for better learning',
        },
        {
          title: 'Track Your Progress',
          description: 'Monitor your learning journey with detailed analytics and insights',
        },
      ]
    },
    howItWorks: {
      title: 'How It Works',
      subtitle: 'Start your learning journey in three simple steps',
      steps: [
        {
          title: 'Sign Up & Explore',
          description: 'Create your account and browse through our comprehensive course catalog tailored for DSE professionals.',
        },
        {
          title: 'Learn & Practice',
          description: 'Watch video tutorials, complete interactive modules, and take quizzes to reinforce your knowledge.',
        },
        {
          title: 'Earn & Achieve',
          description: 'Get certified, earn badges, compete on leaderboards, and advance your career with proven skills.',
        },
      ]
    },
    cta: {
      title: 'Ready to Transform Your Career?',
      subtitle: 'Join hundreds of Direct Sales Executives who are already advancing their careers with Indosat LMS',
      button: 'Get Started for Free'
    },
    footer: {
      about: 'About',
      resources: 'Resources',
      legal: 'Legal',
      connect: 'Connect',
      rights: 'All rights reserved.'
    }
  }
};

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const t = translations['id'];

  // Feature icons mapping remains static
  const featureIcons = [
    <BookOpen className="w-8 h-8" />,
    <Trophy className="w-8 h-8" />,
    <Zap className="w-8 h-8" />,
    <Target className="w-8 h-8" />,
  ];

  // How it works icons mapping
  const workflowIcons = [
    <Users className="w-8 h-8" />,
    <BookOpen className="w-8 h-8" />,
    <Award className="w-8 h-8" />,
  ];

  const features = t.features.items.map((item, index) => ({
    ...item,
    icon: featureIcons[index]
  }));

  const workflowSteps = t.howItWorks.steps.map((item, index) => ({
    ...item,
    step: `0${index + 1}`,
    icon: workflowIcons[index]
  }));

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 sm:space-x-3"
            >
              <img
                src="https://prod-talentics-storage.s3.ap-southeast-1.amazonaws.com/organizations/110284/logos/1648697982_4de97d5a7c04a252d442a320bf625037a16fe803.png"
                alt="Indosat Logo"
                className="h-8 w-8 shrink-0 object-contain"
              />
              <div>
                <h1 className="font-bold text-lg sm:text-xl text-gray-800">Indosat LMS</h1>
                <p className="text-xs text-gray-600 hidden sm:block">{t.nav.subtitle}</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-3">
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="bg-gradient-to-r from-[#ec008c] to-[#c6168d] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold hover:shadow-xl hover:shadow-[#ec008c]/50 transition-all duration-300 flex items-center space-x-2"
              >
                <span className="text-sm sm:text-base">{t.nav.getStarted}</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-[#ffb600]/10 blur-[30px] pointer-events-none"></div>
        <div className="absolute top-[-5%] right-[-5%] w-[50%] h-[60%] rounded-full bg-[#e6007e]/10 blur-[30px] pointer-events-none"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[35%] h-[40%] rounded-full bg-cyan-400/10 blur-[30px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-red-100 px-4 py-2 rounded-full mb-6"
              >
                <p className="text-sm sm:text-base font-semibold text-[#ed1c24]">
                  {t.hero.badge}
                </p>
                <img src="/assets/logoelang.png" alt="Logo Elang" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {t.hero.titleLine1}
                <br />
                <span className="text-[#ed1c24]">
                  {t.hero.titleLine2}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                {t.hero.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-[#ec008c] to-[#c6168d] text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl hover:shadow-[#ec008c]/50 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>{t.hero.ctaPrimary}</span>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>

              </div>

              {/* Stats */}
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mt-12 relative z-10 border border-gray-50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 sm:gap-y-0">
                  {t.hero.stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={`text-center px-2 sm:px-4 ${index % 2 === 0 ? 'border-r-2 border-gray-100 sm:border-r-0' : ''
                        } ${index !== 3 ? 'sm:border-r-2 sm:border-gray-100' : ''
                        }`}
                    >
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#ec008c] to-[#c6168d] bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Content - Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white bg-gradient-to-br from-[#ffcb08]/40 via-[#25bdad]/40 to-[#ed1c24]/40 rounded-3xl transform rotate-6 shadow-xl border-2 border-[#f79dd2]"></div>
                <ImageWithFallback
                  src="/assets/team.jpg"
                  alt="Team Training"
                  className="relative rounded-3xl shadow-2xl w-full h-auto object-cover"
                />
              </div>

              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -left-6 top-1/4 bg-white rounded-xl shadow-xl p-4 hidden xl:block"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#ec008c] to-[#c6168d] rounded-lg flex items-center justify-center shadow-lg shadow-[#ec008c]/50">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.floating.badgeTitle}</p>
                    <p className="text-xs text-gray-600">{t.floating.badgeDesc}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -right-6 bottom-1/4 bg-white rounded-xl shadow-xl p-4 hidden xl:block"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#f46369] to-[#ed1c24] rounded-lg flex items-center justify-center shadow-lg shadow-[#ed1c24]/50">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.floating.progressTitle}</p>
                    <p className="text-xs text-gray-600">{t.floating.progressDesc}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-[10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-cyan-400/10 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[60%] rounded-full bg-[#ffb600]/10 blur-[130px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t.features.title}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-pink-50 rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-[#ec008c]">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-[-5%] right-[-5%] w-[50%] h-[60%] rounded-full bg-[#e6007e]/10 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-cyan-400/10 blur-[130px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t.howItWorks.title}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              {t.howItWorks.subtitle}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            {workflowSteps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center relative z-10 h-full">
                  <div className="inline-block mb-6 relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-pink-50 rounded-full flex items-center justify-center text-[#ec008c] mx-auto relative z-10">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 lg:-right-6 transform translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-md items-center justify-center border border-pink-50">
                    <ChevronRight className="w-6 h-6 text-[#ec008c]" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#ec008c] to-[#c6168d] overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[50%] h-[70%] rounded-full bg-[#ff4dc4]/90 blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[80%] rounded-full bg-[#FFC600]/90 blur-[120px] pointer-events-none"></div>

        <motion.img
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          src="https://prod-talentics-storage.s3.ap-southeast-1.amazonaws.com/organizations/110284/logos/1648697982_4de97d5a7c04a252d442a320bf625037a16fe803.png"
          alt="Indosat Logo Background"
          className="absolute -bottom-10 -right-10 h-40 w-40 opacity-40 sm:opacity-50 sm:-bottom-16 sm:-right-16 sm:h-56 sm:w-56 md:-bottom-22 md:-right-22 md:h-72 md:w-72 lg:opacity-100 lg:-bottom-24 lg:-right-24 lg:h-[400px] lg:w-[400px] object-contain pointer-events-none drop-shadow-2xl"
        />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              {t.cta.title}
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8 sm:mb-10">
              {t.cta.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">{t.footer.about}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">{t.footer.resources}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">{t.footer.legal}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">{t.footer.connect}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-[#ec008c] transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Indosat Ooredoo Hutchison. {t.footer.rights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main Welcome component that wraps the LandingPage
export default function Welcome() {
  const handleGetStarted = () => {
    router.visit(register.url());
  };

  return (
    <>
      <Head title="Welcome to Indosat LMS" />
      <LandingPage onGetStarted={handleGetStarted} />
    </>
  );
}
