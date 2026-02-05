import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// SafeIcon Component
const SafeIcon = ({ name, size = 24, className = '', color }) => {
  const Icon = window.lucideReact?.[name] || window.lucideReact?.HelpCircle
  if (!Icon) return null
  return <Icon size={size} className={className} color={color} />
}

// Web3Forms Hook
const useFormHandler = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const handleSubmit = async (e, accessKey) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsError(false)
    
    const formData = new FormData(e.target)
    formData.append('access_key', accessKey)
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsSuccess(true)
        e.target.reset()
      } else {
        setIsError(true)
        setErrorMessage(data.message || 'Что-то пошло не так')
      }
    } catch (error) {
      setIsError(true)
      setErrorMessage('Ошибка сети. Попробуйте снова.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const resetForm = () => {
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage('')
  }
  
  return { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm }
}

// FAQ Data for Chat
const FAQ_DATA = [
  {
    question: 'Какие услуги вы предлагаете?',
    answer: 'Мы предлагаем полный спектр архитектурных услуг: проектирование жилых и коммерческих зданий, дизайн интерьеров, ландшафтный дизайн, авторский надзор и реконструкция.',
    keywords: ['услуги', 'предлагаете', 'чем занимаетесь', 'услуга']
  },
  {
    question: 'Сколько стоит проект?',
    answer: 'Стоимость проекта рассчитывается индивидуально в зависимости от площади, сложности и сроков. Базовый проект дома начинается от 1500 руб/м². Оставьте заявку для точного расчета.',
    keywords: ['цена', 'стоит', 'стоимость', 'сколько', 'ценa']
  },
  {
    question: 'Как долго длится проектирование?',
    answer: 'Средний срок разработки архитектурного проекта — от 2 до 6 месяцев в зависимости от сложности объекта. Эскизный проект готовится за 2-3 недели.',
    keywords: ['срок', 'долго', 'время', 'когда', 'сроки']
  },
  {
    question: 'Работаете ли вы по всей России?',
    answer: 'Да, мы работаем по всей территории России и СНГ. Для удаленных проектов используем видеоконференции и выезд на объект при необходимости.',
    keywords: ['регион', 'город', 'россия', 'где', 'место']
  }
]

const SITE_CONTEXT = 'ARCHITECT — студия архитектуры и дизайна. Специализируемся на современной архитектуре, минимализме и функциональном дизайне. Портфолио включает жилые дома, общественные здания и интерьеры премиум-класса.'

// Map Component
const CleanMap = ({ coordinates = [37.6173, 55.7558], zoom = 12, markers = [] }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (map.current) return

    const styleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: coordinates,
      zoom: zoom,
      attributionControl: false,
      interactive: true,
      dragPan: true,
      dragRotate: false,
      touchZoomRotate: false,
      doubleClickZoom: true,
      keyboard: false
    })

    map.current.scrollZoom.disable()

    if (markers && markers.length > 0) {
      markers.forEach(marker => {
        const el = document.createElement('div')
        el.style.cssText = `
          width: 24px;
          height: 24px;
          background: #a3e635;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        `

        new maplibregl.Marker({ element: el })
          .setLngLat([marker.lng, marker.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(\`<strong style="color: #0f172a;">\${marker.title}</strong>\`))
          .addTo(map.current)
      })
    } else {
      const el = document.createElement('div')
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background: #a3e635;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `
      new maplibregl.Marker({ element: el })
        .setLngLat(coordinates)
        .addTo(map.current)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [coordinates, zoom, markers])

  return (
    <div className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden shadow-xl border border-white/10 relative">
      <style>{\`
        .maplibregl-ctrl-attrib { display: none !important; }
        .maplibregl-ctrl-logo { display: none !important; }
        .maplibregl-compact { display: none !important; }
      \`}</style>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  )
}

// Chat Widget Component
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Здравствуйте! Я виртуальный помощник ARCHITECT. Чем могу помочь?' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const findFAQAnswer = (input) => {
    const lowerInput = input.toLowerCase()
    for (const faq of FAQ_DATA) {
      if (faq.keywords.some(keyword => lowerInput.includes(keyword))) {
        return faq.answer
      }
    }
    return null
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage = inputValue.trim()
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])
    setInputValue('')
    setIsLoading(true)

    const faqAnswer = findFAQAnswer(userMessage)
    
    if (faqAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { type: 'bot', text: faqAnswer }])
        setIsLoading(false)
      }, 500)
    } else {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, context: SITE_CONTEXT })
        })
        
        if (response.ok) {
          const data = await response.json()
          setMessages(prev => [...prev, { type: 'bot', text: data.reply || 'Извините, я не смог обработать ваш запрос. Попробуйте переформулировать вопрос или свяжитесь с нами по телефону.' }])
        } else {
          throw new Error('API Error')
        }
      } catch (error) {
        setMessages(prev => [...prev, { 
          type: 'bot', 
          text: 'К сожалению, я не нашел ответа на ваш вопрос. Рекомендую посмотреть раздел FAQ или оставить заявку — наш архитектор свяжется с вами лично.' 
        }])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-full shadow-lg shadow-lime-400/30 flex items-center justify-center transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <SafeIcon name="x" size={24} /> : <SafeIcon name="message-square" size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-lime-400 text-slate-950 p-4 flex items-center gap-3">
              <SafeIcon name="bot" size={24} />
              <div>
                <h3 className="font-bold font-display">ARCHITECT AI</h3>
                <p className="text-xs opacity-80">Онлайн помощник</p>
              </div>
            </div>
            
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-950">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={\`flex \${msg.type === 'user' ? 'justify-end' : 'justify-start'}\`}
                >
                  <div className={\`max-w-[80%] p-3 rounded-2xl text-sm \${

[msg.type === 'user' ? 'bg-lime-400 text-slate-950 rounded-br-none' : 'bg-white/10 text-white rounded-bl-none']}\`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-3 rounded-2xl rounded-bl-none flex gap-1">
                    <span className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 bg-slate-900 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите сообщение..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 transition-colors"
              />
              <button
                onClick={handleSend}
                className="w-10 h-10 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg flex items-center justify-center transition-colors"
              >
                <SafeIcon name="send" size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Navigation Component
const Navigation = () => {
  const [activeSection, setActiveSection] = useState('hero')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'hero', label: 'Главная' },
    { id: 'portfolio', label: 'Портфолио' },
    { id: 'about', label: 'О студии' },
    { id: 'blog', label: 'Блог' },
    { id: 'contact', label: 'Контакты' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => document.getElementById(item.id))
      const scrollPosition = window.scrollY + 200
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id)
          break
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      {/* Desktop Vertical Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-screen w-20 bg-slate-950 border-r border-white/10 z-40 flex-col items-center py-8">
        <div className="mb-12">
          <span className="text-2xl font-black font-display text-white vertical-text tracking-widest">ARCHITECT</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={\`group relative p-3 rounded-xl transition-all duration-300 \${

[activeSection === item.id ? 'bg-lime-400 text-slate-950' : 'text-gray-400 hover:text-white hover:bg-white/5']}\`}
            >
              <div className={\`w-2 h-2 rounded-full transition-all duration-300 \${

[activeSection === item.id ? 'bg-slate-950' : 'bg-current']}\`} />
              <span className="absolute left-full ml-4 px-3 py-1 bg-lime-400 text-slate-950 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
              </span>
            </button>
          ))}
        </div>
        
        <div className="mt-auto">
          <div className="w-8 h-8 border-2 border-lime-400 rounded-full flex items-center justify-center">
            <span className="text-lime-400 text-xs font-bold">A</span>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 z-40 flex items-center justify-between px-4">
        <span className="text-xl font-black font-display text-white tracking-widest">ARCHITECT</span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 flex items-center justify-center text-white"
        >
          <SafeIcon name={isMobileMenuOpen ? 'x' : 'menu'} size={24} />
        </button>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed top-16 left-0 right-0 bg-slate-950 border-b border-white/10 z-30 p-4"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={\`px-4 py-3 rounded-lg text-left font-medium transition-colors \${

[activeSection === item.id ? 'bg-lime-400 text-slate-950' : 'text-gray-400 hover:text-white hover:bg-white/5']}\`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Section Component with Animation
const AnimatedSection = ({ children, className = '', id }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  
  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// Hero Section
const HeroSection = () => {
  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden lg:pl-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(163,230,53,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.03),transparent_50%)]" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-4xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px w-16 bg-lime-400" />
            <span className="text-lime-400 font-medium tracking-widest uppercase text-sm">Архитектурная студия</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-display text-white leading-[0.9] tracking-tight mb-8">
            СОЗДАЕМ
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-yellow-300">
              ПРОСТРАНСТВА
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl leading-relaxed mb-12">
            Мы проектируем здания, которые становятся частью ландшафта. 
            Минимализм, функциональность и вечная эстетика — наши принципы.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button className="group bg-lime-400 hover:bg-lime-500 text-slate-950 px-8 py-4 rounded-none font-bold text-sm tracking-wider uppercase transition-all flex items-center gap-3">
              Смотреть проекты
              <SafeIcon name="arrow-right" size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="border border-white/20 hover:border-lime-400 text-white px-8 py-4 rounded-none font-medium text-sm tracking-wider uppercase transition-all hover:bg-white/5">
              О студии
            </button>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-3/4 hidden lg:block"
        >
          <img 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80" 
            alt="Modern Architecture"
            className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent" />
        </motion.div>
      </div>
      
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500"
      >
        <SafeIcon name="chevron-down" size={32} />
      </motion.div>
    </section>
  )
}

// Portfolio Section
const PortfolioSection = () => {
  const projects = [
    { id: 1, title: 'VILLA NOVA', category: 'Жилой дом', year: '2024', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80' },
    { id: 2, title: 'CUBE OFFICE', category: 'Офисное здание', year: '2023', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80' },
    { id: 3, title: 'GLASS HOUSE', category: 'Интерьер', year: '2023', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80' },
    { id: 4, title: 'URBAN LOFT', category: 'Реконструкция', year: '2022', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80' },
    { id: 5, title: 'SKY GARDEN', category: 'Ландшафт', year: '2024', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80' },
    { id: 6, title: 'MINIMAL HOME', category: 'Жилой дом', year: '2023', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80' },
  ]

  return (
    <AnimatedSection id="portfolio" className="py-24 lg:pl-20 bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-end justify-between mb-16">
          <div>
            <span className="text-lime-400 font-medium tracking-widest uppercase text-sm mb-4 block">Работы</span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-display text-white tracking-tight">
              ПОРТФОЛИО
            </h2>
          </div>
          <button className="hidden sm:flex items-center gap-2 text-gray-400 hover:text-lime-400 transition-colors group">
            Все проекты
            <SafeIcon name="arrow-right" size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative aspect-[4/5] overflow-hidden cursor-pointer geometric-border bg-slate-900"
            >
              <img 
                src={project.image} 
                alt={project.title}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lime-400 text-xs font-bold tracking-wider">{project.category}</span>
                  <span className="text-gray-500 text-xs">• {project.year}</span>
                </div>
                <h3 className="text-2xl font-bold font-display text-white mb-4">{project.title}</h3>
                <div className="flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">Подробнее</span>
                  <SafeIcon name="arrow-up-right" size={16} className="text-lime-400" />
                </div>
              </div>
              
              <div className="absolute top-4 right-4 w-10 h-10 border border-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-sm">
                <SafeIcon name="plus" size={20} className="text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  )
}

// About Section
const AboutSection = () => {
  const stats = [
    { value: '15+', label: 'Лет опыта' },
    { value: '120+', label: 'Проектов' },
    { value: '45', label: 'Наград' },
    { value: '98%', label: 'Довольных клиентов' },
  ]

  return (
    <AnimatedSection id="about" className="py-24 lg:pl-20 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(163,230,53,0.05),transparent_50%)]" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-lime-400 font-medium tracking-widest uppercase text-sm mb-4 block">О нас</span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-display text-white tracking-tight mb-8">
              АРХИТЕКТУРА
              <span className="block text-gray-500">КАК ИСКУССТВО</span>
            </h2>
            
            <div className="space-y-6 text-gray-400 leading-relaxed">
              <p>
                ARCHITECT — это команда архитекторов и дизайнеров, объединенных идеей создания 
                пространств, которые вдохновляют. Мы верим, что хорошая архитектура должна 
                быть функциональной, эстетичной и гармонично вписываться в окружающую среду.
              </p>
              <p>
                Наш подход основан на тщательном анализе потребностей клиента, изучении контекста 
                и поиске оптимальных решений. Мы не следуем трендам — мы создаем архитектуру, 
                которая останется актуальной десятилетиями.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center sm:text-left"
                >
                  <div className="text-3xl sm:text-4xl font-black font-display text-lime-400 mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-[3/4] geometric-border overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80" 
                alt="Lead Architect"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-lime-400 text-slate-950 p-6 max-w-xs">
              <p className="font-display font-bold text-lg leading-tight mb-2">АЛЕКСАНДР МОРОЗОВ</p>
              <p className="text-sm opacity-80">Основатель и главный архитектор</p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

// Blog Section
const BlogSection = () => {
  const posts = [
    { 
      id: 1, 
      title: 'Минимализм в архитектуре: меньше — значит больше', 
      excerpt: 'Почему современная архитектура все чаще обращается к простым формам и чистым линиям.',
      date: '15 ЯНВ 2024',
      category: 'Теория',
      image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600&q=80'
    },
    { 
      id: 2, 
      title: 'Экологичное строительство: тренды 2024', 
      excerpt: 'Как современные технологии позволяют создавать здания с минимальным воздействием на природу.',
      date: '08 ЯНВ 2024',
      category: 'Технологии',
      image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=600&q=80'
    },
    { 
      id: 3, 
      title: 'Открытие нового офиса в Москве', 
      excerpt: 'Расширяем географию присутствия: теперь мы работаем с клиентами в Центральном федеральном округе.',
      date: '20 ДЕК 2023',
      category: 'Новости',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80'
    },
  ]

  return (
    <AnimatedSection id="blog" className="py-24 lg:pl-20 bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="text-center mb-16">
          <span className="text-lime-400 font-medium tracking-widest uppercase text-sm mb-4 block">Мысли</span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-display text-white tracking-tight">
            БЛОГ И НОВОСТИ
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="aspect-[16/10] overflow-hidden geometric-border mb-6">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
              </div>
              
              <div className="flex items-center gap-4 mb-4 text-xs">
                <span className="text-lime-400 font-bold uppercase tracking-wider">{post.category}</span>
                <span className="text-gray-500">{post.date}</span>
              </div>
              
              <h3 className="text-xl font-bold font-display text-white mb-3 group-hover:text-lime-400 transition-colors leading-tight">
                {post.title}
              </h3>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {post.excerpt}
              </p>
              
              <div className="flex items-center gap-2 text-white text-sm font-medium group-hover:gap-3 transition-all">
                Читать далее
                <SafeIcon name="arrow-right" size={16} className="text-lime-400" />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </AnimatedSection>
  )
}

// Contact Section
const ContactSection = () => {
  const { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm } = useFormHandler()
  const ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY' // Replace with your Web3Forms Access Key from https://web3forms.com

  return (
    <AnimatedSection id="contact" className="py-24 lg:pl-20 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(163,230,53,0.05),transparent_50%)]" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <span className="text-lime-400 font-medium tracking-widest uppercase text-sm mb-4 block">Контакты</span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-display text-white tracking-tight mb-8">
              ДАВАЙТЕ
              <span className="block text-gray-500">ОБСУДИМ ПРОЕКТ</span>
            </h2>
            
            <p className="text-gray-400 leading-relaxed mb-12 max-w-lg">
              Готовы начать работу над вашим проектом? Оставьте заявку, и мы свяжемся с вами 
              в течение 24 часов для обсуждения деталей.
            </p>
            
            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-lime-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <SafeIcon name="map-pin" size={20} className="text-lime-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Адрес</h4>
                  <p className="text-gray-400 text-sm">г. Москва, ул. Архитекторов, 15, офис 402</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-lime-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <SafeIcon name="phone" size={20} className="text-lime-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Телефон</h4>
                  <p className="text-gray-400 text-sm">+7 (495) 123-45-67</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-lime-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <SafeIcon name="mail" size={20} className="text-lime-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Email</h4>
                  <p className="text-gray-400 text-sm">hello@architect.studio</p>
                </div>
              </div>
            </div>
            
            <div className="h-64 rounded-2xl overflow-hidden border border-white/10">
              <CleanMap 
                coordinates={[37.6173, 55.7558]} 
                zoom={13}
                markers={[{ lng: 37.6173, lat: 55.7558, title: 'ARCHITECT Studio' }]}
              />
            </div>
          </div>
          
          <div className="glass-panel p-8 rounded-2xl">
            <h3 className="text-2xl font-bold font-display text-white mb-6">Оставить заявку</h3>
            
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={(e) => handleSubmit(e, ACCESS_KEY)}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ваше имя</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 transition-colors"
                      placeholder="Иван Иванов"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 transition-colors"
                      placeholder="ivan@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Тип проекта</label>
                    <select
                      name="project_type"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-lime-400 transition-colors"
                    >
                      <option value="" className="bg-slate-900">Выберите тип</option>
                      <option value="house" className="bg-slate-900">Жилой дом</option>
                      <option value="apartment" className="bg-slate-900">Квартира</option>
                      <option value="office" className="bg-slate-900">Офис</option>
                      <option value="other" className="bg-slate-900">Другое</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Сообщение</label>
                    <textarea
                      name="message"
                      rows="4"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 transition-colors resize-none"
                      placeholder="Расскажите о вашем проекте..."
                    ></textarea>
                  </div>
                  
                  {isError && (
                    <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                      {errorMessage}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-lime-400 hover:bg-lime-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-slate-950 px-8 py-4 rounded-lg font-bold transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                        Отправка...
                      </>
                    ) : (
                      <>
                        <SafeIcon name="send" size={18} />
                        Отправить заявку
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="text-center py-12"
                >
                  <div className="bg-lime-400/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <SafeIcon name="check-circle" size={40} className="text-lime-400" />
                  </div>
                  <h3 className="text-3xl font-bold font-display text-white mb-4">
                    Заявка отправлена!
                  </h3>
                  <p className="text-gray-400 mb-8">
                    Спасибо за обращение. Мы свяжемся с вами в ближайшее время.
                  </p>
                  <button
                    onClick={resetForm}
                    className="text-lime-400 hover:text-lime-500 font-semibold transition-colors"
                  >
                    Отправить еще одну заявку
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

// Footer
const Footer = () => {
  return (
    <footer className="py-12 lg:pl-20 bg-slate-950 border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-lime-400 rounded-full flex items-center justify-center">
              <span className="text-lime-400 font-bold font-display">A</span>
            </div>
            <span className="text-xl font-black font-display text-white tracking-widest">ARCHITECT</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-400 hover:text-lime-400 transition-colors">
              <SafeIcon name="instagram" size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-lime-400 transition-colors">
              <SafeIcon name="facebook" size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-lime-400 transition-colors">
              <SafeIcon name="linkedin" size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-lime-400 transition-colors">
              <SafeIcon name="twitter" size={20} />
            </a>
          </div>
          
          <p className="text-gray-500 text-sm">
            © 2024 ARCHITECT. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}

// Main App
function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navigation />
      <main className="mobile-safe-container">
        <HeroSection />
        <PortfolioSection />
        <AboutSection />
        <BlogSection />
        <ContactSection />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

export default App