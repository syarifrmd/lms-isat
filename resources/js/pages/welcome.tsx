import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Award, TrendingUp, Users, ChevronRight, Play, BookOpen, Trophy, Zap, Target } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Head, router } from '@inertiajs/react';
import { register } from '@/routes';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Comprehensive Learning',
      description: 'Access to structured courses designed specifically for Direct Sales Executives',
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Gamification & Rewards',
      description: 'Earn badges, climb leaderboards, and get certified as you progress',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Interactive Training',
      description: 'Video tutorials, quizzes, and hands-on exercises for better learning',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Track Your Progress',
      description: 'Monitor your learning journey with detailed analytics and insights',
    },
  ];

  const stats = [
    { value: '500+', label: 'Active Learners' },
    { value: '50+', label: 'Training Modules' },
    { value: '95%', label: 'Completion Rate' },
    { value: '4.8/5', label: 'Average Rating' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-red-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 sm:space-x-3"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-red-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg sm:text-xl text-gray-800">Indosat LMS</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Learning Management System</p>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGetStarted}
              className="bg-gradient-to-r from-yellow-400 to-red-500 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <span className="text-sm sm:text-base">Get Started</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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
                className="inline-block bg-gradient-to-r from-yellow-100 to-red-100 px-4 py-2 rounded-full mb-6"
              >
                <p className="text-sm sm:text-base font-semibold text-red-600">
                  🚀 Empowering Direct Sales Excellence
                </p>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Master Your Skills,
                <br />
                <span className="bg-gradient-to-r from-yellow-500 to-red-500 bg-clip-text text-transparent">
                  Elevate Your Career
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                Join Indosat Ooredoo Hutchison's comprehensive learning platform designed exclusively
                for Direct Sales Executives. Learn at your own pace, earn certifications, and become
                a sales champion.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-yellow-400 to-red-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Start Learning Now</span>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-yellow-400 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Watch Demo</span>
                </motion.button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-12">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="text-center"
                  >
                    <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-red-500 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{stat.label}</p>
                  </motion.div>
                ))}
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
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-red-500 rounded-3xl transform rotate-6"></div>
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758691736067-b309ee3ef7b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHRyYWluaW5nJTIwdGVhbXxlbnwxfHx8fDE3NjYwNTA5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080"
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
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-red-500 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">New Badge!</p>
                    <p className="text-xs text-gray-600">Sales Champion</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -right-6 bottom-1/4 bg-white rounded-xl shadow-xl p-4 hidden xl:block"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Progress</p>
                    <p className="text-xs text-gray-600">85% Complete</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Indosat LMS?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to excel as a Direct Sales Executive, all in one platform
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-red-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-white">
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
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Start your learning journey in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                step: '01',
                title: 'Sign Up & Explore',
                description: 'Create your account and browse through our comprehensive course catalog tailored for DSE professionals.',
                icon: <Users className="w-8 h-8" />,
              },
              {
                step: '02',
                title: 'Learn & Practice',
                description: 'Watch video tutorials, complete interactive modules, and take quizzes to reinforce your knowledge.',
                icon: <BookOpen className="w-8 h-8" />,
              },
              {
                step: '03',
                title: 'Earn & Achieve',
                description: 'Get certified, earn badges, compete on leaderboards, and advance your career with proven skills.',
                icon: <Award className="w-8 h-8" />,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="inline-block mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full flex items-center justify-center text-white mb-4">
                      {item.icon}
                    </div>
                    <div className="text-6xl sm:text-7xl font-bold text-gray-100 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 right-0 transform translate-x-1/2">
                    <ChevronRight className="w-8 h-8 text-yellow-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-yellow-400 to-red-500">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 sm:mb-10">
            Join hundreds of Direct Sales Executives who are already advancing their careers with Indosat LMS
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted}
            className="bg-white text-red-600 px-8 sm:px-12 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 mx-auto"
          >
            <span>Get Started for Free</span>
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">About</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Connect</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Indosat Ooredoo Hutchison. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main Welcome component that wraps the LandingPage
export default function Welcome({ 
  canRegister = true 
}: { 
  canRegister?: boolean 
}) {
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
