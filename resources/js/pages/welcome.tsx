import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, TrendingUp, Users, ChevronRight, BookOpen, Trophy, Zap, Target } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Head, router } from '@inertiajs/react';
import '../../css/indosat.css';
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
    icon: workflowIcons[index],
    sClass: index === 0 ? 's1' : index === 1 ? 's2' : 's3'
  }));

  return (
    <div className="w-container">
      {/* Navigation */}
      <nav className="nav">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="logo-wrap"
        >
          <img 
            src="https://prod-talentics-storage.s3.ap-southeast-1.amazonaws.com/organizations/110284/logos/1648697982_4de97d5a7c04a252d442a320bf625037a16fe803.png" 
            alt="Indosat Logo" 
            style={{ height: '34px', width: '34px', objectFit: 'contain' }}
          />
          <div>
            <h1 className="logo-name">Indosat LMS</h1>
            <p className="logo-sub">{t.nav.subtitle}</p>
          </div>
        </motion.div>

        <div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted}
            className="nav-btn"
          >
            <span>{t.nav.getStarted}</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>

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
            className="hero-eyebrow"
          >
            <p>{t.hero.badge}</p>
          </motion.div>

          <h1 className="hero-h1">
            {t.hero.titleLine1}
            <span>{t.hero.titleLine2}</span>
          </h1>

          <p className="hero-desc">
            {t.hero.description}
          </p>

          <div className="hero-cta-row">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGetStarted}
              className="btn-primary"
            >
              <span>{t.hero.ctaPrimary}</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            {t.hero.stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="stat-item"
              >
                <p className="stat-num">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Content - Image */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="hero-right"
        >
          <div className="hero-img-frame">
            <ImageWithFallback
              src="/assets/team.jpg"
              alt="Team Training"
            />
          </div>

          {/* Floating Cards */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="float-card tl"
          >
            <div className="fc-icon pk">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="fc-main">{t.floating.badgeTitle}</p>
              <p className="fc-sub">{t.floating.badgeDesc}</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            className="float-card br"
          >
            <div className="fc-icon tl2">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="fc-main">{t.floating.progressTitle}</p>
              <p className="fc-sub">{t.floating.progressDesc}</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="why-sec">
        <div className="blob blob-4"></div>
        <div className="blob blob-5"></div>

        <div className="sec-head">
          <span className="sec-eyebrow">FEATURES</span>
          <h2 className="sec-title">{t.features.title}</h2>
          <p className="sec-sub">{t.features.subtitle}</p>
        </div>

        <div className="feat-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="feat-card"
            >
              <div className="feat-icon">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="how-sec">
        <div className="blob blob-6"></div>

        <div className="sec-head">
          <h2 className="sec-title">{t.howItWorks.title}</h2>
          <p className="sec-sub">{t.howItWorks.subtitle}</p>
        </div>

        <div className="steps-wrap">
          {workflowSteps.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className={`step-card ${item.sClass}`}
            >
              <div className="step-num">{item.step}</div>
              <div className="step-icon">
                {item.icon}
              </div>
              <h3 className="step-title">{item.title}</h3>
              <p className="step-desc">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

     {/* CTA Section */}
      <motion.section 
        className="cta-wrap"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="cta-band">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {t.cta.title}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            {t.cta.subtitle}
          </motion.p>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="footer-sec">
        <div className="footer-grid">
          <div className="footer-col">
            <h3>{t.footer.about}</h3>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>{t.footer.resources}</h3>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>{t.footer.legal}</h3>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>{t.footer.connect}</h3>
            <ul>
              <li><a href="#">Facebook</a></li>
              <li><a href="#">Twitter</a></li>
              <li><a href="#">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Indosat Ooredoo Hutchison. {t.footer.rights}</p>
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